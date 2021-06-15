var mongoose =require("mongoose"),
	passportLocalMongoose=require("passport-local-mongoose");

var UserSchema =  new mongoose.Schema({
	name:String,
	username:String,
	password:String,
	easycount:Number,
	midcount:Number,
	hardcount:Number,
	totalcount:Number,
	rating:Number,
	friends:[
		{type:mongoose.Schema.Types.ObjectId,
		 ref:"user"
		}
	],
	DP: 
    { 
        data: Buffer, 
        contentType: String 
    } 
	
	
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user",UserSchema);
