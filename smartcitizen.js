var express = require('express');
var http = require('http');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//for sending emails
var mailer = require('./emailer');

var app = express();

var allowAllCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:2014');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
}

//middleware
app.use(logger('tiny'));
app.use(methodOverride());
//app.use(cookieParser(config.get('express.cookieParser.secret')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser());
app.use(allowAllCrossDomain);

//will move to Metering.js
app.get("/", function(req, res){});
app.get("readings/:meter", function(req, res){
  mailer.sendMailToCity("mtswenijs@gmail.com","Your Test Meter Readings", "", function (successful){
   console.log("The Email was send successfully? "+successful);
  });
});

app.post("/readings/:meter", function (req, res){
  
});



var server = http.createServer(app);
var port = 2014;
server.listen(port, function() {
  console.log("Smart Citizen Server Running at ", port);
  mailer.sendMailToCity("mtswenij@gmail.com","Meter Readings", "Please find the attached meter readings from my house", function (successful){
   console.log("The Email was send successfully? "+successful);
  }, "20141206_ERF33033");
});

module.exports = app;