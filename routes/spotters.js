/*
  This is the script for managing spotters. It contains a number of utility functions for this purpose.
*/
var entities = require('../models/modelentities');
var TrafficLightSpotter = entities.TrafficLightSpotter;
var TrafficLight = entities.TrafficLight;
var config = require('../config/config');
/*
  Add the spotter into the Auto-Verify group so that all his/her future spottings are set as verified by default.
  param spotterId - ID of the spotter being added to the auto-Verify
  paran callback - callback that returns (arg1=Boolean-Success)
*/
function addToAutoVerify (spotterId, callback){
   //find and update the autoVerify flag to TRUE
   TrafficLightSpotter.findById(spotterId, function(err, trafficLightSpotter){
		if(trafficLightSpotter){
			trafficLightSpotter.autoVerify = true;
			trafficLightSpotter.save(function (errorUpdating){
			 if(!errorUpdating){ callback(true);}
			 else{ callback(false);}
		   });
		}
		else{
		 console.log("Could Not Locate The Spotter with ID "+spotterId+". Error (if any) is ", err);
		 callback(false);
		}
   });
};

/*
   Utility function for checking if a Spotter is auto-verified
*/
exports.isInAutoVerify = function(spotterId, callback){
  if(!spotterId){
	return callback(false);
  }
  TrafficLightSpotter.findById(spotterId, function(err, trafficLightSpotter){
     if(trafficLightSpotter && trafficLightSpotter.autoVerify){ callback(true);}
	 else{ callback(false);}
  });
};

/*
 Utility function to check whether a spotter can be added to auto-verify and add if so.
*/
exports.addIfCanAddToAutoVerify = function(spotterId, callback){
	//find the traffic lights submitted by this spotter;
	TrafficLight.find({'verified':true, 'spotter': spotterId},function(err, trafficLights) {
       //if the traffic lights are more than the configured max
	   var autoVerifyCount = config.get('spotting.auto_verify_count');
	   if(trafficLights && trafficLights.length <= autoVerifyCount){
			//this spotter is legible
			addToAutoVerify(spotterId, callback);
	   }
	   else{
			//this spotter is NOT legible
			callback(false);
	   }
    });	
};