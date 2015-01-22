var entities = require('../models/modelentities');
var Account = require('../models/account');
var PasswordResetRequest = entities.PasswordResetRequest;
var emailerUtility = require('../utils/emailer.js');

var PASSWORD_RESET_SUBJECT = "Smart Citizen Password Reset";
var PASSWORD_RESET_BODY = "You have requested to reset your password for Smart Citizen Platform. To do that, please click on the Password Reset link. \n";
    PASSWORD_RESET_BODY += "Alternatively, you can copy the link to your Browser's address bar \n\n";

exports.createNew = function(email, callback){
  //find the email address
  Account.findOne(email, function(err, user){
	if(!user){callback (new Error("Email Address Not Found. Not Account With That Email Exists With Email Address : "+email)); return; }
		//at this point we can now create a new request
		var newPasswordRequest = new PasswordResetRequest({username:user.username});
		newPasswordRequest.save(function(err){
			if(!err){
			  //generate the reset URL (need to get the server URL automatically)
			  var resetURL = "<a href='http://localhost:3000/reset/'"+newPasswordRequest._id+"'>"+ "Password Reset Link: http://localhost:3000/reset/"+newPasswordRequest._id+" </a>";			  
			  PASSWORD_RESET_BODY += resetURL;
			  emailerUtility.sendMail(email,PASSWORD_RESET_SUBJECT,PASSWORD_RESET_BODY, function (emailError, sent){
				if(emailError){
				//there was a problem with emailing - indicate this to the user
				  callback (new Error("There was a problem sending you a Password Reset Instructions via email. Error is "+emailError));
				}
				else{
				  callback(null, sent);				
				}
			  }); 
			}
		});
  });

};

//locate a password reset
exports.getById = function (id, callback){
  PasswordResetRequest.findById(id, function (err, resetRequest){
	console.log ("Got PasswordResetRequest by ID = ",resetRequest);
    callback(err, resetRequest);
  });
};