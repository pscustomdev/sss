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

exports.findById = function(id, next) {
    db.users.find(id).toArray(function(err, users){
        if (users[0]){
            next(err, users[0]);
        } else {
            next("User not found");
        }
    });
};