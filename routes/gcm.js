/*
 This is the script that provides utility to perform CRUD operations on GCM Registrations.
 Ishmael Makitla
*/
var entities = require('../models/modelentities');
var GCMRegistration = entities.GCMRegistration;

//Return a list of GCM Registrations
exports.list = function(callback){
	GCMRegistration.find(function (err, registrations) {
		console.log ("Got GCM Registrations = ",registrations);
        callback(err, registrations);
    });
};

//get a specific registration for the email:
exports.getGCMRegistrationByEmail = function (email, callback){
   console.log ("getGCMRegistrationByEmail, Email = "+email);
   GCMRegistration.findOne({'email': email}, function (err, gcmRegistrationEntry){
		if(gcmRegistrationEntry){
			console.log("Found Recipient Registration ");
			callback(gcmRegistrationEntry);
		}
		else{
		  callback(new Error("No GCM Registration Found for Email "+email+" Error is "+err));
		}
	});
};

//adding a new registration
exports.add = function (registrationRequest, callback){
	console.log("Adding New GCM Registration--> ", registrationRequest);
	var newGCMRegistration = new GCMRegistration(registrationRequest);
	newGCMRegistration.save(function (err) {
		if(!err){
			console.log("All went well. GCM Successfully Registered for Smart Citizen Foundation. ", newGCMRegistration); 
			callback(null,newGCMRegistration); 
		}
		else{ console.log("Error Occurred..."); callback(new Error("Error while registration GCM on 3rd Party:: "+err));}	
	});
};