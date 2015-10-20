/*
 This script is dedicated to processing Traffic Incidents Report.
 Ishmael Makitla
 2015
*/
var entities = require('../models/modelentities');
var SpottersUtil = require('./spotters');
var geocoder = require('geocoder');

var TrafficIncidentReport = entities.TrafficIncidentReport;

exports.list = function (req, res){
	TrafficIncidentReport.find(function(err, trafficReports) {
		if(err){
			console.log("Error Listing Traffic Reports. ", err);
			res.send([]);
		}
		else{
			res.send(trafficReports);
		}		
	 });
};

exports.listClosest = function (userLocationData, callback){
 var  closestReport = []; 
 TrafficIncidentReport.find(function(err, trafficReports) {
		if(trafficReports){
			for(var x=0; x< trafficReports.length; x++){
				var trafficReport = trafficReports[x];
				var trafficReportLat = trafficReport.latitude;
				var trafficReporttLon = trafficReport.longitude;
				if(isDistanceBetweenPointsWithinRange(userLocationData.latitude, userLocationData.longitude, trafficReportLat, trafficReporttLon, 50)){					
					closestReport.push(trafficReport);
				}
				//check if this was the last of the traffic lights
				if( (x+1) >= trafficReports.length){ 
					console.log("listClosest - Traffic Incident Reports:: Returning "+closestReport.length+" Traffic Reports");
					callback(null, closestReport);
				}			
			}
		}
		else{
			console.log("No Reports Found. Error if any? ", err);
			callback(new Error("No Reports Found. Error is "+err));
		}
		
    });
	
};

exports.addTrafficReport = function (req, res){
  //parse the incoming data from the app
   var rawTrafficReportData = JSON.parse(req.body.report);
   if(rawTrafficReportData){
	  //check if coordinates are available, if so, geocode them to get the location
	  if(rawTrafficReportData.latitude && rawTrafficReportData.longitude){
		geocode(rawTrafficReportData.latitude, rawTrafficReportData.longitude, function (err, geoAddress){
			if(!err){ rawTrafficReportData.location = geoAddress; }
			saveIncidentData (rawTrafficReportData, res);
		});
	  }
	  else{
	    //save data as is - user specified free-text location
		saveIncidentData (rawTrafficReportData, res);
	  }
	 
   }
   else{
	console.log("Could Not Parse the received Traffic Incident Report. Data = ", req.body.report);
	res.send({'success':false, 'message': 'Could Not Parse the received Traffic Incident Report.'});
   }
};
/*
  Helper function to save the incident report
*/
function saveIncidentData (trafficReportData, res){
  var newTrafficReport = new TrafficIncidentReport(trafficReportData);
	 newTrafficReport.save(function (errorSaving){
		if(errorSaving){ res.send({'success':false, 'message':'An error occured while saving Traffic Incident Report. [Technical Details] Error is '+errorSaving});}
		else{
			//if it worked, then send the success status along with the new record
			console.log("New Report:: ", newTrafficReport);
			res.send({'success':true, 'id': newTrafficReport._id});
		}
	 });
}

/*
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

//Utility function to geocode lat/long
function geocode(lat, lon, callback) {
  if (!lat || !lon) {
    return callback(new Error("Both Latitude and Longitude MUST be submitted."));
  }
  //
  var longitute = parseFloat(lon);
  var latitute = parseFloat(lat);

  geocoder.reverseGeocode(latitute, longitute, function(err, data) {
    if (!err) {
      var geocodedAddress = (data.results && data.results[0] ? data.results[0].formatted_address : "");
      return callback(null, geocodedAddress);
    }
	else{
		return callback(err);
	}
  });
}