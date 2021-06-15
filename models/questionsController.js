
var bodyParser = require('body-parser');
var mongoose =require("mongoose"),
	passportLocalMongoose=require("passport-local-mongoose");
var urlencodedParser = bodyParser.urlencoded({extended: false});
var mongoose = require('mongoose');
const url = require('url');
//const params = new URLSearchParams(location.search);

const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const uri = 'mongodb+srv://vishaka:Vishaka@cluster0.u0mor.mongodb.net/questions?retryWrites=true&w=majority';

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		res.redirect('/login');
	}
}

//create a schema 
var quesSchema = new mongoose.Schema({
	ques: String,
	opt: [{option : String}],
	corrAns : String,
	level : String,
	company: String,
	frequency: Number,
	comments:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"comments"
		}
	]

});


//quesSchema.plugin(passportLocalMongoose);


var Question = mongoose.model('Question', quesSchema);
let getFrom;
var cat;
var comp;
var dataNew;
var qid;
var id;
var resultNew;
var currUser;
var currLevel;
var flag = 0;
var answered ;
var myFriends = [];
var viewedQues;
var currRating;

module.exports =Question;


//function to check options
function checkAnswer(req,  data){
		viewedQues = undefined;
		console.log("CHECKING ANSWER");
		console.log(data);

		var userQues = Object.keys(req.query)[0];
		var userAns = Object.values(req.query)[0];
		console.log(req.query);

		if("view" in req.query)
		{
			viewedQues = Object.values(req.query)[1];

		}
		console.log("viewed: "+ viewedQues);

		var j = String(userQues).slice(-1);

		console.log(j);
		var result = [];

		if(data!== undefined)
		{
			console.log("hello");
			for(var i=0; i<data.length; i++)
			{
				
				if(i==j)
				{
					//console.log(typeof i);
					console.log(data[i].corrAns);
					if(userAns == data[i].corrAns)
					{
						result.push("Correct!");
						console.log("quest level");
						currLevel = data[i].level;
						answered = data[i]._id;
						console.log(currLevel);
						console.log(answered);
						flag = 1;
						console.log(req.params.id);
						
					}
					else if(userAns != undefined && userAns != data[i].corrAns)
					{

						result.push("Incorrect.");
						answered = data[i]._id;
						console.log(answered);
						flag = 0;
					}
					else
					{
						result.push("");
					}
				}
				else
					result.push("");

			}
			console.log(result);
			resultNew = result;
		}
		
		return result;

}

function updatePoints(client_user)
{
	
	if(flag == 1 && viewedQues == undefined)
	{
			client_user.connect(err => {
			collection = client_user.db("questions").collection("users");
			console.log("success getting users");
			console.log("level of question: ");
			console.log(currLevel);

			if(answered != null)
			{
				if(currLevel=="easy")
				{
					collection.updateOne({username: currUser, solved : {$nin : [answered]}}, {$inc: {easycount : 1, totalcount :1, rating : 5}, $addToSet : {solved : answered}},
					function(err, res) {
						    if (err) throw err;
						    console.log("1 easy document updated");
						    client_user.close();
						  });
				}
				else if(currLevel=="medium")
				{
					collection.updateOne({username: currUser , solved : {$nin : [answered]}}, {$inc: {midcount : 1, totalcount :1, rating : 10}, $addToSet : {solved : answered}},
					function(err, res) {
						    if (err) throw err;
						    console.log("1 medium document updated");
						    client_user.close();
						  });
				}
				else if(currLevel=="hard")
				{
					collection.updateOne({username: currUser,solved : {$nin : [answered]}}, {$inc: {hardcount : 1, totalcount :1, rating : 15}, $addToSet : {solved : answered}},
					function(err, res) {
						    if (err) throw err;
						    console.log("1 hard document updated");
						    client_user.close();
						  });
				}

			}

		});
	}
	else
	{
		if(answered != null)
		{
			client_user.connect(err => {
			collection = client_user.db("questions").collection("users");
			collection.updateOne({username: currUser}, {$addToSet : {solved : answered}},
					function(err, res) {
						    if (err) throw err;
						    console.log("1 document updated");
						    client_user.close();
						  });

			});
		}
		if(viewedQues != undefined)
		{
			client_user.connect(err => {
			collection = client_user.db("questions").collection("users");
			collection.updateOne({username: currUser}, {$addToSet : {solved : ObjectId(viewedQues)}},
					function(err, res) {
						    if (err) throw err;
						    console.log("1 document updated");
						    client_user.close();
						  });

			});
		}
		
	}

}

