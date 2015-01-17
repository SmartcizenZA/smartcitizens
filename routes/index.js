var express = require('express');
var router = express.Router();
var emailer=require('../emailer.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* GET the Form. */
router.get('/form', function(req, res) {
  res.render('form', { title: 'Meter Reading Form' });
});

/* GET Hello World page. */
router.get('/helloworld', function(req, res) {
    res.render('helloworld', { title: 'Hello, World!' })
});

/* GET Userlist page. */
router.get('/userlist', function(req, res) {
    var db = req.db;
    var collection = db.get('usercollection');
    collection.find({},{},function(e,docs){
        res.render('userlist', {
            "userlist" : docs
        });
    });
});

/*GET meter readings page*/

router.get('/newmeterreading', function(req,res) {
  res.render('newmeterreading', { title:'Add new meter reading'});
});


/*POST Meter reading*/
router.post('/readmeters', function(req, res) {

// Set our internal DB variable
  var db = req.db;

  console.log("AccNo:", req.body.accountNumber);

  // Get our form values. These rely on the "name" attributes
  var accNo = req.body.accountNumber;
  var bpNo = req.body.BPNumber;
  var rDate = req.body.readingDate;
  var portionNo= req.body.portionNo;
  var waterMeter= req.body.waterMeter;
  var electMeter= req.body.electMeter;
  var waterResource =req.body.waterResource;
  var electResource = req.body.electResource;

  var email = "mtswenij@gmail.com";
  var subject =accNo + " : Tshwane Meter Reading " + Date.now();

  var jsonData ={ "accNum" : accNo,
                  "bp":bpNo,
                  "portion":portionNo,
                  "date":rDate,
                  "electricity":electMeter,
                  "water": waterMeter,
                  "contactTel": "0123464870",
                  "email": email,
                  "names": "Jabu Mtsweni",
                  "address": "128 Draaibos, Annlin",
                  "image": waterResource
  };

  emailer.sendMailToCity(jsonData, subject,"Please find attached", function(success) {console.log("Email sent: ",success);}, "mtsweniPDF");

  var collection = db.get('meterreadings');


  //submit data to database
  // binding
  collection.insert({
    "accountNumber" : accNo,
    "BPNo" : bpNo,
    "readingDate" : rDate,
    "portionNo" : portionNo,
    "electMeter" : electMeter,
    "waterMeter" : waterMeter,
    "electResource": electResource,
    "waterResource": waterResource

  }, function (err, doc) {
      if(err){
        res.send("failed to save meter reading");
      }
      else {
          //if successful route to the captured meter reading
          res.location("/");
          res.redirect("/");
        }
      });
    });
/* GET userdisplay page. */
router.get('/userdisplay', function(req, res) {
    var db = req.db;
    var collection = db.get('meterportions');
    collection.find({},{},function(e,docs){
        res.render('userdisplay', {
            "userdisplay" : docs
        });
    });
});

/* GET meter portions page. */
router.get('/userdisplay', function(req, res) {
    var db = req.db;
    var collection = db.get('meterportions');
    collection.find({},{},function(e,docs){
        res.render('userdisplay', {
            "userdisplay" : docs
        });
    });
});

/* GET New User page. */
router.get('/newuser', function(req, res) {
    res.render('newuser', { title: 'Add New User' });
});

/* GET New User page. */
router.get('/registration', function(req, res) {
    res.render('registration', { title: 'Register New User' });
});

/* POST to Add User Service */
router.post('/adduser', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var userName = req.body.username;
    var userEmail = req.body.useremail;

    // Set our collection
    var collection = db.get('usercollection');

    // Submit to the DBaccountNumber
    collection.insert({
        "username" : userName,
        "email" : userEmail
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // If it worked, set the header so the address bar doesn't still say /adduser
            res.location("userlist");
            // And forward to success page
            res.redirect("userlist");
        }
    });
});

router.post('/reguser', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
	var Portion = 		req.body.portion;
	var AccountNumber = req.body.accountnumber;
	var BP = 			req.body.BP;
	var ContactTel = 	req.body.contacttel;
	var Email = 		req.body.email;
	var Initials = 		req.body.initials;
	var Surname = 		req.body.surname;
	var PhysicalAddress = req.body.physicaladdress;

    // Set our collection
    var collection = db.get('userdetails');

    // Submit to the DB
    collection.insert({
        "portion" : Portion,
        "accountnumber" : AccountNumber,
		     "BP" : BP,
        "contacttel" : ContactTel,
        "email" : Email,
        "initials" : Initials,
	    "surname" : Portion,
        "physicaladdress" : PhysicalAddress
       }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // If it worked, set the header so the address bar doesn't still say /adduser
            res.location("userdisplay");
            // And forward to success page
            res.redirect("userdisplay");
        }
    });
});


module.exports = router;
