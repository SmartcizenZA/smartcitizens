/*
 This is the User Account model
*/

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    password: String,
	email: String,
	updated: { type: Date, default: Date.now }
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);
