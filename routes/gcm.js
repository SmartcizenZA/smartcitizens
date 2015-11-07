/*
 This is the script that provides utility to perform CRUD operations on GCM Registrations.
 Ishmael Makitla
*/
var entities = require('../models/modelentities');

var config = require('../config/config'); 
var gcm = require('node-gcm');

var sender = new gcm.Sender(config.get('gcm.apiKey'));

var GCMRegistration = entities.GCMRegistration;
var TrafficAlertSubscription = entities.TrafficAlertSubscription;

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

/*
	This function is used to register/subscribe users to traffic alerts.
	Expected payload {"regId" val, "latitude":val, "longitude": val}
*/
exports.registerForGeoAlerts = function (subscription, callback){
  //try to find the subscription and if found, update the lat and lon with new values, otherwise, add new
  var regId = subscription.regId;
  if(!regId){
	return callback(new Error("Subscription has no GCM-Registration ID. Cannot Process Further."));
  }
  
  TrafficAlertSubscription.findOne({'regId': subscription.regId}, function (err, alertSubscription){
		if(alertSubscription){
			console.log("Found Existing Subscription..update LatLon ");
			//update lat-lon
			alertSubscription.latitude = subscription.latitude;
			alertSubscription.longitude = subscription.longitude;
			alertSubscription.save(function (errorSaving){
				callback(errorSaving);
			});			
		}
		else if (!err){
		  //does not exist - so add new
		  var newTrafficAlertSubscription = new TrafficAlertSubscription(subscription);
			newTrafficAlertSubscription.save(function (err) {
				if(!err){
					console.log("All went well. Alert Subscription Successfully Done. "); 
					callback(null,newTrafficAlertSubscription); 
				}
				else{ console.log("Error Occurred..."); callback(new Error("Error while subscribing for Traffic Alerts. Error is "+err));}	
			});
		}
		else{
		  //something wrong
		  callback(err);
		}
	});
};
/*
  Get GCM-Registration IDs of those users whose last known location is within 20KM radius of the reported incident.
*/
exports.getClosestSubscribers = function (incidentLocationObject, callback){
	getClosestSubscriberIDs(incidentLocationObject, callback); 
};

function getClosestSubscriberIDs (incidentLocationObject, callback){
  //array that stores the IDs (GCM Registration IDs) of Traffic Spotter Users - to be notified via GCM Push about the new incident just in
  var closestsSubscriberRegIds = []; 
  //get those subscriptions that are within 20KM radius of the provided incidentLocationObject
  TrafficAlertSubscription.find(function (err, subscriptions) {	
		if(subscriptions){
		  for( var x=0; x< subscriptions.length; x++){
		    var subscriber = subscriptions[x];
			//check if the user's last location is within range
			if(isDistanceBetweenPointsWithinRange(subscriber.latitude, subscriber.longitude, incidentLocationObject.latitude, incidentLocationObject.longitude, 20)){					
					closestsSubscriberRegIds.push(subscriber.regId);
			}
			//check if this was the last of the traffic lights
			if( (x+1) >= subscriptions.length){ 
				console.log("List of Users Closest to the Incident Location :: "+closestsSubscriberRegIds.length);
				callback(null, closestsSubscriberRegIds);
			}		
		  }
		}
		else{
		  callback(new Error("Unable to retrieve list of Subscribers. Error Might have Occurred. Technical Error Details :: "+err) );
		}
        
    });
}

/*
 TODO: move to utils
 This function calculates the distance between two points, and checks if the distance is less or equal to the radius.
 This is a modified version of http://www.geodatasource.com/developers/javascript (many thanks!)
*/
function isDistanceBetweenPointsWithinRange (userLat, userLong, reportLat, reportLong, radius){
    
	var radlat1 = Math.PI * userLat/180;
	var radlat2 = Math.PI * reportLat/180;
	var radlon1 = Math.PI * userLong/180;
	var radlon2 = Math.PI * reportLong/180;
	var theta = userLong-reportLong;
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	var distanceInKilos = dist * 1.609344;
	//check if the distance is less or equal to the radius	
	return (distanceInKilos > radius? false: true);

}

/*
  This function is used to push traffic notification to the device using GCM
  gcmRegistartionId - Registration ID of the device to which the push notification is sent
  trafficAlert - this is a traffic incident model which is within 50KM radius of the user
*/
exports.sendTrafficAlert = function(trafficAlert, gcmRegistartionIds, callback){
	//instantiate a message based on the traffic report being reported
	var message = new gcm.Message({
			priority: 'high',
			contentAvailable: true,
			delayWhileIdle: true,
			timeToLive: 3,
			data: {"trafficAlert": trafficAlert},
			notification: {
				title: "Traffic Alert!",
				icon: "ic_action_trafficreports",
				body: "New Traffic Alert Just In."
			}
	});
	//todo: the data property should be made more generic by introducing payload "type" so we can use the same notification mechanism for app-alerts (updates, etc)
	sender.send(message, gcmRegistartionIds, config.get('gcm.retries'), callback);
};

