/*
  This is the utility script for Smart Citizen Foundation to log the location of partial inventory of a spazza shop
  The most important property is the coordinates value; We use additional services such as Electricity sales, Airtime and Public Phone
  as partial inventory items of interest;
  
  Ishmael Makitla, 2015
*/

var entities = require('../models/modelentities');
var TuckShop = entities.TuckShop;

/* This function is used to add a new tuck shop
	name: String,
	x: String,
	y: String,
	airtime: {type: Boolean, default: false},
	publicPhone : {type: Boolean, default: false},
	electricity: {type: Boolean, default: false} 
*/
exports.add = function (newTuckshopDataRequest, callback){
	 var tuckShopData = newTuckshopDataRequest.body;
	 var newTuckShop = new TuckShop(tuckShopData);
	 newTuckShop.save(function (err) {
		if(!err){console.log("Added New TuckShop", newTuckShop); 
			callback (null, newTuckShop);
		}
		else{callback (err);}	  
	});
};
/*
 Function to add a picture to a tuckshop
*/
exports.addPicture = function (tuckshopId, picturePath, callback){
   TuckShop.findById(tuckshopId, function(err, tuchshop){
		if(!err && tuchshop){	
			//add gallery path if not existent
			if(!tuchshop.galleryURL){
				tuchshop.galleryURL = picturePath;
				tuchshop.save(function(err){
				//return the newly created path
					callback(err, tuchshop.galleryURL);
				});
			}			
		}
		else if(err){
		  callback(err);
		}
		else{
		 callback (new Error ("Could Not Find Meter Reading to Update"));
		}
	});
};

/*
  Function to list the Tuckshops in the database
*/
exports.list = function (callback){
	TuckShop.find(function (err, tuckshops){		
        callback(err, tuckshops);
    });
};
//Get specific tuckShopData
exports.getById = function (id, callback){
	TuckShop.findById(id, function (err, tuckshop){		
        callback(err, tuckshop);
    });
};

//List tuckshops discovered by
exports.listByDiscoverer = function (discoverer, callback){
	TuckShop.find({'discoverer': discoverer}, function (err, tuckshops){		
        callback(err, tuckshops);
    });
};

//Find the closest TuckShop (given X and Y)
exports.listClosest = function (coordinates, callback){
	//Todo : modify to retrieve those tuckshops using geo-fencing techniques
	TuckShop.find(function (err, tuckshops){		
        callback(err, tuckshops);
    });
};
//Find tuckshops with Airtime
exports.listSellingAirtime = function (airtimeFlag, callback){
	//Todo : modify to retrieve those tuckshops using geo-fencing techniques
	TuckShop.find({'airtime': airtimeFlag}, function (err, tuckshops){		
        callback(err, tuckshops);
    });
};
//Find tuckshops with prepaid-electricity

//Find tuckhops with public phone

//Find tuchshop in a township

