/*
This script is used to generate an email to be sent to the City - the email contains the readings in the attachment.

@author Ishmael Makitla, GDG-Pretoria, RHoK-Pretoria

*/

//required for emailing
var mailer = require("nodemailer");
//for generating PDF files
var fs = require('fs');
var FileCreator = require('./filecreator');

var CITY_OF_TSHWANE = "meterrecords@tshwane.gov.za";


// Use Smtp Protocol to send Email
var smtpTransport = mailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "smartcitizen.cot@gmail.com",
        pass: "RH0k2014"
    }
});

var mail = {
    from: "Smart Citizen <smartcitizen.cot@gmail.com>",
    to: "to@gmail.com",
    subject: "Send Email Using Node.js",
    text: "Node.js New world for me",
    html: "<b>Node.js New world for me</b>"
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
			mail.to = CITY_OF_TSHWANE;
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
		 }
	  });
	}   
}

