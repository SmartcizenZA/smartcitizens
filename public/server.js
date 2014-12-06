var databaseUrl = "scs"; // "username:password@example.com/mydb"
var collections = ["townships"]
var db = require("mongojs").connect(databaseUrl, collections);

// app.js
var c = db.townships.find();
console.log(c[0])