/*
This helper script is used to generate a PDF file (to be attached on an outgoing email).
The file-generator populates the generated file with the values.

@author Ishmael Makitla, GDG-Pretoria, RHoK-Pretoria

*/

var PDFDocument = require('pdfkit');
var fs=require('fs');
var async = require('async');
var textString = 'Next Time, you will have your Meter and other information here...This should be in the attachment if all goes well';

exports.generateFile = function (filename, callback){
 
 async.series([
		function(cbDone){
			console.log("Just piped the generated PDF Document...");
			doc = new PDFDocument();
			doc.pipe (fs.createWriteStream(filename));
			
			doc.fontSize(12);		
			doc.y = 320;
			doc.fillColor('black')
			doc.text(textString, {
			   paragraphGap: 10,
			   indent: 20,
			   align: 'justify',
			   columns: 2
			});
			
			//First Row, First Column
			doc.text('PORTION ', 13, 23, {fit: [20, 100]}).rect(10, 20, 100, 100).stroke();
			//value column
			doc.text('Portion-Value-Here', 113, 23, {fit: [20, 120]}).rect(110, 20, 100, 100).stroke();
			
			doc.text('ACCOUNT NUMBER ', 113, 123, {fit: [20, 50]}).rect(110, 20, 100, 100).stroke();
			/*
			doc.text('BP  ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('READING DATE ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('ELECTRICITY READING ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('WATER READING   ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('CONTACT TEL NO ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('E-MAIL ADDRESS ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('INITIALS AND SURNAME ', 113, 123, {fit: [20, 50]}).rect(10, 120, 100, 100).stroke();
			doc.text('PHYSICAL ADDRESS ', 113, 123, {fit: [20, 100]}).rect(10, 120, 100, 100).stroke(); */
					
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

