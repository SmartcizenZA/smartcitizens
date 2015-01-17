/*
This helper script is used to generate a PDF file (to be attached on an outgoing email).
The file-generator populates the generated file with the values.
@author Ishmael Makitla, GDG-Pretoria, RHoK-Pretoria.
*/

var PDFDocument = require('pdfkit');
var fs=require('fs');
var async = require('async');
var textString = '';

exports.generateFile = function (filename, dataObject,callback){

 async.series([
		function(cbDone){
			console.log("Just piped the generated PDF Document...");
			doc = new PDFDocument();
			doc.pipe (fs.createWriteStream(filename));

			doc.fontSize(12);
			doc.y = 320;
			doc.fillColor('black');

			 //title: MONTHLY METER READING TEMPLATE
			 doc.text('MONTHLY METER READING TEMPLATE ', 100, 15, {fit: [20, 100]});
			 //the X-value of the second column
			 var secondColX = 205;
			//First Row, First Column							x   y    w    h
			doc.text('PORTION ', 53, 36, {fit: [20, 100]}).rect(50, 30, 150, 35).stroke();
			//value column                 x (value), y(value)                   x   y   w    h
			doc.text(dataObject.portion, secondColX, 36, {fit: [20, 120]}).rect(200, 30, 200, 35).stroke();

			doc.text('ACCOUNT NUMBER ', 53, 75, {fit: [20, 50]}).rect(50, 65, 150, 35).stroke();
			doc.text(dataObject.accNum, secondColX, 75, {fit: [20, 50]}).rect(200, 65, 200, 35).stroke();
			//BP = Marked as  3  on account example
			var y2 = (75+35);
			doc.text('BP ', 53, y2, {fit: [20, 50]}).rect(50, (65+35), 150, 35).stroke();
			var y3 = (65+35);
			var x3 = (50+200); //column-1-x plus width of previous row, column width
			doc.text(dataObject.bp, secondColX, y2, {fit: [20, 50]}).rect(200, y3, 200, 35).stroke();
			var readingDateY = (y3+35);
			doc.text('READING DATE ', 53, readingDateY+6, {fit: [20, 50]}).rect(50, readingDateY, 150, 35).stroke();
			var readingDateValueY = readingDateY;
			var readingDateValueX = (50+200);
			doc.text(dataObject.date, secondColX, readingDateValueY+6, {fit: [20, 50]}).rect(200, readingDateValueY, 200, 35).stroke();
			var electricityReadingY = readingDateY+35;
			doc.text('ELECTRICITY READING ', 53, electricityReadingY+6, {fit: [20, 50]}).rect(50, electricityReadingY, 150, 35).stroke();
			//add electricity reading value
			var electricityReadingValuesY = electricityReadingY;
			doc.text(dataObject.electricity, secondColX, electricityReadingValuesY+6, {fit: [20, 50]}).rect(200, electricityReadingValuesY, 200, 35).stroke();
			var waterReadingY = electricityReadingValuesY+35;
			doc.text('WATER READING ', 53, waterReadingY+6, {fit: [20, 50]}).rect(50, waterReadingY, 150, 35).stroke();
			//add electricity reading value
			var waterReadingValuesY = waterReadingY;
			doc.text(dataObject.water, secondColX, waterReadingValuesY+6, {fit: [20, 50]}).rect(200, waterReadingValuesY, 200, 35).stroke();
			//contact TEL
			var telY = waterReadingValuesY + 35;
			doc.text('Contact Tel. ', 53, telY+6, {fit: [20, 50]}).rect(50, telY, 150, 35).stroke();
			//add tel number value
			var telValuesY = telY;
			doc.text(dataObject.contactTel, secondColX, telValuesY+6, {fit: [20, 50]}).rect(200, telValuesY, 200, 35).stroke();
			//email
			//contact TEL
			var emailY = telValuesY + 35;
			var emailValuesY = emailY;
			doc.text('Email. ', 53, emailY+6, {fit: [20, 50]}).rect(50, emailY, 150, 35).stroke();
			var emailSeparator = new RegExp(",", 'g');
			doc.text(dataObject.email.replace(emailSeparator,"\n"), secondColX, emailValuesY+6, {fit: [20, 50]}).rect(200, emailValuesY, 200, 35).stroke();
			//INITIALS AND SURNAME
			var initialsY = emailValuesY +35;
			var initialsValuesY = initialsY;
			doc.text('Initials & Surname. ', 53, initialsY+6, {fit: [20, 50]}).rect(50, initialsY, 150, 35).stroke();
			doc.text(dataObject.names, secondColX, initialsValuesY+6, {fit: [20, 50]}).rect(200, initialsValuesY, 200, 35).stroke();
			//Physical Address
			var addressY = initialsValuesY +35;
			var addressValuesY = addressY;
			doc.text('Physical Address. ', 53, addressY+6, {fit: [20, 50]}).rect(50, addressY, 150, 65).stroke();
			doc.text(dataObject.address, secondColX, addressValuesY+6, {fit: [20, 50]}).rect(200, addressValuesY, 200, 65).stroke();
			//put the in the next page
			doc.addPage();
			doc.image(dataObject.image, 100, 60, {fit: [120, 120]})
				.stroke()
				.text('My Meter Reading Image. Location X, Y', 100, 50);
   
			doc.end();

			cbDone(null,"");
		},
		function(cbDone){
			console.log("Now got the file handle...");
			fs.readFile("./"+filename, function (err, fileData){
			cbDone(null,fileData);
			});
		}
	],
	function(error, result){
	console.log("Done. Result is ", result);
		if(result && result.length ===2){
			var data = result[1];
			callback(error, data);
		}
	});
}
