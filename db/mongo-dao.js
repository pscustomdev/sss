var debug = require('debug')('sss');
var mongoskin = require('mongoskin');
var config = require('../config');
var bcrypt = require('bcrypt');

var db = mongoskin.db(config.mongoUri, { safe:true });
db.bind('snippets');
db.bind('users');

exports.addUser = function(profile, next) {
    db.users.find({id: profile.email}).toArray(function(err, users){
        if (err) {
            next(err, null);
        }
        if (users[0]){
            next("User already exists");
        } else { //If user doesn't exist, then add them
            if (profile.password) {
                bcrypt.hash(profile.password, 10, function(err, hash) {
                    if (err) {
                        next(err, null);
                    }
                    profile.password = hash;
                });
            }
            db.users.insert(profile, {}, function (err, results) {
                next(err, results);
            });
        }
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