/*
 This is the script that provides utility to perform CRUD operations on a Property object.
 Ishmael Makitla
*/
var entities = require('../models/modelentities');
var Property = entities.Property;

/*  Adding a new property */
exports.add = function (newPropertyRegistrationData, registrationCallback){
	console.log("Registration Request Object ", newPropertyRegistrationData);
	//user registration is done in two parts:
	//first the username and password (login details) are stored
	//secondly, the property details are stored using the user ID as value for owner
	newProperty = new Property(newPropertyRegistrationData);
	newProperty.save(function (err) {
	if(!err){console.log("All went well. Property Successfully registered for Smart Citizen. ", newProperty); }
	  registrationCallback (err, newProperty);
	});  	
};

/*  Get All Properties (List) */
exports.list = function(callback){
	Property.find(function (err, properties) {
		console.log ("Got Properties = ",properties);
        callback(err, properties);
    });
}

exports.getPropertiesOfOwner = function(ownerId, callback){
	Property.find({'owner':ownerId}, function (err, properties) {
		console.log ("Got Properties by Owner= ",properties);
        callback(err, properties);
    });
}

/* Get a Property */
exports.getPropertyById = function (id, callback){
   console.log ("Get Property with Id = "+id);
   Property.findById(id, function (err, property) {
		console.log ("Got Property by ID = ",property);
        callback(err, property);
    });
};
/* Get a Property belonging to a municipal account */
exports.getPropertyByAccountNumber = function (accNumber, callback){
   console.log ("Get Property with Account Number = "+accNumber);
   Property.findOne({'accountnumber':accNumber}, function (err, property) {
		console.log ("Got Property by Account Number = ",property);
        callback(err, property);
    });
};

/*   Update a Property     */
exports.updateProperty = function (id, values, callback){
   console.log ("updateProperty with Id = "+id);
   Property.findById(id, function (err, property) {
		if(!err && property){
		 //perform an upsert operation here
		}
		else if(err){
		  callback(err);
		}
		else{
		 callback (new Error ("Could Not Find Property to Update"));
		}
    });
};

/*  
	Remove a Property 
*/
exports.deleteProperty = function (id, callback){
   console.log ("updateProperty with Id = "+id);
   Property.findById(id, function (err, property) {
		if(!err && property){
		 //perform the delete operation here
		  property.remove(function (err) {
		    callback(err);
		  });
		}
		else if(err){
		  callback(err);
		}
		else{
		 callback (new Error ("Could Not Find Property to Delete"));
		}
    });
};

