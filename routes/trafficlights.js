/*
  This is the script for processing incoming reports of spotting Traffic Lights from Smart Citizens;
*/
var entities = require('../models/modelentities');
var geocoder = require('geocoder');

var TrafficLight = entities.TrafficLight;
var TrafficLightSpotter = entities.TrafficLightSpotter;

/*
   Spotter CRUD Region
*/
//This function is used to register a new spotter on to the system;
exports.addSpotter = function (req,res){
  if(!req.body.gcmRegId){
     res.send({'success':false, 'message':'No Data Received for Spotter Registration'});
  }
  else{
	var gcmRegId = req.body.gcmRegId;
	var TrafficLightSpotter = new TrafficLightSpotter({'gcmRegistrationId': gcmRegId});
	TrafficLightSpotter.save(function (errorSaving){
		if(errorSaving){ res.send({'success':false, 'message':'An error occured during Spotter Registration. [Technical Details] Error is '+errorSaving});}
		else{
		  //now we send back the registration response which bears the UUID (_id_) of the spotter App;
		  var registrationResponse = {'success': true, 'spotter':{'gcmRegistrationId':gcmRegId, 'spotterId': TrafficLightSpotter._id}};
		  res.send(registrationResponse);
		}
	});
  }
    
};
//List
exports.listSpotters = function (req, res){
   TrafficLightSpotter.find(function(err, spotters) {
    res.send(spotters);
  });
};

//adding a new traffic light
exports.add = function(newTrafficLightData, callback) {
  var data = {
    'street1': newTrafficLightData.location.street1,
    'street2': newTrafficLightData.location.street2,
    'x': newTrafficLightData.location.xcoordinates,
    'y': newTrafficLightData.location.ycoordinates,
    'working': newTrafficLightData.isWorking,
	'spotter': newTrafficLightData.spotter
  };

  geocode(data.x, data.y, function(err, geoCodedString) {
    if (!err) {
      //got the geocoded string, add it as street1
      data.street1 = geoCodedString;
    }
    var newTrafficLight = new TrafficLight(data);
    newTrafficLight.save(function(err) {
      if (!err) {
        console.log("All went well. Traffic Light Successfully Added To Smart Citizen DATA Foundation. ");
      }
      callback(err, newTrafficLight);
    });
  });
};
/*
  List all traffic lights spotted (admin-view)
*/
exports.list = function(callback) {
  TrafficLight.find(function(err, trafficLights) {
    callback(err, trafficLights);
  });
};

/*
  List all traffic lights spotted (public-view)
*/
exports.listPublic = function(callback) {
  TrafficLight.find({'verified':true},function(err, trafficLights) {
    callback(err, trafficLights);
  });
};

/*
  Get a traffic light
*/
exports.getTrafficLightById = function(id, callback) {
  console.log("Get TrafficLight with Id = " + id);
  TrafficLight.findById(id, function(err, trafficLight) {
    callback(err, trafficLight);
  });
};

/*
  As Admin: Verify a traffic light
*/
exports.verify = function (req, res){  
  var trafficLightId = req.params.trafficLightId;
  console.log("Verifying Traffic Light ",trafficLightId);
  TrafficLight.findById(trafficLightId, function(err, trafficLight){
	if(!err && trafficLight){
	   //now set verified to true;
	   console.log("Found Traffic Light :: ", trafficLight);
	   trafficLight.verified = true;
	   trafficLight.save(function (errorVerifying){
	     if(!errorVerifying){ res.send({'success':true, 'message': 'Traffic Light Spotting Verified.'});}
		 else{ res.send({'success':false, 'message': 'Erorr occured while verifying Traffic Light.[Technical Details ] error is '+errorVerifying});}
	   });
	}
	else{
	console.log("Traffic Light "+trafficLightId+" Not Found");
	 res.send({'success':false, 'message':'Could Not Locate the Traffic Light to Verify. [Technical Details ] error is '+err});
	}
  });
};

/*
  As admin - reject traffic light
*/
exports.reject = function (req, res){  
  var trafficLightId = req.params.trafficLightId;
  console.log("Rejecting Traffic Light ",trafficLightId);
  TrafficLight.findById(trafficLightId, function(err, trafficLight){
	if(!err && trafficLight){
	   //now delete	   
	   trafficLight.remove(function (errorRemoving){
	     if(!errorRemoving){ res.send({'success':true, 'message': 'Traffic Light Spotting Rejected.'});}
		 else{ res.send({'success':false, 'message': 'Erorr occured while rejecting Traffic Light.[Technical Details ] error is '+errorRemoving});}
	   });
	}
	else{
	console.log("Traffic Light "+trafficLightId+" Not Found");
	 res.send({'success':false, 'message':'Could Not Locate the Traffic Light to Reject. [Technical Details ] error is '+err});
	}
  });
};


/*
  Retrieve a list of Traffic Lights closest to the specified X,Y coordinates;
*/
exports.getClosestsTrafficLights = function(coordinates, callback) {

};

/*
  This is a utility function that geo-codes the x-y coordinates received from the spotter.
*/
function geocode(x, y, callback) {
  if (!x || !y) {
    return callback(new Error("Both X and Y MUST be submitted."));
  }
  //
  var longitute = parseFloat(x);
  var latitute = parseFloat(y);

  geocoder.reverseGeocode(latitute, longitute, function(err, data) {
    if (!err) {
      var geocodedAddress = (data.results && data.results[0] ? data.results[0].formatted_address : "");
      return callback(null, geocodedAddress);
    }
  });
}
