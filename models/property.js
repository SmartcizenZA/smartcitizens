/*
 This is the Property model - it represents the Smart Citizen's municipality account.
 For the purposes of Smart Citizen, we tie all municipality accounts under a single user account.
*/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PropertySchema = new Schema({
    account: String,
    portion: String,
	bp: String,
	address: String,
	owner: String
});
//compile the Property model against a Schema
module.exports = mongoose.model('Property', PropertySchema);