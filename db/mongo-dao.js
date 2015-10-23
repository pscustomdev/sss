var debug = require('debug')('sss');
var mongoskin = require('mongoskin');
var config = require('../config');
var bcrypt = require('bcrypt');

var db = mongoskin.db(config.mongoUri, { safe:true });
db.bind('snippets');
db.bind('users');

exports.addUser = function(user, next) {
    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err) {
            next(err, null);
        }
        db.users.find({email: user.email}).toArray(function(err, users){
            if (err) {
                next(err, null);
            }
            //If user doesn't exist then add them
            if (users[0]){
                next("User already exists");  //probably should throw a 404 or something here.
            } else {
                user.password = hash;
                db.users.insert(user, {}, function (err, results) {
                    next(err, results);
                });
            }
        });
    });
};

exports.removeUser = function(user, next) {
    db.users.remove({email: user.email}, function(err){
        next(err);
    });
};

exports.findUsers = function(queryObject, next) {
    db.users.find(queryObject).toArray(function(err, users){
        if(users[0]){
            next(err, users);
        } else {
            next("No user(s) found");  //probably should throw a 404 or something here.
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