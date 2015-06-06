/*
  This is the script for processing incoming reports of spotting Traffic Lights from Smart Citizens;
*/
var entities = require('../models/modelentities');
var geocoder = require('geocoder');

var TrafficLight = entities.TrafficLight;

//adding a new traffic light
exports.add = function (newTrafficLightData, callback){	
	var data = {'street1': newTrafficLightData.location.street1,
				'street2': newTrafficLightData.location.street2,
				'x':newTrafficLightData.location.xcoordinates,
				'y':newTrafficLightData.location.ycoordinates,
				'working': newTrafficLightData.isWorking
				};
				
	geocode(data.x, data.y, function(err, geoCodedString){
	  if(!err){
	    //got the geocoded string, add it as street1
		data.street1 = geoCodedString;		
	  }
	  var newTrafficLight = new TrafficLight(data);
		newTrafficLight.save(function (err) {
			if(!err){console.log("All went well. Traffic Light Successfully Added To Smart Citizen DATA Foundation. "); }
			callback(err, newTrafficLight);
		});
	  
	});
	
	
};
/*
  List all traffic lights spotted
*/
exports.list = function(callback){
	TrafficLight.find(function (err, trafficLights) {
        callback(err, trafficLights);
    });
};
/*
  Get a traffic light
*/
exports.getTrafficLightById = function (id, callback){
   console.log ("Get TrafficLight with Id = "+id);
   TrafficLight.findById(id, function (err, trafficLight) {
        callback(err, trafficLight);
    });
};
/*
  Retrieve a list of Traffic Lights closest to the specified X,Y coordinates;
*/
exports.getClosestsTrafficLights = function (coordinates, callback){

};

/*
   This is a utility function that geo-codes the x-y coordinates received from the spotter.
*/
function geocode(x, y, callback){
  if(!x || !y){ return callback(new Error("Both X and Y MUST be submitted."));}
  //
  var longitute = parseFloat('-26.087212');
  var latitute = parseFloat('27.983646');
  
  console.log("geocode("+longitute+" , "+latitute+")");
  
  geocoder.reverseGeocode( longitute, latitute, function ( err, data ) {
		if(!err){
		   console.log("GeoCoding Results:: ("+longitute+" , "+latitute+")", data);
		   var geocodedAddress = (data.results && data.results[0]? data.results[0].formatted_address : "");
		   return callback(null, geocodedAddress);
		}
	});
  
}

