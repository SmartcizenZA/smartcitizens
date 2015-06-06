var baseUrl = '//smartcitizen.defensivethinking.co.za';

$(document).ready(function(){
  var map;


  map = new GMaps({
    div: '#map',
    lat: -25.7657454,
    lng: 28.1970762,
  });

  markers = getMarkersInfo();

  map.addMarker({
    lat: -25.7657454,
    lng: 28.1970762,
    title: 'Lima',
    click: function(e) {
      alert('You clicked in this marker');
    }
  });
});

function getMarkersInfo() {
  $.ajax({
    method: 'GET',
    url: baseUrl + '/spotters/traffic/lights',
  }).done(function (response) {
    console.log(response);
  }).fail(function (error) {
    console.log("Couldn't get data " + error);
  });
}
