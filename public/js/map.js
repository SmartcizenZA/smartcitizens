// var baseUrl = '//smartcitizen.defensivethinking.co.za';
var baseUrl = '//localhost:3000';
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
    url: baseUrl + '/spotters/traffic/lights',
  }).done(function (response) {
    response.forEach(function (element, index, array) {
      markers.push({
        lat: element.y,
        lng: element.x,
        title: element.street1
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
