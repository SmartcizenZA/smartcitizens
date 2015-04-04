/*
  This is the script for processing incoming reports of spotting Traffic Lights from Smart Citizens;
*/
var entities = require('../models/modelentities');
var TrafficLight = entities.TrafficLight;

//adding a new traffic light
exports.add = function (newTrafficLightData, callback){
	console.log("Registration Request Object ", newTrafficLightData);
	var data = {'street1': newTrafficLightData.street1,
				'street2': newTrafficLightData.street2,
				'x':newTrafficLightData.xcoordinates,
				'y':newTrafficLightData.ycoordinates,
				'working': newTrafficLightData.isWorking
				};
	var newTrafficLight = new TrafficLight(data);
	newTrafficLight.save(function (err) {
		if(!err){console.log("All went well. Traffic Light Successfully Added To Smart Citizen DATA Foundation. ", newTrafficLight); }
		  callback(err, newTrafficLight);
	});
};
/*
  List all traffic lights spotted
*/
exports.list = function(callback){
	TrafficLight.find(function (err, trafficLights) {
		console.log ("Got TrafficLights = ",trafficLights);
        callback(err, trafficLights);
    });
};
/*
  Get a traffic light
*/
exports.getTrafficLightById = function (id, callback){
   console.log ("Get TrafficLight with Id = "+id);
   TrafficLight.findById(id, function (err, trafficLight) {
		console.log ("Got TrafficLight by ID = ",trafficLight);
        callback(err, trafficLight);
    });
};
/*
  Retrieve a list of Traffic Lights closest to the specified X,Y coordinates;
*/
exports.getClosestsTrafficLights = function (coordinates, callback){

};

