var debug = require('debug')('sss');
var mongoskin = require('mongoskin');
var config = require('../config');

var db = mongoskin.db(config.mongoUri, { safe:true });
db.bind('snippets');
db.bind('users');

exports.addUser = function(profile, next) {
    db.users.find({id: profile.email}).toArray(function(err, users){
        if (err) {
            next(err, null);
        }
        db.users.insert(profile, {}, function (err, results) {
            next(err, results.ops);
        });
    });
};

exports.removeUser = function(user, next) {
    db.users.remove({id: user.id}, function(err){
        next(err);
    });
};

exports.findUsers = function(queryObject, next) {
    db.users.find(queryObject).toArray(function(err, users){
        if(users[0]){
            next(err, users);
        } else {
            next("No user(s) found");
        }
    });
};

exports.findUser = function(id, next) {
    db.users.find(id).toArray(function(err, users){
        if (users[0]){
            next(err, users[0]);
        } else {
            next("User not found");
        }
    });
};

// snippet = {_id: "id", name: "name", rating: "rating", viewCount: "viewCount", owner: "postedBy"}
exports.addModifySnippet = function(snippet, next) {
    db.collection("snippets").update({_id:snippet._id}, {owner: snippet.owner, displayName: snippet.displayName}, {upsert:true},
        function(err, object) {
            if (err){
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, object);
        }
    );
};

exports.getSnippet = function(id, next) {
    db.collection('snippets').findOne({_id: id},
        function(err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};