function retrievediscussion(req,res,client,collectionName,route,qid){
	console.log("Quest to retrieve discussion");
	client.connect(err => {
    collection = client.db("questions").collection(collectionName);
	console.log(collectionName);
	console.log(qid);
	 id = mongoose.Types.ObjectId(qid);
	
	//collection.find({_id:qid},function(err,foundq){
	//collection.find({_id:id}).toArray(function(err,data){
	//collection.find({},function(err,foundq){
	collection.find({_id:id}).toArray(function(err,foundq){
		if(err){
			console.log(err);
		}
		else{
			console.log(foundq);
			
			res.render("./questions/qdiscuss",{foundq:foundq[0],subject:collectionName});
		}
	})
    // perform actions on the collection object
    client.close();
});
}




//function to retrieve all questions
function retrieveQuestions(req, res, client, collectionName, route)
{
	console.log("IN THE FUNCTION NOW");
	//let client = new MongoClient(uri, { useNewUrlParser: true});
	var client_user = new MongoClient(uri, { useNewUrlParser: true});
	
		if( (!("filtercat" in req.query) && !("filtercomp" in req.query)) )
		{
			client.connect(err => {
					  collection = client.db("questions").collection(collectionName);
					  
					  console.log("success getting");
					  collection.find({}).toArray(function(err,data){
							if(err) throw err;
							console.log(data);

							var result = checkAnswer(req, data);
							updatePoints(client_user);
							res.render(route, {question : data, result : result, alert:"",subject:collectionName,getFrom: collectionName });

						});
			
			        });
					  	client.close();	
		}

}

//function to retrieve 
function retrieve(req, res, client, getFrom, route, back)
{
	console.log("IN RETRIEVE FUNCTION");
	var client = new MongoClient(uri, { useNewUrlParser: true});
	var client_user = new MongoClient(uri, { useNewUrlParser: true});
	
	
	
		console.log("HITTING CHECK");
		console.log(req.query);
		console.log(cat);
		
		if(cat!==undefined && comp ===undefined)
		{
			console.log(cat);
			

			client.connect(err => {

			collection = client.db("questions").collection(getFrom);
			console.log("filtering stuff");
			collection.find({level: cat}).toArray(function(err,data){
						if(err) throw err;
						
						var result = checkAnswer(req, data);
						console.log(result);
						updatePoints(client_user);
						res.render('./questions/questionsNew.ejs', {question : data, result : result, back:back,subject:getFrom, getFrom: getFrom});
	
													
					
					});

			});
			client.close();
		}

		else if(cat===undefined && comp !==undefined)
		{
			console.log(cat);
			
			client.connect(err => {

			collection = client.db("questions").collection(getFrom);
			console.log("filtering stuff");
			collection.find({company: comp}).toArray(function(err,data){

						if(err) throw err;
						
						

						var result = checkAnswer(req, data);
						console.log(result);
						updatePoints(client_user);
						res.render('./questions/questionsNew.ejs', {question : data, result : result, back:back,subject:getFrom, getFrom: getFrom});
						
					
					});


			});
			client.close();
		}

		else if(cat!==undefined && comp !==undefined)
		{
			console.log(cat);
			
			client.connect(err => {

			collection = client.db("questions").collection(getFrom);
			console.log("filtering stuff");
			collection.find({level: cat, company:comp}).toArray(function(err,data){

						if(err) throw err;
						
	
						var result = checkAnswer(req, data);
						console.log(result);
						updatePoints(client_user);
						res.render('./questions/questionsNew.ejs', {question : data, result : result, back:back,subject:getFrom, getFrom: getFrom});
	
													
					
					});


			});
			client.close();
		}

	

}


//function to post new questions to appropriate database
function postTo(client, connectTo, newQues)
{

		client.connect(err => {

			  collection = client.db("questions").collection(connectTo);
			  
			  console.log("success");

			  	collection.insertOne(newQues, (err, result) => {
				        if(err) {
				            return res.status(500).send(err);
				            console.log(err);
				        }

				 
				        	console.log("done");
				
	        });
			  	client.close();
		});
}
function compare(a,b)
{
	const ratingA = a.rating;
	const ratingB = b.rating;

	let comp = 0;
	if(ratingA > ratingB)
	{
		comp = 1;
	}
	else if(ratingA < ratingB)
	{
		comp = -1;
	}
	return comp * -1;
}

function rank(data)
{
	var friendsRating = [];
	friendsRating.push({'name': "you", 'rating': currRating});

	for(var i = 0; i<data.length; i++)
	{
		friendsRating.push({'name': data[i].name, 'rating': data[i].rating});
	}

	/*friendsRating[0].rating = 50;
	friendsRating[1].rating = 100;*/
	console.log("ratings array");
	console.log(friendsRating);

	friendsRating.sort(compare);
	console.log("after sort");
	console.log(friendsRating);

	return friendsRating;


}

function rankFriends(req, res, client, myFriends)
{
	
	console.log("ranking friends");
	client.connect(err => {
		collection = client.db("questions").collection("users");
			  
			  console.log("success");

	collection.find({_id: {$in : myFriends}}).toArray(function(err,data){

						if(err) throw err;
						console.log("moi friends");
						console.log(data);
						var finalRating = rank(data);
						res.render('./user/friendsRank.ejs', {data: finalRating});
											
					});
		});
}





