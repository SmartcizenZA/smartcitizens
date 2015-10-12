/*
  This is the script for processing incoming reports of spotting Traffic Lights from Smart Citizens;
*/
var entities = require('../models/modelentities');
var SpottersUtil = require('./spotters');
var geocoder = require('geocoder');

var TrafficLight = entities.TrafficLight;
var TrafficLightSpotter = entities.TrafficLightSpotter;
var TrafficLightReport = entities.TrafficLightReport;

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
	
	//check if the spotter is enabled for auto-verify. If so, set [verified=true]
	SpottersUtil.isInAutoVerify(data.spotter, function(isAutoVerified){
		data.verified = (isAutoVerified? true:false);
		var newTrafficLight = new TrafficLight(data);
		newTrafficLight.save(function(err) {
		  if (!err){
			console.log("All went well. Traffic Light Successfully Added To Smart Citizen DATA Foundation. ");	
			//if the spotter is not yet in auto-verify - try adding him if he's legible 
			SpottersUtil.addIfCanAddToAutoVerify(data.spotter, function (added){
			  if(added) console.log("Spotter Added to Auto-Verify...");
			});			
		  }
		  callback(err, newTrafficLight);
		});
	});
  });
};

/*
  This utility function is used to update an existing traffic (that it is working or not).
  trafficLightReport = {'id':value,'isWorking':Boolean}
*/
exports.updateTrafficLight = function(trafficLightReport, callback){	
	console.log("Processing Traffic Light Report. Data ", trafficLightReport);
    //find the traffic light
	TrafficLight.findById(trafficLightReport.encounteredTrafficLightId, function(err, trafficLight){
		 if(trafficLight){
				//now push the new report into the array of reports
				var report =   {'updated': new Date(trafficLightReport.date), 
								'reporter': trafficLightReport.spotterId,
								'trafficLightId': trafficLightReport.encounteredTrafficLightId , 
								'working': trafficLightReport.working
								};								
				
				var newTrafficLightReport = new TrafficLightReport(report);
				newTrafficLightReport.save(function(errorSavingReport){
				 if(errorSavingReport){ 
					console.log("Error Saving Report. Error is ", errorSavingReport);
					callback({'success':false, 'message':'An error occured while saving Traffic Light Encounter Report. [Technical Details] Error is '+errorSavingReport});
				  }
				 else{					
						//set new status of the traffic light as reported (last update wins)
						trafficLight.working = newTrafficLightReport.working;
						if(!trafficLight.reports){ trafficLight.reports = [];}
						trafficLight.reports.push(newTrafficLightReport._id);
												
						trafficLight.save(function(errorSaving){
						 if(errorSaving){ 
							console.log("Error Saving Traffic Light WITH REPORT. Error is ", errorSaving);
						 callback({'success':false, 'message':'An Error Occured While Saving Updating Traffic Light With Encounter Report. [Technical Details] Error is '+errorSaving});}
						 else{
							callback({'success':true, 'message':'Traffic Light Report Processed Successfully. Thank You.'});
						 }
						});	
				 }
				});
					 
			}
		 else{
			console.log("Traffic Light Report Could Not Be Processed. The Referenced Traffic Light Could Not Be Found.");
			callback({'success':false, 'message':'Traffic Light Report Could Not Be Processed. The Referenced Traffic Light Could Not Be Found.'});
		 }
	});
}

/*
  List all traffic lights spotted (admin-view) - the admin can see unverified traffic lights (to approve or reject)
*/
exports.list = function(callback) {
  TrafficLight.find({'verified':false},function(err, trafficLights) {
    callback(err, trafficLights);
  });
};

/*
  List all traffic lights spotted (public-view)
*/
exports.listPublic = function(callback) {    
  //because these are verified traffic lights - it is expected that reports will be filed against it
  TrafficLight.find().populate('reports').exec(function(err, trafficLights) {
		   callback(err, trafficLights);
    })
  
};

