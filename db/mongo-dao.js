var debug = require('debug')('sss');
var mongoskin = require('mongoskin');
var config = require('../config');
var db = mongoskin.db(config.mongoUri, {safe:true});
db.bind('snippets');
db.bind('users');

exports.addUser = function(user, next) {
    db.users.find({email: user.email}).toArray(function(err, items){
        //If user doesn't exist then add them
        if(items[0]){
            next("User already exists");  //probably should throw a 404 or something here.
        } else {
             db.users.insert(user, {}, function (err, results) {
                next(err, results);
            });
        }
    });
};

exports.removeUser = function(user, next) {
    db.users.remove({email: user.email}, function(err){
        next(err);
    });
};

exports.findUsers = function(queryObject, next) {
    db.users.find(queryObject).toArray(function(err, items){
        if(items[0]){
            next(err, items);
        } else {
            next("No user(s) found");  //probably should throw a 404 or something here.
        }
    });
};