module.exports = function(app){
	//making express app available here
	app.use(bodyParser.json());


	app.get('/dbms/:id',isLoggedIn,function(req,res){

		
		var client1 = new MongoClient(uri, { useNewUrlParser: true});
		getFrom = "dbms";
		currUser = req.user.username;
		
		retrieveQuestions(req, res, client1, "dbms", './questions/questionsDbms.ejs');

	});
		
	


	app.get('/os/:id',isLoggedIn, function(req,res){

		var client3 = new MongoClient(uri, { useNewUrlParser: true});
		getFrom ="os";
		currUser = req.user.username;
		
		retrieveQuestions(req, res, client3,  "os", './questions/questionsOs.ejs');
		
		
	});



	app.get('/network/:id',isLoggedIn, function(req,res){

		var client5 = new MongoClient(uri, { useNewUrlParser: true});
		getFrom = "network";
		currUser = req.user.username;
		
		retrieveQuestions(req, res, client5,  "network", './questions/questionsNetwork.ejs');

	});



	app.get('/dsa/:id',isLoggedIn, function(req,res){

		var client4 = new MongoClient(uri, { useNewUrlParser: true});
		getFrom = "dsa";
		currUser = req.user.username;	

		retrieveQuestions(req, res, client4, "dsa", './questions/questionsDsa.ejs');
		
	});



	app.get('/aptitude/:id',isLoggedIn, function(req,res){

		var client2 = new MongoClient(uri, { useNewUrlParser: true});
		getFrom = "aptitude";
		currUser = req.user.username;
		
		retrieveQuestions(req, res, client2, "aptitude", './questions/questionsAptitude.ejs');
		
	});



	app.get('/question/:id',isLoggedIn, function(req,res){

		res.render('./questions/questionsMainPage.ejs');


	});

	app.get('/questions/filter/:id',isLoggedIn, function(req, res){

		var client = new MongoClient(uri, { useNewUrlParser: true});
		console.log(req.query);
		
		if("filtercat" in req.query && "filtercomp" in req.query)
		{
			cat = req.query.filtercat;
			comp = req.query.filtercomp;
		}

		else if("filtercat" in req.query)
		{
			cat = req.query.filtercat;
			comp = undefined;
		}
		else if("filtercomp" in req.query)
		{
			 comp = req.query.filtercomp;
			 cat = undefined;
		}

		console.log("entering filter");
		/*console.log(cat);
		console.log(comp);
		console.log(getFrom);*/
		
		retrieve(req, res, client, getFrom, './questions/questionsNew.ejs', getFrom);

	});
	
	app.get("/discuss/:subject/:qid",isLoggedIn,function(req,res){

		var client = new MongoClient(uri, { useNewUrlParser: true });
		getfrom = req.params.subject;
		var qid = req.params.qid;
		console.log(getfrom);
		console.log(qid);
		retrievediscussion(req,res,client,getfrom,'./questions/discuss.ejs',qid);

	
});
	
	
	



	app.get('/questions/new',isLoggedIn, function(req, res){

		res.render('./questions/addNewquestions.ejs');

	});

	


	app.post('/questions/new', urlencodedParser,  function(req, res){

		console.log(req.body);
		var data = req.body;

		var newQues = new Question({ques:data.question, 
						opt:[{option:data.optionA}, {option: data.optionB},{option: data.optionC},{option: data.optionD}], 
						corrAns: data.correct, 
						level: data.level, 
						company: data.company, 
						frequency: data.frequency,
						comments:[]
					});

			
		console.log(data.category);
		var connectTo = data.category;
		var database,collection;

		if(connectTo =="dbms")
		{
			var client1 = new MongoClient(uri, { useNewUrlParser: true});
			postTo(client1, "dbms", newQues);

		}
		else if(connectTo == "aptitude")
		{
			var client2 = new MongoClient(uri, { useNewUrlParser: true});
			postTo(client2, "aptitude", newQues);
		}

		else if(connectTo == "os")
		{
			var client3 = new MongoClient(uri, { useNewUrlParser: true});
			postTo(client3, "os", newQues);
		}

		else if(connectTo == "dsa")
		{
			var client4 = new MongoClient(uri, { useNewUrlParser: true});
			postTo(client4, "dsa", newQues);
		}

		else if(connectTo == "network")
		{
			var client5 = new MongoClient(uri, { useNewUrlParser: true});
			postTo(client5, "network", newQues);
		}
		
        res.render("./questions/addNewquestions.ejs");
        

	});

	app.get('/user/:id/ranklist', function(req, res){

		var client = new MongoClient(uri, { useNewUrlParser: true});
		
		myFriends = req.user.friends;
		currRating = req.user.rating;
		console.log(myFriends);
		rankFriends(req, res, client, myFriends);


	});

	

};