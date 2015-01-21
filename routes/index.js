/*
  This script has been modified so that it uses Mongoose. 
  The schemas and compiled models are accessible through the entities script.
  The route handlers have been modified so that instead of calling the functions in this script, we delegate the processing to dedicated
  handler-scripts in the routes directory (e.g. users.js, meterreadings.js, etc).
*/

var passport = require('passport');
var Authorizer = require('../utils/authorizer.js');
//used to handle the upload of evidence files (images)
var multer  = require('multer');
var uploadDone = false;
var UsersManager = require('../routes/users.js');
var Properties = require('../routes/properties.js');
var MeterReadings = require('../routes/meterreadings.js');

/*
  The index.js plays the router role in this design. It gets passed the Application object from 
  app.js. It then delegates handlers for the routes as needed.
*/

module.exports = function (app, entities) {

 /* Service Entry Point */
 
  app.get('/', function (req, res) {
	console.log("First Visit to Home");
	res.render('index', { user : req.user, title: "Smart CitizenS" });
  });
  
 /* GET home page. */
  app.get('/home', Authorizer.isAuthenticated, function(req, res){
  
  	var loggedInUser = req.user;
  	
	res.render('home',{user:loggedInUser});

	});
/*    User Accounts Management API    */

/* GET SignUp form */
  app.get('/signup', function(req, res) {
      console.log("Request for SignIn Form");      
	  res.render('signup', { title: 'Register New Citizen' });
  });

  //this route is for testing purposes [will probably go at some point]
  app.post('/register', function(req, res){
	res.send("Your Request is noted...");
  });

  //create new user (signup)
  app.post('/users', function(req, res, next){ req.body.baseFolder = app.get('evidence_dir'); next(); }, UsersManager.add);
  
  //read [one, some]
  app.get('/users/:id', Authorizer.isAuthenticated, function(req, res){
  var userId = req.params.id;
	UsersManager.getUserById(userId, function(err, userModel){
		if(!err && userModel){
		//render the user-details view
		//res.render('userdisplay', {'user':userModel, title:'User Details'});
			res.send(userModel);
		}
		else{
			res.send("There was a problem retrieving User. Could be the User was not found.");
		}
	});
  });
  
  //list all users
  app.get('/users', Authorizer.isAuthenticated, function(req, res){
	UsersManager.list(function(err, users){
		if(!err && users){
		//render the user-details view 
		res.render('userdisplay', {'user':users[0], title:'List of Users - Test'});
		//res.send(users[0]);
		}
		else{
			res.send("There was a problem retrieving Users. Could be there are no users? "+err);
		}
	});
  });
  //update
  app.put('/users/:id', Authorizer.isAuthenticated, function(req, res){
	var userId = req.params.id;
	var values = req.body;
	UsersManager.updateAccount(userId, values, function(err, updatedAccount){
		if(!err && updatedAccount){
			res.send(updatedAccount);			
		}
		else{
			res.send("There was a problem updating Users. "+err);
		}
	});
  
  });
  //delete
  app.delete('/users/:id', Authorizer.isAuthenticated, function(req, res){
	UsersManager.deleteAccount(userId, function(errorDeleting){
		if(!errorDeleting){
			//Everything went well, we might want to move the user to some other screen or simply refresh the ui
			res.send("Everything went well, we might want to move the user to some other screen or simply refresh the ui");
		}
		else{
			//There was a problem deleting - so we should stay on the same form/page - perhaps an Alert
			res.send("There was a problem deleting - so we should stay on the same form/page");
		}	
	});  
  });
  
  /*   Region:: Page Serving/Rendering */
  app.get('/login', function(req, res) {
      res.render('login', { user : req.user });
  });

  app.post('/login', passport.authenticate('local'), function(req, res) {
      res.redirect('home');
  });

  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  }); 

  //});
  //user is requesting to view the submit form
  //must be authenticated
  app.get('/readingsform',Authorizer.isAuthenticated, function(req, res){
  var loggedInUser = req.user;
	console.log("user is ",loggedInUser); 
   //this form must be pre-populated with the logged in user  
	res.render('readingsform');
  });
  
  /*   Property Management API       */
  //This route renders the form for adding new property
  app.get('/addpropertyform',Authorizer.isAuthenticated,function(req, res){
  var userId = req.params.id;
  res.render('addpropertyform', {user:userId})
  });
  
  //create new property
  app.post('/properties', function(req, res){
  var data = {
		"portion" : req.body.portion,
		"accountnumber" : req.body.accountnumber,
		 "bp" : req.body.bp,
		"contacttel" : req.body.contacttel,
		"email" : req.body.email,
		"initials" : req.body.initials,
		"surname" : req.body.surname,
		"physicaladdress" : req.body.physicaladdress
	   };
	//add a new property
	Properties.add(data, function(error, property){ console.log("Back from adding Property!"); res.send(property); });  
  });
  
  //list All properties
  app.get('/properties', function (req, res){
    Properties.list(function (err, properties){
		if(!err){
		  //render properties list page
		  res.send(properties);
		}
		else{
		  res.send("An error occurred while looking up Properties. "+err);
		}	
	});
  });
  
  //list specific
  app.get('/properties/owner/:ownerId', function (req, res){
    Properties.getPropertiesOfOwner(req.params.ownerId, function (err, properties){
		if(!err){
		  //render properties list page
		  res.send(properties);
		}
		else{
		  res.send("An error occurred while looking up Properties. "+err);
		}	
	});
  });
  //read specific
  app.get('/properties/:id', function (req, res){
    Properties.getPropertyById(req.params.id, function (err, property){
		if(!err){
		  //render properties display page
		  res.send(property);
		}
		else{
		  res.send("An error occurred while looking up Properties. "+err);
		}	
	});
  });
  
  //update
  app.put('/properties/:id', function(req, res){
  var propertyId = req.params.id;
  var values = req.body;
	Properties.updateProperty(propertyId, values, function(errorUpdating){
		if(!errorUpdating){
		//Everything went well, we might want to move the user to some other screen or simply refresh the ui
		res.send("Everything went well, we might want to move the user to some other screen or simply refresh the ui");
		}
		else{
		//There was a problem updating - so we should stay on the same form/page
		res.send("There was a problem updating - so we should stay on the same form/page");
		}
	});
  });
  //delete
  app.delete('/properties/:id', function(req, res){
	var propertyId = req.params.id;
	Properties.deteleProperty(propertyId, function(errorDeleting){
		if(!errorDeleting){
			//Everything went well, we might want to move the user to some other screen or simply refresh the ui
			res.send("Everything went well, we might want to move the user to some other screen or simply refresh the ui");
		}
		else{
			//There was a problem deleting - so we should stay on the same form/page - perhaps an Alert
			res.send("There was a problem deleting - so we should stay on the same form/page");
		}	
	});  
  });

  /*   Meter Readings API */
   //configuring the multer middleware
	var evidenceImagesDir = app.get('evidence_dir'); //this path has to depend on the user who is logged in...
	app.use(multer({dest: evidenceImagesDir,
		rename: function (fieldname, filename) {
		return filename+Date.now();
		},
		onFileUploadStart: function (file) {
			console.log(file.originalname + ' is starting ...');
		},
		onFileUploadComplete: function (file) {
			console.log(file.fieldname + ' uploaded to  ' + file.path)
			uploadDone=true;
		}
	}));
	
  //create new readings
  app.post('/readings', Authorizer.isAuthenticated ,function(req, res){	
  console.log("Uploading Meter Readings. Files = ", req.file);
  if(uploadDone ==true){
   //the upload middleware returned
    var uploadedFiles = req.files;
	console.log(uploadedFiles);
	//now we can add the file path to the request.body...
		if(uploadedFiles.waterimage)
			req.body.waterimg=uploadedFiles.waterimage.name;
		if(uploadedFiles.electricityimage)
			req.body.waterimg=uploadedFiles.electricityimage.name;
		MeterReadings.add(req, function(err, meterReadingObject){
		if(meterReadingObject){
			//render the readings list (updated with this new reading) - redirect 
			//res.render('readingslist', {'readings':[meterReadingObject]});
			res.send("Meter Readings Saved. Reference number is "+meterReadingObject._id);
		}
		else if(err){
			res.send("There was a problem saving your readings - so we should stay on the same form/page and try again");
		}
		});
		
	}
	else{ console.log("Upload not done");}	

  });
  //read [one, some]
  app.get('/readings/:id', Authorizer.isAuthenticated, function(req, res){
	var id = req.params.id;
	MeterReadings.getMeterReadingById(id, function(err, meterReading){
		if(meterReading){
			res.send(meterReading);
		}
		else{
			console.log("Something happened and we did not get readings. Error ", err);
			res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
		}
	});
  });
  
  //get [list of ] meter-readings for an Account.
  app.get('/readings/:accountNumber', Authorizer.isAuthenticated, function(req, res){
	var accountNumber = req.params.accountNumber;
	MeterReadings.getMeterReadingById(accountNumber, function(err, meterReadingsForAccount){
		if(meterReadingsForAccount){
			res.send(meterReadingsForAccount);
		}
		else{
			console.log("Something happened and we did not get readings. Error ", err);
			res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
		}
	});  
  });
  
  //list 
  app.get('/readings', Authorizer.isAuthenticated, function(req, res){
	MeterReadings.list(function(err, listOfMeterReadings){
		if(listOfMeterReadings){
			res.send(listOfMeterReadings);
		}
		else{
			console.log("Something happened and we did not get readings. Error ", err);
			res.send("There was a problem retrieving your readings. Show a custom Not Found Page. ");
		}
	});
  });
  
  //update
  app.put('/readings/:id', Authorizer.isAuthenticated, function(req, res){
	var id = req.params.id;
	var values = req.body;	
	MeterReadings.updateMeterReading(id, values, function(err, updatedReading){
		if(updatedReading){
			res.send(updatedReading);
		}
		else{
			console.log("Something happened and we did not update readings. Error ", err);
			res.send("There was a problem Updating your readings. Show error and stay put. ");
		}
	});  
  });
  
  //delete
  app.delete('/readings/:id', Authorizer.isAuthenticated, function(req, res){
	var id = req.params.id;
	MeterReadings.deleteMeterReading(id,function(err){
		if(!err){
			res.send("Deleting was successful");
		}
		else{
			console.log("Something happened and we did not update readings. Error ", err);
			res.send("There was a problem Deleting your readings. Show error and stay put. ");
		}
	});  
  });
  //utility handle to email the readings.
  //Ideally the emailing should happen immediately after saving the readings - but I think such a utility is nice to expose here
  app.post('/readings/:readingsId/email', Authorizer.isAuthenticated, function(req, res){
	console.log("Your Request to Email Readings is noted...");
	var readingsId = req.params.readingsId;
	var readingsData = req.body;
	MeterReadings.emailReadings(readingsId, readingsData,function(success){
		if(successful){
			alert("Readings Emailed To City of Tshwane!");
			res.send("Readings Sent Successfully");
		}
		else{
			res.send("Problems sending your Readings...you will try this again later. Go to Home, My Pending Readings and then Click on POST.");
		}
	});	
  });  
};
