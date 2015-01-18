/*
 This is the script that provides utility to perform CRUD operations on a User object
*/
var properties = require('./properties');
var Account = require('../models/account');

exports.add = function (req, res){
	console.log("Registration Request "+JSON.stringify(req.body));
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('registration', { account : account });
        }
        passport.authenticate('local')(req, res, function () {
          res.redirect('/');
        });
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