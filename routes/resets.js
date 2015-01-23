var entities = require('../models/modelentities');
var Account = require('../models/account');
var async = require('async');
var crypto = require('crypto');

var PasswordResetRequest = entities.PasswordResetRequest;
var emailerUtility = require('../utils/emailer.js');

var PASSWORD_RESET_SUBJECT = "Smart Citizen Password Reset";
var PASSWORD_RESET_BODY = "You have requested to reset your password for Smart Citizen Platform. To do that, please click on the Password Reset link. \n";
    PASSWORD_RESET_BODY += "Alternatively, you can copy the link to your Browser's address bar \n\n";

exports.createNew = function(email, serverURL, callback){
   //async waterfall is a nice way to avoid heavy nesting...
   var userToken;
   async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
		console.log("Step 1. Token ", token);
        done(null, token);
      });
    }, function(resetRequestToken, done){
	   console.log("Step 2. Token ", resetRequestToken);
	   //set the passwordResetRequestToken on the user
	   if(resetRequestToken){
	     //locate the user by email
		 Account.findOne({'email': email }, function(err, user){
		    if(!user){ 			
				done(new Error("No User Exist with that email address.")); }
			else{
				//we've got our user - set the user reset-token
				user.passwordResetRequestToken = resetRequestToken;
				user.tokenExpiry = Date.now() + 3600000; // just one hour time to live
				user.save(function(err){
				  //now pass on to the emailing function
				  done(null, user,resetRequestToken); 
				});
			}
		 });
	   }
	   else{
	     done(new Error("Token Not Generated - cannot process password reset request"));
	   }
	},
	function(user, token, done){
		console.log("Step 3. User ", user.username);	   
		//generate the reset URL (need to get the server URL automatically)
		var resetURL = "<a href='http://'"+serverURL+"'/reset/'"+token+"'>"+ "Password Reset Link: http://localhost:3000/reset/"+token+" </a>";			  
		PASSWORD_RESET_BODY += resetURL;
		emailerUtility.sendMail(user.email,PASSWORD_RESET_SUBJECT,PASSWORD_RESET_BODY, function (emailError, sent){
			if(emailError){
			//there was a problem with emailing - indicate this to the user
			  done (new Error("There was a problem sending you a Password Reset Instructions via email. Error is "+emailError));
			}
			else{
			  userToken = token;
			  done(null);				
			}
		  }); 		
	}
	], function (err, result){
	 console.log("Water Fall Result is ",result);
	  //end of the water fall..
	  if(!err){ callback(null, userToken); }
	  else{ callback(err);}	  
});
};
//This method is used to verify that the provided token exists and is still valid
exports.verifyToken = function(token, callback){
    Account.findOne({'passwordResetRequestToken': token, 'tokenExpiry': { $gt: Date.now() } }, function(err, account){
	   if(account){
		//so the token was found,and is still valid, render the password change form
		callback(null, account);
	   }
	   else{
	    callback (new Error("Token Error . Your Token is either invalid or expired"));
	   }
	});
};