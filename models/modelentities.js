/*
 This script contains definitions of models for the entire app.
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/*
 This is the Property model - it represents the Smart Citizen's municipality account.
 For the purposes of Smart Citizen, we tie all municipality accounts under a single user account.
*/

/*TODO: need to add previous readings (water and electricity) */

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
	creator: String,
	updated: { type: Date, default: Date.now }
});

var MeterReading = mongoose.model('MeterReading',MeterReadingSchema);
exports.MeterReading = MeterReading;

var PasswordResetRequestSchema = new Schema({
    username: String,
	updated: { type: Date, default: Date.now }
});

var PasswordResetRequest = mongoose.model('PasswordResetRequest',PasswordResetRequestSchema);
exports.PasswordResetRequest = PasswordResetRequest;