exports.listBrokenTrafficLights = function (callback){
	  TrafficLight.find({'verified':true})            
            .populate({	path: 'reports',
						match: {'working': false}
					  })
            .exec(function(err, brokenTrafficLights) {
               callback(err, brokenTrafficLights);
            })
}
/*
 Return List of Traffic Lights Reported As Broken and Closest to the User Location.
  {'_id':{$ne: null}} - at least one report exists   //returns only the broken reports - but is not useful for showing stats on the app
*/
exports.listClosestBrokenTrafficLights = function (userCoordinates, callback){	
		console.log("listClosestBrokenTrafficLights. For User At Location :: ", userCoordinates);
		TrafficLight.find({'verified': true})            
            .populate('reports', null, {'_id':{$ne: null}})
            .exec(function(err, brokenTrafficLights) {			
				if(brokenTrafficLights){
					console.log("listClosestBrokenTrafficLights. Got Some Traffic Lights.");
					//we could perhaps filter out those that have at least one "Broken" report					
					var thoseWithBrokenReports = brokenTrafficLights.filter(function(item){ return item.working === false ;});					
					//iterate through all traffic lights - checking each against a 50KM radius
					var closestTrafficLights = [];
					if(!thoseWithBrokenReports || thoseWithBrokenReports.length ===0){
						console.log("No Broken Lights At This Location");
						return callback(null, []); 
					}
					for(var x=0; x< thoseWithBrokenReports.length; x++){
						var trafficLight = thoseWithBrokenReports[x];
						var trafficLightLat = trafficLight.y;
						var trafficLightLon = trafficLight.x;
						if(isDistanceBetweenPointsWithinRange(userCoordinates.latitude, userCoordinates.longitude, trafficLightLat, trafficLightLon, 50)){
							closestTrafficLights.push(trafficLight);
						}
						//check if this was the last of the traffic lights						
						if( (x+1) >= thoseWithBrokenReports.length){ 
							console.log("Returning "+closestTrafficLights.length+" Traffic Lights Reports");
							return callback(null, closestTrafficLights); 
						}			
					}
				}
				else{ 
					console.log("NO Traffic Lights Reports At This Location.... Error ? ", err);
					return callback(err, []); 
				}               
            })
}

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
	     if(!errorVerifying){ 
			res.send({'success':true, 'message': 'Traffic Light Spotting Verified.'});
			//check if the spotter is legible for auto-verification
			
			
		 }
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
  Retrieve a list of Traffic Lights closest to the specified Lat-Long coordinates;
  Closeness is considered as traffic lights within the 50KM radius
*/
exports.getClosestsTrafficLights = function(userCoordinates, callback) {
   getNearestTrafficLights(userCoordinates, true, function (err, nearestTrafficLights){
		if(!err){
			return callback(null, nearestTrafficLights);
		}
		else{
			return callback(err, []);
		}
   });
};

exports.getClosestsUnverifiedTrafficLights = function(userCoordinates, callback) {
   getNearestTrafficLights(userCoordinates, false, function (err, nearestTrafficLights){
		if(!err){
			return callback(null, nearestTrafficLights);
		}
		else{
			return callback(err, []);
		}
   });
};

/*
  Utility Function To Retrieve Traffic Lights and Associated Reports.
*/
function getNearestTrafficLights(userCoordinates, onlyVerified, callback){
	var closestTrafficLights = [];
	   //first retrieve all coordinates (from around the world - that are verified)
	   TrafficLight.find({'verified':onlyVerified}).populate('reports').exec(function(err, trafficLights) {
		  if(trafficLights){
			//iterate through all traffic lights - checking each against a 50KM radius
			for(var x=0; x< trafficLights.length; x++){
				var trafficLight = trafficLights[x];
				var trafficLightLat = trafficLight.y;
				var trafficLightLon = trafficLight.x;
				if(isDistanceBetweenPointsWithinRange(userCoordinates.latitude, userCoordinates.longitude, trafficLightLat, trafficLightLon, 50)){	
					//clearing the reports attribute on the outgoing data (these are not necessary when we only need locations of traffic lights (to setup GeoFences)
				//	trafficLight.reports=[];
					closestTrafficLights.push(trafficLight);
				}
				//check if this was the last of the traffic lights
				if( (x+1) >= trafficLights.length){ 
				console.log("getClosestsTrafficLights:: Returning "+closestTrafficLights.length+" Traffic Lights");
				return callback(null, closestTrafficLights); }			
			}
		  }
		  else{
			return callback(err, []);
		  }
	  });
}

/*
 This function calculates the distance between two points, and checks if the distance is less or equal to the radius.
 This is a modified version of http://www.geodatasource.com/developers/javascript (many thanks!)
*/
function isDistanceBetweenPointsWithinRange (userLat, userLong, trafficLightLat, trafficLightLong, radius){
    
	var radlat1 = Math.PI * userLat/180;
	var radlat2 = Math.PI * trafficLightLat/180;
	var radlon1 = Math.PI * userLong/180;
	var radlon2 = Math.PI * trafficLightLong/180;
	var theta = userLong-trafficLightLong;
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

