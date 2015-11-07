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
	emailed: {type:Boolean, default: false},
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

/*   Notification Model         */

var NotificationSchema = new Schema({
    account: String,
	readings_id : String,
	to: String,
	message: String,
	read: {type:Boolean, default: false},
	updated: { type: Date, default: Date.now }
});
var Notification = mongoose.model('Notification',NotificationSchema);
exports.Notification = Notification;

var GCMRegistrationSchema = new Schema({
    email: String,
	app_name : String,
	reg_id: String,
	created: { type: Date, default: Date.now }
});
var GCMRegistration = mongoose.model('GCMRegistration',GCMRegistrationSchema);
exports.GCMRegistration = GCMRegistration;


/*
 Routes for TuckShop Spotting in the Townships
*/
var TuckShopSchema = new Schema({
	name: String,
	x: String,
	y: String,
	airtime: {type: Boolean, default: false},
	publicPhone : {type: Boolean, default: false},
	electricity: {type: Boolean, default: false},
	galleryURL : String,
	discoverer: String
});
var TuckShop = mongoose.model('TuckShop',TuckShopSchema);
exports.TuckShop = TuckShop;

/*
 Model for a traffic light at a specific geo-location
 x - the x-coordinate of the traffic light
 y - the y-coordinate of the traffic light
 street-name
 status : [working, off, out-of-sync, flashing]
 statusUpdated : now,
 state: [red, amber, green]
 stateUpdated  :now,
*/
var TrafficLightSchema = new Schema({
	x: String,
	y: String,
	street1: String,
	street2: String,
	spotter: String,
	working: {type: Boolean, default: true},
	verified: {type: Boolean, default: false},
	state: { type: String, enum: ['RED', 'AMBER', 'GREEN'], default: 'RED'},
	reports:[{ type: Schema.Types.ObjectId, ref: 'TrafficLightReport' }],
	updated: { type: Date, default: Date.now }
});
var TrafficLight = mongoose.model('TrafficLight',TrafficLightSchema);
exports.TrafficLight = TrafficLight;

var TrafficLightReportSchema = new Schema({
	trafficLightId: String,
	reporter: String,
	working: {type: Boolean, default: false},
	updated: { type: Date, default: Date.now }
});
var TrafficLightReport = mongoose.model('TrafficLightReport',TrafficLightReportSchema);
exports.TrafficLightReport = TrafficLightReport;

//Generic Incident Report Schema
var TrafficIncidentReportSchema = new Schema({
	latitude: {type: Number},
	longitude: {type: Number},
	location: String,
	description: String,
	reporter: String,
	category: String,
	verified: {type: Boolean, default: true},
	updated: { type: Date, default: Date.now }
});
var TrafficIncidentReport = mongoose.model('TrafficIncidentReport',TrafficIncidentReportSchema);
exports.TrafficIncidentReport = TrafficIncidentReport;

//Incident Notification/Alert Subscription
var TrafficAlertSubscriptionSchema = new Schema({
	regId: String,
	latitude: {type: Number},
	longitude: {type: Number},
	joined: { type: Date, default: Date.now }
});
var TrafficAlertSubscription = mongoose.model('TrafficAlertSubscription',TrafficAlertSubscriptionSchema);
exports.TrafficAlertSubscription = TrafficAlertSubscription;


var TrafficLightSpotterSchema = new Schema({
	gcmRegistrationId: String,
	status: { type: String, enum: ['BANNED', 'OK'], default: 'OK'},
	joined: { type: Date, default: Date.now },
	autoVerify: {type: Boolean, default: false}
});
var TrafficLightSpotter = mongoose.model('TrafficLightSpotter',TrafficLightSpotterSchema);
exports.TrafficLightSpotter = TrafficLightSpotter;