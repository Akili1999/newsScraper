var express = require('express');

var bodyParser = require('body-parser');

var logger = require('morgan');

var mongoose = require('mongoose');

var axios = require('axios')

// var Note = require('./models/Note.js');

// var Article = require('./models/Article.js');

var path = require("path")

var cheerio = require('cheerio');

mongoose.connect("mongodb://localhost/newyorktimes", { useNewUrlParser: true });

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static("public"));

var exphbs = require('express-handlebars');
app.engine("handlebars", exphbs({
	defaultLayout: "main",
	partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// db.once("error", function(error){
// 	console.log("Mongoose Error: ", error);
// });

// db.once("open", function(){
// 	console.log("Mongoose connection successful.");
// });

app.get("/", function(req,res){
	db.Article.find({"saved": false}).limit(20).exec(function(error,data){
		var hbsObject = {
			article: data
		};
		console.log(hbsObject);
		res.render("home", hbsObject);
	});
});

app.get("/saved", function(req,res){
	db.Article.find({"saved": true}).populate("notes").exec(function(error, articles){
		var hbsObject = {
			article: articles
		};
		res.render("saved", hbsObject);
	});
});

app.get("/scrape", function(req,res){
  console.log("hello")
	axios.get("https://www.npr.org/sections/national/").then(function(response){
    console.log("response")
		var $ = cheerio.load(response.data);
		$("article").each(function(i,element){
			var result = {};
			// result.title = $(this).children("h2").text();
			// // result.summary = $(this).children(".summary").text();
			 result.link = $(this).children(".teaser").children("a").attr("href");
      console.log(result)
    // db.Article.create(result)
    // .then(function(dbArticle){
    //   console.log(dbArticle)
    // }).catch(function(dbArticle){
    //   console.log(dbArticle)
    // })
		});
		res.send("Scrape Complete");
	});
});

app.get("/articles", function(req,res){
	db.Article.find({}).limit(20).exec(function(error, doc){
		if(error){
			console.log(error);
		}
		else{
			res.json(doc);
		}
	});
});

app.get("/articles/:id", function(req,res){
	Article.findOne({ "_id": req.params.id})
	.populate("note")
	.exec(function(error, doc){
		if(error){
			console.log(error);
		}
		else{
			res.json(doc);
		}
	});
});

app.post("/articles/save/:id", function(req,res){
	db.Article.findOneAndUpdate({ "_id": req.params.id}, {"saved": true})
	.exec(function(err, doc){
		if(err){
			console.log(err);
		}
		else{
			res.send(doc);
		}
	});
});

app.post("/articles/delete/:id", function(req,res){
	db.Article.findOneAndUpdate({ "_id": req.params.id}, {"saved": false, "notes":[]})
	.exec(function(err, doc){
		if(err){
			console.log(err);
		}
		else{
			res.send(doc);
		}
	});
});

app.post("notes/save/:id", function(req,res){
	var newNote = new Note({
		body: req.body.text,
		article: req.params.id
	});
	console.log(req.body)
	newNote.save(function(error, note){
		if(error){
			console.log(error);
		}
		else{
			db.Article.findOneAndUpdate({ "_id": req.params.id}, {$push: { "notes": note } })
			.exec(function(err){
				if(err){
					console.log(err);
					res.send(err);
				}
				else{
					res.send(note);
				}
			});
		}
	});
});

app.delete("/notes/delete/:note_id/:article", function(req,res){
	Note.findOneAndRemove({"_id": req.params.note.id}, function(err){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			db.Article.findOneAndUpdate({"_id": req.params.article_id}, {$pull: {"notes": req.params.note_id}})
				.exec(function(err){
					if(err){
						console.log(err);
						res.send(err); 
					}
					else{
						res.send("Note Deleted");
					}
				});
		}
	});
});

app.listen(PORT, function(){
	console.log("App running on PORT: " + PORT);
});