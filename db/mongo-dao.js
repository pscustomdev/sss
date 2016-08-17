var debug = require('debug')('sss');
var config = require('../config');
var tingo = require('tingodb')();
var _ = require('underscore');
var db = new tingo.Db(config.mongoFilePath, {});

exports.addUser = function(profile, next) {
    db.collection("users").find({id: profile.email}).toArray(function(err, users){
        if (err) {
            next(err, null);
        }
        db.collection("users").insert(profile, {}, function (err, results) {
            next(err, results);
        });
    });
};

exports.removeUser = function(user, next) {
    db.collection("users").remove({email: user.email}, function(err){
        next(err);
    });
};

exports.findUsers = function(queryObject, next) {
    db.collection("users").find(queryObject).toArray(function(err, users){
        if (err){
            console.warn(err.message);
            next(err, null);
        } else {
            if (users) {
                next(err, users);
            } else {
                next("No user(s) found");
            }
        }
    });
};

exports.findUser = function(id, next) {
    db.collection("users").findOne({_id: id},
        function(err, user){
            if (user){
                next(err, user);
            } else {
                next("User not found");
            }
        }
    );
};

exports.addUpdateSnippet = function(snippet, next) {
    db.collection("snippets").update({snippetId:snippet._id}, {snippetId:snippet._id, owner: snippet.owner, displayName: snippet.displayName, postedOn: Date.now(), description: snippet.description}, {upsert:true},
        function(err, object) {
            if (err){
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};

exports.getSnippet = function(id, next) {
    db.collection('snippets').findOne({snippetId: id},
        function(err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.getSnippetsByOwner = function(owner, next) {
    db.collection('snippets').find({owner:owner}).sort({displayName:-1}).toArray(function(err, results){
        if (results && results[0]){
            next(err, results);
        } else {
            next("Snippets not found");
        }
    });
};

exports.removeSnippet = function(id, next) {
    db.collection('snippets').remove({snippetId: id},
        function(err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.addUpdateSnippetRating = function(rating, next) {
    db.collection("ratings").update({snippetId:rating.snippetId, rater: rating.rater},{snippetId:rating.snippetId, rater: rating.rater, rating:rating.rating}, {upsert:true},
        function(err, object) {
            if (err){
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};

exports.updateSnippetRating = function(rating, next) {
    db.collection("ratings").update({snippetId:rating.snippetId, rater: rating.rater, rating:rating.rating},
        function(err, object) {
            if (err){
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};


exports.getSnippetRatings = function(id, next) {
    db.collection('ratings').find({snippetId: id}).toArray(function(err, results) {
        if (results && results.length > 0) {
            next(err, results);
        } else {
            console.warn(err.message);
            next("No ratings found");
        }
    });
};

exports.removeSnippetRating = function(id, next) {
    db.collection('ratings').remove({snippetId: id},
        function(err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.getSnippetRatingsAvg = function(id, next) {
    //TingoDB doesn't support aggregate function so we have to average it ourselves.
    db.collection('ratings').find({snippetId: id}).toArray(function(err, results) {
        if (results && results.length > 0) {
            var ratings = _.pluck(results, 'rating'); //get an array of only the ratings
            var sum = ratings.reduce(function(a, b) { return a + b; });
            var avg = sum / ratings.length;
            next(err, avg);
        } else {
            next(err, 0);  //we send a 0 if we don't have any ratings yet.
        }
    });
};