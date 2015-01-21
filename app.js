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


var routes = require('./routes/index');
var users = require('./routes/users');
var entities = require('./models/modelentities');

// main config
var app = express();
app.set('views', __dirname + '/views');
app.set('evidence_dir',path.join(__dirname, 'readings_evidence'));
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(morgan('tiny'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser(config.get('express.cookieParser.secret')));
app.use(session({'secret':'c1TiZ3n'}));
app.use(passport.initialize());
app.use(passport.session());

//set the static path to public (e.g. where images, css, javascripts are stored)
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
mongoose.connect('mongodb://localhost/smartcitizens');

// routes, pass in the entities object so that it is available to the routes
require('./routes/index')(app, entities);

//app.listen(app.get('port'), function(){
//  console.log(("Express server listening on port " + app.get('port')))
//});

module.exports = app;

