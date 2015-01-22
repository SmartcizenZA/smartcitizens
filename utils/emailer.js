/*
This script is used to generate an email to be sent to the City - the email contains the readings in the attachment.
@author Ishmael Makitla, GDG-Pretoria, RHoK-Pretoria

*/

//required for emailing
var mailer = require("nodemailer");
//for generating PDF files
var fs = require('fs');
var FileCreator = require('./filecreator');

//Some useful literals
var CITY_OF_TSHWANE = "meterrecords@tshwane.gov.za";
exports.CITY_OF_TSHWANE_EMAIL = CITY_OF_TSHWANE;

var defaultSubject = "Meter Readings For Account ";
exports.DEFAULT_SUBJECT_PREFIX = defaultSubject;

var defaultEmailBody = "Please find the attached meter readings. \n\n\n Thank You.";
exports.DEFAULT_EMAIL_BODY = defaultEmailBody;

// Use Smtp Protocol to send Email
var smtpTransport = mailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "smartcitizen-email",
        pass: "smartcitizen-email-password"
    }
});

var mail = {
    from: "Smart Citizen <smartcitizen.cot@gmail.com>",
    to: "",
    subject: "",
    text: "",
    html: ""
}

//helper method for sending out an Email to City Offices with Meter Readings attached
exports.sendMailToCity = function(meterDataObject, subject, text, callback, sysGeneratedReadingsId){

    if(text){
	 console.log("Data provided, can generate file");
	 //now use file generator
	 var readingFileName = sysGeneratedReadingsId+".pdf";
	  FileCreator.generateFile(readingFileName,meterDataObject, function (error, data){
	     if(data){
		 //add as attachments
			mail.attachments = [{"filePath": "./"+readingFileName}];
			//TODO: change this to CITY_OF_TSHWANE_EMAIL
			mail.to = meterDataObject.email;
			mail.subject = subject;
			mail.html = text;
			//now send the message
			smtpTransport.sendMail(mail, function(error, response){
				console.log("Email-Send Error ", error);
				console.log("Email-Send Response ", response);
				if(error){ callback(false); }
				else { callback(true); }
				//finally close the SMTP connection
				smtpTransport.close();
			});
		 }
		 else{
			console.log("No Data File Created...");
			callback(false);
		 }
	  });
	}
}

//Helper method to send an email
exports.sendMail = function(recipient, subjectLine, body, callback){
	var emailMessage = {
		from: "Smart Citizen <smartcitizen.cot@gmail.com>",
		to: recipient,
		subject: subjectLine,
		text: "",
		html: body
	};
	smtpTransport.sendMail(emailMessage, function(emailError, response){
		console.log("sendMail Error ", emailError);
		console.log("sendMail Response ", response);
		if(emailError){ callback(emailError, false); }
		else { callback(null, true); }
		//finally close the SMTP connection
		smtpTransport.close();
	});
};
