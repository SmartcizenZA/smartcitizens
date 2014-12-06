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

