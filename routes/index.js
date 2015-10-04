/*
  This script has been modified so that it uses Mongoose.
  The schemas and compiled models are accessible through the entities script.
  The route handlers have been modified so that instead of calling the functions in this script, we delegate the processing to dedicated
  handler-scripts in the routes directory (e.g. users.js, meterreadings.js, etc).
*/

var passport = require('passport');
var Authorizer = require('../utils/authorizer.js');
//used to handle the upload of evidence files (images)
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var async = require('async');

var _ = require('lodash');

var uploadDone = false;
var UsersManager = require('../routes/users.js');
var Properties = require('../routes/properties.js');
var MeterReadings = require('../routes/meterreadings.js');
var PasswordResetRequestsHandler = require('./resets.js');
var Notifications = require('../routes/notifications.js');
var SmartCitizensGCM = require('../routes/gcm.js');
var TrafficLightsSpotter = require('../routes/trafficlights.js');


/*
  The index.js plays the router role in this design. It gets passed the Application object from
  app.js. It then delegates handlers for the routes as needed.
*/

module.exports = function(app, entities) {

  /* Service Entry Point */

  app.get('/', function(req, res) {
    res.render('index.ejs', {
      user: req.user,
      title: "Smart CitizenS"
    });
  });

  /* GET home page. */
  app.get('/home', Authorizer.isAuthenticated, function(req, res) {

    var loggedInUser = req.user;

    res.render('main.ejs', {
      title: "Smart CitizenS ::.Home.::",
      user: loggedInUser
    });

  });
  /*    User Accounts Management API    */

  /* GET SignUp form */
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', {
      title: 'SignUp New Citizen'
    });
  });

  //this route is for testing purposes [will probably go at some point]
  app.post('/register', function(req, res) {
    res.send("Your Request is noted...");
  });

  //create new user (signup)
  app.post('/api/users', function(req, res, next) {
    req.body.baseFolder = app.get('evidence_dir');
    next();
  }, UsersManager.apiAddUser);
  app.post('/users', function(req, res, next) {
    req.body.baseFolder = app.get('evidence_dir');
    next();
  }, UsersManager.add);

  //read [one, some]
  app.get('/users/:id', Authorizer.isAuthenticated, function(req, res) {
    var userId = req.params.id;
    UsersManager.getUserById(userId, function(err, userModel) {
      if (!err && userModel) {
        //render the user-details view
        //res.render('userdisplay', {'user':userModel, title:'User Details'});
        res.send(userModel);
      } else {
        res.send("There was a problem retrieving User. Could be the User was not found.");
      }
    });
  });

  //list all users
  app.get('/users', Authorizer.isAuthenticated, function(req, res) {
    UsersManager.list(function(err, users) {
      if (!err && users) {
        //render the user-details view
        res.render('userdisplay', {
          'user': users[0],
          title: 'List of Users - Test'
        });
        //res.send(users[0]);
      } else {
        res.send("There was a problem retrieving Users. Could be there are no users? " + err);
      }
    });
  });
  //update
  app.put('/users/:id', Authorizer.isAuthenticated, function(req, res) {
    var userId = req.params.id;
    var values = req.body;
    UsersManager.updateAccount(userId, values, function(err, updatedAccount) {
      if (!err && updatedAccount) {
        res.send(updatedAccount);
      } else {
        res.send("There was a problem updating Users. " + err);
      }
    });

  });
  //delete
  app.delete('/users/:id', Authorizer.isAuthenticated, function(req, res) {
    UsersManager.deleteAccount(userId, function(errorDeleting) {
      if (!errorDeleting) {
        //Everything went well, we might want to move the user to some other screen or simply refresh the ui
        res.send("Everything went well, we might want to move the user to some other screen or simply refresh the ui");
      } else {
        //There was a problem deleting - so we should stay on the same form/page - perhaps an Alert
        res.send("There was a problem deleting - so we should stay on the same form/page");
      }
    });
  });

  /* Region:: Page Serving/Rendering */
  app.get('/login', function(req, res) {
    res.render('index.ejs', {
      title: "Please Log In"
    });
  });

  /*
	  API to Support Single-Page Apps and Mobile Clients
	  This login-handler method has been updated to return login-failure messages back to the clients
	*/
  app.post('/api/login', passport.authenticate('local', {
    successRedirect: '/api/login-success',
    failureRedirect: '/api/login-failure'
  }));
  //redirect for when login succeeds
  app.get('/api/login-success', function(req, res) {
    console.log("Login-Success- Redirect");
    //get properties of loggedIn owner
    Properties.getPropertiesOfOwner(req.user.id, function(err, properties) {
      var user = req.user;
      if (err) {
        res.send({
          'success': false,
          'message': 'Username or Password is wrong'
        });
      } else {
        if (properties && properties.length > 0) {
          //render main display page
          user.password = "this-is-not-it";
          res.send({
            "user": user,
            "properties": properties
          });
        } else {
          res.send({
            "user": user,
            "properties": []
          });
        }
      }

    });

  });
  //redirect method for when login failed
  app.get('/api/login-failure', function(req, res) {
    console.log("Login-Failure- Redirect");
    res.send({
      "success": false,
      "message": "Login Failed. Incorrect Username or Password"
    });
  });

  app.post('/login', passport.authenticate('local'), function(req, res) {
    //get properties of loggedIn owner
    Properties.getPropertiesOfOwner(req.user.id, function(err, properties) {
      if (properties && properties.length > 0) {
        //render main display page
        res.render('main.ejs', {
          title: "Smart CitizenS - Home",
          user: req.user,
          prop: properties,
          message: ''
        });
        //res.send(property+" isEmpty" + empty)
      } else {
        res.render('addpropertyform.ejs', {
          title: "Smart CitizenS - Property",
          user: req.user,
          message: "You do not have any property - please add one first before submitting readings"
        });
      }
    });

  });
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  /*     PASSWORD MANAGEMENT REGION   */

  //Here the user followed the Password Reset URL sent to his email - this returns the password reset form if the Password Reset URL is valid
  app.get('/reset/:resetRequestToken', function(req, res) {
    PasswordResetRequestsHandler.verifyToken(req.params.resetRequestToken, function(err, tokenOwner) {
      if (!tokenOwner) {
        res.send("Invalid Password Reset Token. Please make sure you typed the URL correctly. ");
        return;
      }
      //all is good - send back the username along to the reset form (username should not be editable)
      console.log("Correct Token : " + req.params.resetRequestToken);
      //res.send("Hello, "+resetRequest.username+", now you can reset your password. The Reset form will be pre-populated with your username. ");
      res.render('reset.ejs', {
        'userId': tokenOwner._id
      });
    });
  });

  //Password Reset Request - This is called when the user clicks submit form on the password reset form
  app.post('/password/reset/:userId', function(req, res) {
    var passwordResetRequest = {
      'userId': req.params.userId,
      'password': req.body.password
    };
    UsersManager.resetPassword(passwordResetRequest, function(err, updatedAccount) {
      res.send(updatedAccount);
    });
  });

  //This is called when the user clicks the forgotten password link on the login page
  //because the user is asking for the password reset form - it should be a GET call.
  app.get('/forgot', function(req, res) {
    //here we tell the user that we have sent an email
    res.render('forgot.ejs');
  });

  //This is called when the user clicks reset password on the forgotten form
  //Here the user sends the email address - we then check if such a user exists and then we send a password reset link to that email address
  app.post('/pwdchange', function(req, res) {
    var userEmail = req.body.email;
    console.log("pwdchange:// Email " + userEmail);
    PasswordResetRequestsHandler.createNew(userEmail, req.headers.host, function(err, userToken) {
      if (!err) {
        res.send("Your Password Reset Instruction have been emailed to " + userEmail + ". Your Token Number is " + userToken);
      } else {
        res.send(err);
      }
    });
  });

  //user is requesting to view the submit form
  //must be authenticated
  app.get('/readingsform', Authorizer.isAuthenticated, function(req, res) {
    var loggedInUser = req.user;
    console.log("user is ", loggedInUser);
    //this form must be pre-populated with the loggedin user
    if (loggedInUser) {
      //get list of user accounts - the user must select which account the readings are for
      var propertiesAndTheirLastReadings = [];
      Properties.getPropertiesOfOwner(loggedInUser._id, function(err, userProperties) {

        //for each property, get the recent readings if available, otherwise set it to 0;
        async.eachSeries(userProperties, function(userProperty, done) {
          var prop = userProperty.toJSON();
          var accountNumber = prop.accountnumber;
          //now get the last reading for this account
          MeterReadings.getRecentMeterReadingForAccount(accountNumber, function(err, previousReading) {
            //set previous reading values (water, electricity)
            if (!err) {
              //if we got some values back, the set them
              if (previousReading) {
                if (previousReading.water)
                  prop.pastWater = previousReading.water;
                if (previousReading.electricity)
                  prop.pastElectricity = previousReading.electricity;
              }
            } else {
              console.log("There was an error while reading Recent Meter Reading for Account " + accountNumber, err);
            }
            //add it to the list
            propertiesAndTheirLastReadings.push(prop);
            done(null);
          });

        }, function(getLastReadingError) {
          console.log(" Properties with Past Readings:: ", propertiesAndTheirLastReadings);
          if (propertiesAndTheirLastReadings && propertiesAndTheirLastReadings.length > 0)
            res.render('readingsform.ejs', {
              'properties': propertiesAndTheirLastReadings,
              title: "Submit Readings",
              user: loggedInUser
            });
          else
            res.render('addpropertyform.ejs', {
              title: "Smart CitizenS - Property",
              user: loggedInUser,
              message: "You do not have any property - please add one first before submitting readings"
            });
        });

      });
    } else {
      res.send('No User Found...');
    }
  });

  /*   Property Management API       */
  //This route renders the form for adding new property
  app.get('/addpropertyform', Authorizer.isAuthenticated, function(req, res) {
    var userId = req.user;
    res.render('addpropertyform.ejs', {
      user: userId,
      title: "Add Property",
      message: ""
    });
  });

  //This route renders the list of submitted/history of readings
  app.get('/viewreadings', Authorizer.isAuthenticated, function(req, res) {
    var loggedInUser = req.user;

    //before retrieving properties and readings - check if user is loggedin
    if (loggedInUser) {
      //get list of user accounts - the user must select which account the readings are for
      var propertiesAndreadings = [];
      var previousReadings;
      var userPropertyList;

      Properties.getPropertiesOfOwner(loggedInUser._id, function(err, userProperties) {

        userPropertyList = userProperties;

        //for each property, get the recent readings if available, otherwise set it to 0;
        async.eachSeries(userProperties, function(userProperty, done) {
          var prop = userProperty.toJSON();
          var accountNumber = prop.accountnumber;
          //now get the  readingHistory for this account
          MeterReadings.getMeterReadingForAccount(accountNumber, function(err, previousReading) {
            //retrieve all the previous readings
            if (!err) {
              //if we got some values back, the set them

              if (previousReading) {
                previousReadings = previousReading;
              }
            } else {
              console.log("There was an error while reading Recent Meter Reading for Account " + accountNumber, err);
            }

            done(null);
          });

        }, function(getLastReadingError) {
          console.log(" Past Readings:", previousReadings);
          if (previousReadings && previousReadings.length > 0)
            res.render('viewreadings.ejs', {
              "previousreadings": previousReadings,
              "userproperties": userPropertyList,
              title: "Submit Readings",
              user: loggedInUser,
              message: ""
            });
          else
            res.render('viewreadings.ejs', {
              title: "Smart CitizenS - Readings",
              user: loggedInUser,
              message: "You do not have any readings - please submit readings first"
            });
        });

      });
    } else {
      res.send('No User Found...');
    }
  });
  // Properties API

  app.post('/api/properties', function(req, res) {
    var data = {
      "portion": req.body.portion,
      "accountnumber": req.body.accountnumber,
      "bp": req.body.bp,
      "contacttel": req.body.contacttel,
      "email": req.body.email,
      "initials": req.body.initials,
      "surname": req.body.surname,
      "physicaladdress": req.body.physicaladdress,
      "owner": req.body.owner
    };

    Properties.add(data, function(error, property) {
      if (error) {
        res.send({
          'success': false,
          'error': 'There was a problem adding a Property ' + error
        });
      } else {
        res.send({
          'success': true,
          'property': property
        });
      }
    });
  });

  app.get('/api/properties/owner/:ownerId', function(req, res) {
    Properties.list(function(error, properties) {
      if (!error) {
        //render properties list page
        res.send({
          'success': true,
          'properties': properties
        });
      } else {
        res.send({
          "success": false,
          "error": "An error occurred while looking up Properties. " + error
        });
      }
    });
  });


  // -----End API -----------
  //create new property
  app.post('/properties', Authorizer.isAuthenticated, function(req, res) {
    var data = {
      "portion": req.body.portion,
      "accountnumber": req.body.accountnumber,
      "bp": req.body.bp,
      "contacttel": req.body.contacttel,
      "email": req.user.email,
      "initials": req.body.initials,
      "surname": req.body.surname,
      "physicaladdress": req.body.physicaladdress,
      'owner': req.user._id
    };
    //add a new property
    Properties.add(data, function(error, property) {

      console.log("Back from adding Property!");
      res.render('main.ejs', {
        user: req.user,
        title: "Smart CitizenS",
        message: "",
        prop: property
      });
    });
  });

  //list All properties
  app.get('/properties', Authorizer.isAuthenticated, function(req, res) {
    Properties.list(function(err, properties) {
      if (!err) {
        //render properties list page
        res.render('main.ejs', {
          user: req.user,
          title: "Smart CitizenS",
          message: "",
          prop: properties
        });
      } else {
        res.send("An error occurred while looking up Properties. " + err);
      }
    });
  });

  //list specific
  app.get('/properties/owner/:ownerId', Authorizer.isAuthenticated, function(req, res) {
    Properties.getPropertiesOfOwner(req.params.ownerId, function(err, properties) {
      if (!err) {

        //render properties list page
        res.send(properties + " " + isEmpty);
      } else {
        res.send("An error occurred while looking up Properties. " + err);
      }
    });
  });
  //read specific
  app.get('/properties/:id', Authorizer.isAuthenticated, function(req, res) {
    Properties.getPropertyById(req.params.id, function(err, property) {
      if (!err) {
        //render properties display page
        res.send(property);
      } else {
        res.send("An error occurred while looking up Properties. " + err);
      }
    });
  });

  //update
  app.put('/properties/:id', Authorizer.isAuthenticated, function(req, res) {
    var propertyId = req.params.id;
    var values = req.body;
    Properties.updateProperty(propertyId, values, function(errorUpdating) {
      if (!errorUpdating) {
        //Everything went well, we might want to move the user to some other screen or simply refresh the ui
        res.send("Everything went well, we might want to move the user to some other screen or simply refresh the ui");
      } else {
        //There was a problem updating - so we should stay on the same form/page
        res.send("There was a problem updating - so we should stay on the same form/page");
      }
    });
  });
  //delete
  app.delete('/properties/:id', Authorizer.isAuthenticated, function(req, res) {
    var propertyId = req.params.id;
    Properties.deteleProperty(propertyId, function(errorDeleting) {
      if (!errorDeleting) {
        //Everything went well, we might want to move the user to some other screen or simply refresh the ui
        res.send("Everything went well, we might want to move the user to some other screen or simply refresh the ui");
      } else {
        //There was a problem deleting - so we should stay on the same form/page - perhaps an Alert
        res.send("There was a problem deleting - so we should stay on the same form/page");
      }
    });
  });

  /*   Meter Readings API */
  //configuring the multer middleware

  app.use(multer({
    dest: app.get('evidence_dir'),
    rename: function(fieldname, filename) {
      return filename + Date.now();
    },
    onFileUploadStart: function(file) {
      console.log(file.originalname + ' is starting ...extension is ' + file.extension);
      if (file.extension != "jpeg" && file.extension != "gif" && file.extension != "png" && file.extension != "jpg") {
        console.log("Unsupported File Extention for Readings Evidence ", file.extension);
        return false;
      }
    },
    onFileUploadComplete: function(file) {
      console.log(file.fieldname + ' uploaded to  ' + file.path);
      uploadDone = true;
    }
  }));

  //--------------Start API

  app.post('/api/readings', function(req, res) {
    processMeterReadingPost(req, res, function(err, result) {
      if (!err)
        res.send({
          'success': true,
          'result': result
        });
      else
        res.send({
          'success': false,
          "error": err
        });
    });
  });

  app.get('/api/readings/:id', function(req, res) {
    var id = req.params.id;
    MeterReadings.getMeterReadingById(id, function(err, meterReading) {
      if (meterReading) {
        res.send(meterReading);
      } else {
        console.log("Something happened and we did not get readings. Error ", err);
        res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
      }
    });
  });

  //get [list of ] meter-readings for an Account.
  app.get('/api/readings/:accountNumber', function(req, res) {
    var accountNumber = req.params.accountNumber;
    MeterReadings.getMeterReadingById(accountNumber, function(err, meterReadingsForAccount) {
      if (meterReadingsForAccount) {
        res.send(meterReadingsForAccount);
      } else {
        console.log("Something happened and we did not get readings. Error ", err);
        res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
      }
    });
  });

  //list
  app.get('/api/readings', function(req, res) {
    MeterReadings.list(function(err, listOfMeterReadings) {
      if (listOfMeterReadings) {
        res.send(listOfMeterReadings);
      } else {
        console.log("Something happened and we did not get readings. Error ", err);
        res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
      }
    });
  });

  //update
  app.put('/api/readings/:id', function(req, res) {
    var id = req.params.id;
    var values = req.body;
    MeterReadings.updateMeterReading(id, values, function(err, updatedReading) {
      if (updatedReading) {
        res.send(updatedReading);
      } else {
        console.log("Something happened and we did not update readings. Error ", err);
        res.send("There was a problem Updating your readings. Show error and stay put. ");
      }
    });
  });

  //delete
  app.delete('/api/readings/:id', function(req, res) {
    var id = req.params.id;
    MeterReadings.deleteMeterReading(id, function(err) {
      if (!err) {
        res.send("Deleting was successful");
      } else {
        console.log("Something happened and we did not update readings. Error ", err);
        res.send("There was a problem Deleting your readings. Show error and stay put. ");
      }
    });
  });


  //------------------------- End API


  //create new readings
  app.post('/readings', Authorizer.isAuthenticated, function(req, res) {
    processMeterReadingPost(req, res, function(err, result) {
      if (!err)
        res.send(result);
      else
        res.send({
          "error": err
        });
    });
  });

  function processMeterReadingPost(req, res, callback) {
    //TODO: If the evidence file was not provided - the upload may be false which is incorrect
    //This needs to be fixed - if no evidence file, then set to TRUE
    //the upload middleware returned ?
    if (uploadDone === true || (!req.body.waterimage && !req.body.electricityimage)) {
      var uploadedFiles = req.files;
      var meterreadingsData;
      console.log("Uploaded Files: \n", uploadedFiles);

      //here we use waterfall to streamline the steps that are necessary to prepare the meter-reading data for submission

      async.waterfall([
        function(done) {
          console.log("Step 1 - Creating Basic Meter-Reading Object from req");
          meterreadingsData = {
            "account": req.body.accountNumber,
            "bp": req.body.bp,
            "date": req.body.readingDate,
            "portion": req.body.portion,
            "electricity": req.body.electricity,
            "water": req.body.water,
            "electricityimage": "",
            "waterimage": ""
          };
          done(null, meterreadingsData);
        },
        function(readingsDataObject, done) {
          console.log("Step 2 - Adding Water or Electricity Evidence Images");
          if (uploadedFiles.waterimage) {
            //move the file to the user's specific directories
            var newWaterImagePath = app.get('evidence_dir') + path.sep + req.user.username + path.sep + uploadedFiles.waterimage.name;
            console.log("new path is " + newWaterImagePath);
            fs.rename(uploadedFiles.waterimage.path.toString(), newWaterImagePath.toString(), function(err) {
              if (err) {
                console.log("Error moving file", err);
                throw err;
              }
              console.log('Water Image File Move Complete');
              readingsDataObject.waterimage = newWaterImagePath;
              done(null, readingsDataObject);
            });
          } else {
            done(null, readingsDataObject);
          }
        },
        function(readingsDataObjectWithWaterImage, done) {
          if (uploadedFiles.electricityimage) {
            //move the file to the user's specific directories
            var newElectricityImagePath = app.get('evidence_dir') + path.sep + req.user.username + path.sep + uploadedFiles.electricityimage.name;
            console.log("new path is " + newElectricityImagePath);
            fs.rename(uploadedFiles.electricityimage.path.toString(), newElectricityImagePath.toString(), function(err) {
              if (err) {
                console.log("Error moving file", err);
                throw err;
              }
              console.log('Water Image File Move Complete');
              readingsDataObjectWithWaterImage.electricityimage = newElectricityImagePath;
              done(null);
            });
          } else {
            done(null);
          }
        }
      ], function(err, result) {
        console.log("Water Fall Result is ", result);
        //end of the water fall...send the meter readings
        MeterReadings.add(meterreadingsData, function(err, meterReadingObject) {
          if (meterReadingObject) {
            //render the readings list (updated with this new reading) - redirect
            //res.render('readingslist', {'readings':[meterReadingObject]});
            //now email the metering to the city - this process is as follows
            //1. Locate the associated property by finding the property tied to the account number in the readings
            var readingsAssociatedAccount = meterReadingObject.account;
            Properties.getPropertyByAccountNumber(readingsAssociatedAccount, function(errorLocatingProperty, associatedProperty) {
              if (!associatedProperty) {
                console.log("Error is ", errorLocatingProperty);
                return res.send("Property Associated With the account number was not found. It is impossible to email the meter readings to City of Tshwane Municipal office");
              }
              //so we found the property associated with the readings, not email the readings along with property details
              //Compute the current user's evidence-file location
              var userReadingsFilesDir = app.get('evidence_dir') + path.sep + req.user.username;
              MeterReadings.findAndEmailReadings(meterReadingObject._id, associatedProperty, userReadingsFilesDir, function(err, readingsEmailedSuccessfully) {
                var notification = {
                  'to': req.user._id,
                  'reading_id': meterReadingObject._id,
                  'message': ""
                };

                if (readingsEmailedSuccessfully) {
                  notification.message = "Meter Readings Saved and emailed to the City of Tshwane for consideration. Your Smart Citizen Reference number is " + meterReadingObject._id;
                  res.send("Meter Readings Saved and emailed to the City of Tshwane for consideration. Your Smart Citizen Reference number is " + meterReadingObject._id); //use flash?
                } else {
                  //TODO: use standard "error" window...eg. res.render(error.ejs, {message: 'some message', error: 'error-object'})
                  var message = "There were some problems emailing your readings. Try again or contact your regional Smart Citizen Help Desk. Help -> Contacts.";
                  notification.message = message;
                }
                //post the notification
                Notifications.addNotification(notification, function(err, notificationId) {
                    console.log("Error ? ", err);
                    console.log("Notification ID ? ", notificationId);
                    res.send(notification.message);
                });
              });
            });
          } else if (err) {
            res.send("There was a problem saving your readings - so we should stay on the same form/page and try again");
          }
        });
      });
    } else {
      console.log("Upload not done");
      //check if the evidence files were submitted or not
      if (req.body.waterimage && req.body.electricityimage) {
        callback(new Error("Evidence File Rejected - possibly an unsupported Extension."));
      } else {
        callback(null);
      }
    }
  }

  //read [one, some]
  app.get('/readings/:id', Authorizer.isAuthenticated, function(req, res) {
    var id = req.params.id;
    MeterReadings.getMeterReadingById(id, function(err, meterReading) {
      if (meterReading) {
        res.send(meterReading);
      } else {
        console.log("Something happened and we did not get readings. Error ", err);
        res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
      }
    });
  });

  //get [list of ] meter-readings for an Account.
  app.get('/readings/:accountNumber', Authorizer.isAuthenticated, function(req, res) {
    var accountNumber = req.params.accountNumber;
    MeterReadings.getMeterReadingById(accountNumber, function(err, meterReadingsForAccount) {
      if (meterReadingsForAccount) {
        res.send(meterReadingsForAccount);
      } else {
        console.log("Something happened and we did not get readings. Error ", err);
        res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
      }
    });
  });

  //list
  app.get('/readings', Authorizer.isAuthenticated, function(req, res) {
    MeterReadings.list(function(err, listOfMeterReadings) {
      if (listOfMeterReadings) {
        res.send(listOfMeterReadings);
      } else {
        console.log("Something happened and we did not get readings. Error ", err);
        res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
      }
    });
  });

  //update
  app.put('/readings/:id', Authorizer.isAuthenticated, function(req, res) {
    var id = req.params.id;
    var values = req.body;
    MeterReadings.updateMeterReading(id, values, function(err, updatedReading) {
      if (updatedReading) {
        res.send(updatedReading);
      } else {
        console.log("Something happened and we did not update readings. Error ", err);
        res.send("There was a problem Updating your readings. Show error and stay put. ");
      }
    });
  });

  //delete
  app.delete('/readings/:id', Authorizer.isAuthenticated, function(req, res) {
    var id = req.params.id;
    MeterReadings.deleteMeterReading(id, function(err) {
      if (!err) {
        res.send("Deleting was successful");
      } else {
        console.log("Something happened and we did not update readings. Error ", err);
        res.send("There was a problem Deleting your readings. Show error and stay put. ");
      }
    });
  });
  //utility handle to email the readings.
  //Ideally the emailing should happen immediately after saving the readings - but I think such a utility is nice to expose here
  app.post('/readings/:readingsId/email', Authorizer.isAuthenticated, function(req, res) {
    console.log("Your Request to Email Readings is noted...");
    var readingsId = req.params.readingsId;
    var readingsData = req.body;
    MeterReadings.emailReadings(readingsId, readingsData, function(success) {
      //create a notification
      var notification = {
        'to': req.user._id,
        'reading_id': readingsId,
        'message': ""
      };

      if (successful) {
        alert("Readings Emailed To City of Tshwane!");
        notification.message = "Readings Emailed To City of Tshwane. " + Date.now;
        res.send("Readings Sent Successfully");
      } else {
        notification.message = "Problems sending your Readings...you will try this again later. Go to Home, My Pending Readings and then Click on POST.";
        res.send("Problems sending your Readings...you will try this again later. Go to Home, My Pending Readings and then Click on POST.");
      }

      //post the notification
      Notifications.addNotification(notification, function(err, notificationId) {
        console.log("Error ? ", err);
        console.log("Notification ID ? ", notificationId);
      });
    });
  });

  /**************************************************************
   Notifications Management Region.
   Here we have the routes for reading,adding, editing and removing notifications
  */

  //----------------Start API

  //Get notifications for a user
  app.get('/api/notifications/:me', function(req, res) {
    var userId = req.params.me;
    console.log("Getting Notifications for User ", userId);
    //get a list of notifications for this person
    Notifications.getUserNotifications(userId, function(errorGettingNotifications, listOfNotifications) {
      if (errorGettingNotifications) {
        console.log("Error Retrieving User Notifications. Error is ", errorGettingNotifications);
        return;
      }
      //return the list
      res.send(listOfNotifications);
    });
  });

  app.get('/api/notifications/account/:accountNumber', function(req, res) {
    var accountNumber = req.params.accountNumber;
    console.log("Getting Notifications for Account ", accountNumber);
    //get a list of notifications for this person
    Notifications.getAccountNotifications(accountNumber, function(errorGettingNotifications, listOfNotifications) {
      if (errorGettingNotifications) {
        console.log("Error Retrieving Account Notifications. Error is ", errorGettingNotifications);
        return;
      }
      //return the list
      res.send(listOfNotifications);
    });
  });

  app.delete('/api/notifications/:id', function(req, res) {
    var notificationId = req.params.id;
    Notifications.deleteNotification(notificationId, function(errorDeleting) {
      if (errorDeleting) {
        console.log("Error occurred while deleting Notification. Error is ", errorDeleting);
        res.send({
          'success': false,
          'message': 'Delete Was Not Successful'
        });
      } else {
        console.log("Notification Deleted Successfully...");
        res.send({
          'success': true,
          'message': 'Deleted Successfully'
        });
      }
    });
  });


  //----------------End API

  //Get list of Notifications for the current user
  app.get('/notifications/me', Authorizer.isAuthenticated, function(req, res) {
    var userId = req.user._id;
    console.log("Getting Notifications for User ", userId);
    //get a list of notifications for this person
    Notifications.getUserNotifications(userId, function(errorGettingNotifications, listOfNotifications) {
      if (errorGettingNotifications) {
        console.log("Error Retrieving User Notifications. Error is ", errorGettingNotifications);
        return;
      }
      //return the list
      res.send(listOfNotifications);
    });
  });

  //Get list of notifications generated for an Account
  app.get('/notifications/account/:accountNumber', Authorizer.isAuthenticated, function(req, res) {
    var accountNumber = req.params.accountNumber;
    console.log("Getting Notifications for Account ", accountNumber);
    //get a list of notifications for this person
    Notifications.getAccountNotifications(accountNumber, function(errorGettingNotifications, listOfNotifications) {
      if (errorGettingNotifications) {
        console.log("Error Retrieving Account Notifications. Error is ", errorGettingNotifications);
        return;
      }
      //return the list
      res.send(listOfNotifications);
    });
  });

  //Delete a notification
  app.delete('/notifications/:id', Authorizer.isAuthenticated, function(req, res) {
    var notificationId = req.params.id;
    Notifications.deleteNotification(notificationId, function(errorDeleting) {
      if (errorDeleting) {
        console.log("Error occurred while deleting Notification. Error is ", errorDeleting);
        res.send("Error occurred while deleting Notification. Error is " + errorDeleting);
      } else {
        console.log("Notification Deleted Successfully...");
        res.send("Notification Deleted Successfully...");
      }
    });
  });

  //GCM-Demo
  var gcm = require('node-gcm');
  var sender = new gcm.Sender('AIzaSyD7s6lgYnKNqJlW63yqOloUsRxtfCREpl0');

  //This is the route for sending notifications
  app.post('/gcm/send', function(req, res) {
    console.log("GCM-Push Notification Request: ", req.body);
    var emailOfRecipient = req.body.email;
    //try to find the recipient's GCM-ID
    SmartCitizensGCM.getGCMRegistrationByEmail(emailOfRecipient, function(err, gcmRegistrationEntry) {
      if (gcmRegistrationEntry) {
        //now we can try and send the notification here...
        var sendRequest = req.body;
        var recipientGCMRegId = gcmRegistrationEntry.reg_id;
        var message = new gcm.Message();
        message.addData('content', reg.body.message);
        message.addData('time', Date.now);

        if (sender) {
          sender.send(message, [recipientGCMRegId], function(err, result) {
            if (err) {
              console.error(err);
              res.send("Bona, go na le error somewhere..." + err);
            } else {
              console.log(result);
              res.send("Nice, Sending Push Notification now...check with the recipient..result = " + result);
            }
          });

        } else {
          console.log("It seems we do not have GCM Connection to Google");
        }

      } else {
        //GCM Notification not possible...unknown recipient
        res.send("Eish! Could Not Find GCM for the email provided...");
      }
    });

  });

  //This is the route for registering:
  /*

    { email: String,
    app_name : String,
   reg_id: String}
   You get back a new JSON model with attribute _id as a UUID - this shows your 3rd party reg was successful.
  */
  app.post('/gcm/register', function(req, res) {
    var registrationRequest = req.body;
    console.log("GCM-Push Registration Request: ", registrationRequest);
    SmartCitizensGCM.add(registrationRequest, function(err, gcmRegistrationEntry) {
      if (gcmRegistrationEntry) {
        console.log("GCM Registration Successful on 3rd Party Server");
        res.send(gcmRegistrationEntry);
      } else {
        console.log("There was an error registering. Error is ", err);
        res.send("There was an error registering. Error is ");
      }
    });
  });

  app.get('/gcm_send', function(req, res) {
    res.render('gcmsend.ejs', {
      title: "Smart CitizenS GCM Testbed"
    });
  });


  /*
    Spotters:: This region contains routes for city data collection named Spotters. Spotters are citizens who voluntarily report interesting things that they spot in the city.
	We are interested in building a city-wide data layer that contains the location of things such as traffic lights, wifi-hotspots, etc.
  */

  app.post('/spotters/traffic/lights', function(req, res) {
    // var rawTrafficLightData = req.body.trafficLight;
    var rawTrafficLightData = JSON.parse(req.body.trafficLight);
    if (rawTrafficLightData) {
      TrafficLightsSpotter.add(rawTrafficLightData, function(err, newTrafficLight) {
        if (!err) {
          res.send({
            'success': true,
            'trafficLight': newTrafficLight
          });
        } else {
          res.send({
            'success': false,
            'message': ' There was a problem adding your Spotted Traffic Light '
          });
        }
      });
    } else {
      res.send({
        'success': false,
        'message': 'We Did Not Receive Any Data'
      });
    }
  });
  /*
    Get a list of traffic lights in the system (admin-view)
  */
  app.get('/spotters/traffic/lights/manage', function(req, res) {
    TrafficLightsSpotter.list(function(err, trafficLights) {
      if (!err) {
        res.send(trafficLights);
      } else {
        res.send({
          'success': false,
          'message': 'There was an error reading traffic Lights Data. Contact Smart Citizen Data Foundation'
        });
      }
    });
  });
  
  /*
    Get a list of traffic lights in the system (public-view)
  */
  app.get('/spotters/traffic/lights', function(req, res) {
    TrafficLightsSpotter.listPublic(function(err, trafficLights) {
      if (!err) {
        res.send(trafficLights);
      } else {
        res.send({
          'success': false,
          'message': 'There was an error reading traffic Lights Data. Contact Smart Citizen Data Foundation'
        });
      }
    });
  });
  
  /*
	This function is used to return traffic lights within the 50 kilometre radius from the user's current location.
  */
  app.get('/closest/traffic/lights/:latitude/:longitude', function(req, res) {
	var userLocationData = {'latitude': req.params.latitude, 'longitude': req.params.longitude};
    TrafficLightsSpotter.getClosestsTrafficLights(userLocationData, function(err, trafficLights) {
      if (!err) {
        res.send(trafficLights);
      } else {
        res.send({
          'success': false,
          'message': 'There was an error reading traffic Lights Data. Contact Smart Citizen Data Foundation'
        });
      }
    });
  });
  
  
  /*
    Update the Verified State of a TrafficLight.
	This is used by the system administrator to verify the submitted traffic light
  */
  app.put('/traffic/lights/:trafficLightId/verify', TrafficLightsSpotter.verify);
  
  app.put('/traffic/lights/:trafficLightId/reject', TrafficLightsSpotter.reject);
  
  app.get('/admin-map', Authorizer.isAuthenticated,function(req, res) {
    res.render('admin_map.ejs', {
      title: '[Admin] Traffic Light Map'
    });
  });
  
  /*
    Register a new spotter app
  */
  app.post('/traffic/lights/spotters', TrafficLightsSpotter.addSpotter);

  app.get('/map', function(req, res) {
    res.render('map.ejs', {
	  user : req.user,
      title: 'Traffic Light Map'
    });
  });
  
  /*
    Stand-Alone Toping Modelling Test in JavaScript
  */
  /*
  var lda = require('lda');
  app.get('/topics/spot', function (req, res){
    // try out LDA for a dummy text
	var text = 'Started in the City of Tshwane, Pretoria, South Africa, the Open City Traffic Lights data Initiative is a ' + 
			   'user/community driven project aimed at crowdsource data about traffic lights in and around the city. '+
			   ' The data collected currently is the location of the traffic lights (from pedestrian/drive perspectives - '+
			   'not the actual signal poles). The availability of such data is aimed at promoting the development and provision '+
			   'of value-adding, traffic-related services around the cities in South Africa (and possibly around the world). Typical applications include (but not limited to) '+
			   'These tools are helping us with crowdsourcing and verification of the data. As part of this initiative, the crowdsourced data will be made available for research '+
			   ' purposes – for those interested in data-driven policy-making, as well as data science applications. '+
			   'An API will be made available for these researchers/users with the understanding that they will likewise make their work publicly available at no cost';
	// Extract sentences.
	console.log("Length of Text = ", text.length);
	var dataFreq = (8/text.length)*100;
	console.log("Frequency of Data = ", dataFreq);
	var documents = text.match( /[^\.!\?]+[\.!\?]+/g );
	// Run LDA to get terms for 2 topics (5 terms each).
	var topicsCount = 3;
	var termsCount = 5;
	var result = lda(documents, topicsCount, termsCount);
	
	//here I create an array of words with highest frequency from all topics
	var topTermsInTopics = [];
	
	//here is an array of name-size pairs expected by d3.js library
	var termNameSizeMatrix = [];
	//here we have an array of TopicsBubbleChart children
	var topicsBubbleChartChildren = [];
	
	for (var i in result) {
		var row = result[i];
		//row is a term-frequency matrix
		//row is ALREADY ranked in descending order of proportion
		//row[0].term is the term in this topic with the highest frequency
		console.log('Topic ' + (parseInt(i) + 1) + " is most likely about > "+row[0].term+ "<");		
		topTermsInTopics.push(row[0]);
    
		// For each term. 	
		for (var j in row) {
			var term = row[j];
			console.log(term.term + ' (' + term.probability + '%)');
			termNameSizeMatrix.push({'name': term.term, 'size': term.probability});
		} 
	    //for d3, label the topic
		var topicLabel = "Topic"+(parseInt(i) + 1);
		var topicLevelFrequencyBubbles = {"name": topicLabel, "children": termNameSizeMatrix};
		//push the topic-level bubble children nodes into the top node-gcm
		topicsBubbleChartChildren.push(topicLevelFrequencyBubbles);
		
		console.log('');
		
		
	}
	console.log("Top Terms", topTermsInTopics);
	//with the top terms, we could group them still by term
	//we can now mapValues to reduce the grouped-by array into term-overallFrequencies
	//the grouped-by keys represent potential topic labels
	var groupedTermFrequencies = _.mapValues(_.groupBy(topTermsInTopics, 'term'), function(valueElement){
	 var termOverallFrequencyInDoc = (valueElement.length? (valueElement.length/topTermsInTopics.length)*100: 0)
	 return termOverallFrequencyInDoc+ "%";
	});
	console.log("Grouped Top Terms", groupedTermFrequencies);
	//now displaying a ranked list by topic-level distribution (this is how you get a 'key' without knowing it)
	var overallFavorite = Object.keys(groupedTermFrequencies)[0];
	
	console.log("The Entire document is MOST LIKELY ABOUT ...... ", overallFavorite);
	//at this point we can create a Bubble Chart to visualize the data in d3.js :: E.g http://bl.ocks.org/mbostock/4063269
	//Generate the data as expected by Bubble Chart...
	//change d3.json("flare.json", function(error, root) to use a JSON object instead of reading from file...
	//So use the JSON-object in place of "root" in the rest of the code...
	var bubbbleChartData = {'name': "CloudTutor Topics", 'children': topicsBubbleChartChildren};
	res.send({'results':result, 'bubbleChartData':bubbbleChartData});
  });
  
  */
  

};
