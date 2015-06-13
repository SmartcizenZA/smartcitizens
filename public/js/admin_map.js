// var baseUrl = '//smartcitizen.defensivethinking.co.za';
var baseUrl = 'http://127.0.0.1:3000'   //'//smartcitizen.defensivethinking.co.za';
var markers = [];

$(document).ready(function(){
  var map;

  map = new GMaps({
    div: '#map',
    lat: -25.7657454,
    lng: 28.1970762
  });

  getMarkersInfo(map);
   
});

function getMarkersInfo(map) {
  $.ajax({
    method: 'GET',
    url: baseUrl + '/spotters/traffic/lights/manage',
  }).done(function (response) {
    response.forEach(function (element, index, array) {
      infoContent = '<h4>' + element.street1 + '</h4>';
      if (element.verified) {
        infoContent += '<span>Verified</span>';
      } else {
        infoContent += '<p id="traffic_id">' + element._id + '</p>';
		//made a small change here to pass the traffic-light-ID to the function to verify
        infoContent +=  '<button onclick="verifyTrafficLight(\''+element._id+'\')">Verify</button>  <button onclick="rejectTrafficLight(\''+element._id+'\')">Reject</button>'; 
		//'<a href="'+baseUrl+'/traffic/lights/'+element._id+'/verify">verify</a> <a href="'+baseUrl+'/traffic/lights/'+element._id+'/reject">Reject</a>';
      }
	  //this check is necessary for those submissions for which the X/Y values may not have been submitted
     if(element.y && element.x)
      markers.push({
        lat: element.y,
        lng: element.x,
        title: element.street1,
        icon: 'images/traffic_lights.png',
        infoWindow: {
          content: infoContent
        }
      });
    });

    // Add markers to map
    markers.forEach(function (element, index, array) {
      map.addMarker(element);
    });
  }).fail(function (error) {
    console.log("Couldn't get data " + error);
  });
}

function verifyTrafficLight(trafficLightId) {
  console.log('Verify traffic light '+trafficLightId);
  processAction('verify',trafficLightId);
}

function rejectTrafficLight(trafficLightId){
	console.log('Reject traffic light '+trafficLightId);
	processAction('reject',trafficLightId);
}

function processAction(action, trafficLightId){
	var actionURL = baseUrl+'/traffic/lights/'+trafficLightId+'/'+action;
	$.ajax({
		url: actionURL,
		type: 'PUT',
		success: function(data) {
			if(data.success){
			alert( "All Good: \n"+data.message);
			}else{
			  alert(data.message);
			}
		}
	});
}
