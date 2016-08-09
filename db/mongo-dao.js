var debug = require('debug')('sss');
var config = require('../config');
var tingo = require('tingodb')();
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
    db.collection("users").find(id).toArray(function(err, users){
        if (users[0]){
            next(err, users[0]);
        } else {
            next("User not found");
        }
    });
};

exports.addUpdateSnippet = function(snippet, next) {
    db.collection("snippets").update({snippetId:snippet._id}, {snippetId:snippet._id, owner: snippet.owner, displayName: snippet.displayName, postedOn: Date.now()}, {upsert:true},
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
        if (results[0]){
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
