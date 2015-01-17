var path = require('path');
var express = require('express');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./config/config');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');

// main config
var app = express();
app.set('port', process.env.PORT || 2015);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });
app.use(morgan('tiny'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser(config.get('express.cookieParser.secret')));
app.use(session());
app.use(passport.initialize());
app.use(passport.session());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if (config.get('env') == 'development') {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}
else{
//live/production or demo mode
  app.use(express.errorHandler());
}

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose');

// routes
require('./routes')(app);

app.listen(app.get('port'), function(){
  console.log(("Express server listening on port " + app.get('port')))
});




/*
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
  var meteringSubmissionDataObject = {
    portion: "0011",
	bp: "BP0011",
	accNum: "0123456",
	date: Date.now(),
	electricity: "00",
	water:"1200",
	contactTel: "012 1234567",
	email: "ishmael.makitla@gmail.com,mtswenij@gmail.com,kgundula@gmail.com",
	names: "Ishmael Makitla",
	address: "ERF X102015",
	image: "meterJune302014.jpeg"
  }
  //function(meteringSubmissionDataObject, subject, text, callback, sysGeneratedReadingsId)
  mailer.sendMailToCity(meteringSubmissionDataObject,"Meter Readings: 2015-Email-Separator (JS, MI, KG)", "Please find the attached meter readings from my house", function (successful){
   console.log("The Email was send successfully? "+successful);
  }, "20141206_ERF33033");
});

module.exports = app;
*/