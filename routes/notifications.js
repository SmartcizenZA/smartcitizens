/*
This script is used to handle notifications.
Each user will have his own "inbox" wherein all the notification with "to" as the user's ID will be listed - 
Font (Bold) will be used to indicate unread notifications.
ASIDE: For Android - these notifications will be sent through GCM.
*/
var entities = require('../models/modelentities');
var Notification = entities.Notification;

// This method is used to add a new notification for the user. The notification argument contains the message, the recipient (user), the account (optional) 
// E.g: {to:'user', 'message':'body', account: []}
/*
    account: String,
	readings_id : String,
	to: String,
	message: String,
	read: {type:Boolean, default: false},
	updated: { type: Date, default: Date.now }

*/
exports.addNotification = function(notification, callback){
  console.log("Add Notification ", notification);
  if(!notification){
  }
  var notificationModel = new Notification(notification);
  notificationModel.save(function (err) {
	if(err) { console.log("Error Adding a Notification. Error is ", err); callback (err); return; }
	//return the ID of the newly added notification
	callback(null,notification._id); 
  }); 
  
};
//This method simply returns the list of all notifications for a user
exports.getUserNotifications = function(userId, callback){
	Notification.find({'to': userId}, function (err, userNotifications){
    callback(err, userNotifications);
  });
};
//This method returns list of notifications generated for an account
exports.getAccountNotifications = function(accountNumber, callback){
	Notification.find({'account': accountNumber}, function (err, accountNotifications){
    callback(err, accountNotifications);
  });
};
//This method returns the list of unread notifications for a User
exports.getUnreadUserNotifications = function(userId, callback){
	Notification.find({'to': userId, 'read':false}, function (err, unreadUserNotifications){
    callback(err, unreadUserNotifications);
  });
};
//This method returns list of Unread notifications generated for an account
exports.getUnreadAccountNotifications = function(accountNumber, callback){
	Notification.find({'account': accountNumber,'read':false}, function (err, unreadAccountNotifications){
    callback(err, unreadAccountNotifications);
  });
};

//This method deletes a Notification
exports.deleteNotification = function(notificationId, callback){
	Notification.findById(notificationId, function (err, notification) {
		if(!err && notification){
			notification.remove(function(err){ callback(err); });
		}
		else if(err){ callback(err); }
		else{ callback (new Error ("Could Not Find Notification to Delete")); }
    });
};