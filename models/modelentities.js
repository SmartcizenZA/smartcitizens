/*
 This script contains definitions of models for the entire app.
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 This is the Property model - it represents the Smart Citizen's municipality account.
 For the purposes of Smart Citizen, we tie all municipality accounts under a single user account.
*/
/*
	// Get our form values. These rely on the "name" attributes
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
	*/
var PropertySchema = new Schema({
    accountnumber: String,
    portion: String,
	bp: String,
	contacttel: String,
	email: String,
	initials: String,
	surname: String,
	physicaladdress: String,
	owner: String,
	updated: { type: Date, default: Date.now }
});
//compile the Property model against a Schema
var Property = mongoose.model('Property', PropertySchema);
exports.Property = Property;

/*   The model definition for Meter-Reading   */

var MeterReadingSchema = new Schema({
    account: String,
	bp: String,
	portion: String,
    water: String,
	electricity: String,
	waterimage: String,
	electricityimage: String,
	date : String,
	emailed: Boolean,
	updated: { type: Date, default: Date.now }
});

var MeterReading = mongoose.model('MeterReading',MeterReadingSchema);
exports.MeterReading = MeterReading;
