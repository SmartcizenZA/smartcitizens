// var baseUrl = '//smartcitizen.defensivethinking.co.za';
var baseUrl = '//smartcitizen.defensivethinking.co.za/';
var markers = [];

$(document).ready(function(){
  var map;

  map = new GMaps({
    div: '#map',
    lat: -25.7657454,
    lng: 28.1970762
  });

  getMarkersInfo(map);

  $('#verify').live('click', verifyTrafficLight());
  // $('#verify').click(function() {
  //   console.log('Button clicked: ');
  //   // id = $('#traffic_id').text();
  //   // console.log(id);
  //   //
  //   // $.ajax({
  //   //   url: baseUrl + '/traffic/lights/' + id + '/verify'
  //   // }).done(function (response) {
  //   //   console.log('verified');
  //   // });
  // });
});

function getMarkersInfo(map) {
  $.ajax({
    method: 'GET',
    url: baseUrl + '/spotters/traffic/lights',
  }).done(function (response) {
    response.forEach(function (element, index, array) {
      infoContent = '<h4>' + element.street1 + '</h4>';
      if (element.verified) {
        infoContent += '<span>Verified</span>';
      } else {
        infoContent += '<p id="traffic_id">' + element._id + '</p>';
        infoContent += '<button id="verify">Verify</button>';
      }

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

function verifyTrafficLight() {
  console.log('Verify traffic light');
  // $.ajax({
  //   url: baseUrl + '/traffic/lights/' + id + '/verify'
  // }).done(function (response) {
  //   console.log('verified');
  // });
}
