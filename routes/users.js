/*
 This is the script that provides utility to perform CRUD operations on a User object
*/
var properties = require('./properties');
var Account = require('../models/account');
var passport = require('passport');
//for creating user-specific images(readings evidence) 
var mkdirp = require('mkdirp');

exports.add = function (req, res){
	console.log("Registration Request "+JSON.stringify(req.body));
    alreadyExisits(req.body.username, function(err, exists){
		if(exists){
			console.log("Chosen Name Already Exists, forgot password?");
			res.send("That username already exists, you might have forgotten your password. Otherwise choose a different name");
		}
		else{			
			Account.register(new Account({ username : req.body.username, email: req.body.email }), req.body.password, function(err, account) {
				if (err) {
					return res.render('registration', { account : account });
				}
				//at this point we created the user -
				var userSpecificFolder = req.body.baseFolder+'/'+account.username;
				console.log("Folder will be at:: "+userSpecificFolder);
				mkdirp(userSpecificFolder, function(err) { 
				  if(err){ console.log("PROBLEM: User Created but his/her images folder not created. ", err);}
				  else{ console.log("Folder Created At:: "+userSpecificFolder);}
				});
				passport.authenticate('local')(req, res, function () {
				  res.redirect('/');
				});
			});
		}
	});
  };
 /*
	Get a User Account by ID - this is done by admin or the user whose account is looked up.
*/ 
 exports.getUserById = function (userId, callback){
     //query the DB for the user with the provided userId
	 Account.findById(userId, function (err, account){
	   callback(err, account);
	 });
  };
/*
	Get a list of all users - this is an admin action.
*/
exports.list = function(callback){
    Account.find(function(err, accounts){
	  callback(err, accounts);
	});
};
 
/*
	Update an account -  this is an admin action (admin and owner)
*/
exports.updateAccount = function(id, values, callback){
	if(!values){ callback (new Error ("Values for Update Not Defined. Update Not Possible")); return;}
	
	Account.findById(id, function(err, account){
		if(!err && account){
		 //perform an upsert operation here - all other fields except username can be changed
		 //these are email address, status (active, inactive), access level (admin, user)					
			account.save(function(err){
				callback(err, account);
			});
		}
		else if(err){
		  callback(err);
		}
		else{
		 callback (new Error ("Could Not Find Meter Reading to Update"));
		}
	});
}

exports.resetPassword = function (passwordResetRequest, callback){
	Account.findById(passwordResetRequest.userId, function(err, account){
	 //did we find the user?
	  if(account){
	    //now update the password and save it.
		Account.setPassword(passwordResetRequest.password, function(passwordResetError, newPasswordAccount){
		  callback(passwordResetError,newPasswordAccount); 
		});		
	  }
	});

};

/*
	Delete an account -  this is an admin action
*/
exports.deleteAccount = function (id, callback){
	console.log("deleteAccount. Id = ", id);
	Account.findById(id, function (err, account) {
		if(!err && account){
			account.remove(function(err){
				callback(err);
			});
		}
		else if(err){
		  callback(err);
		}
		else{
		 callback (new Error ("Could Not Find Account to Delete"));
		}
    });
}
/*
Helper method to check if the chosen user name does not exist
*/
function alreadyExisits(username, callback){
   Account.findOne({'username':username}, function (err, existingUserAccount){
    if(err){callback(err);}
	else{
		if(existingUserAccount){callback(null, true);}
		else{callback(null, false);}
	}
   });;
}