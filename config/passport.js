/*
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var accounts = require('../routes/accounts');
var entities = require('../models/entities');
var bcrypt = require('bcrypt');
var async = require('async');

var _ = require('lodash');
var reports = require('../routes/reports');
var log = require('../config/logger').log("hprs-passport");
var organisationalUnits = require('../routes/organisationalUnits');


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  accounts.findById(id, function(err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  
passport.use(new LocalStrategy(
  function(username, password, done) {
    // Find the user by username.  If there is no user with the given
    // username, or the password is not correct, set the user to `false` to
    // indicate failure and set a flash message.  Otherwise, return the
    // authenticated `user`.
    accounts.findByUsername(username, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'Unknown user ' + username
        });
      }
      if (user.expiryDate) {
        var todaysDate = new Date();
        var expiryDate = new Date(user.expiryDate);
        if (expiryDate - todaysDate < 0) {
          log.debug('Account suspended');
          return done(null, false, {
            message: 'Account suspended'
          });
        }
      }

      if (_.isEmpty(user.organisationalUnits) || _.isEmpty(user.roles)) {
          log.error('No roles or facilities assigned to account. User \'%s\' will not be able to sign in.', user.username);
          return done(null, false, {
            message: 'No roles or facilities assigned to this account'
          });
      }

      bcrypt.compare(password, user.password, function(err, res) {
        if (res === true) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: 'Invalid password'
          });
        }
      });
    });
  }
));

exports.ensureAuthenticated = function ensureAuthenticated(req, res, next) {
  log.debug('checking whether user is authenticated');
  if (req.isAuthenticated()) {
    return next();
  }
  res.json(401, {
    error: {
      code: "UNAUTHENTICATED",
      message: "Unauthenticated"
    }
  });
}

exports.postAuthenticationChecks = function postAuthenticationChecks(req, res) {
  var whitelistedUser = _.pick(req.user, 'id', 'firstName', 'surname', 'roles', 'status');
  var callback = function(success) {
    if (success)
      res.send(200, whitelistedUser);
    else {
      res.send(403, {
        error: {
          code: "UNAUTHORIZED_FACILITY",
          message: "This user does not have rights to the registered facility."
        }
      });
    }
  }
}

*/
