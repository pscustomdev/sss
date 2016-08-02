'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'mongo-dao-spec') ****");

var db = require('../../db/mongo-dao');
var expect = require('chai').expect;

describe("Mongo Dao", function() {
    
    var fakeUser = {
        firstName: "fakeFirst",
        lastName: "fakeLast",
        email: "fake@email.com",
        password: "fakePassword"
    };

    beforeEach(function(done) {
        //cleanup fake user
        db.removeUser(fakeUser, function (err, data) {
            if (err) console.log(err);
            done();
        });
    }, 5000);

    afterEach(function(done) {
        //cleanup fake user
        db.removeUser(fakeUser, function (err, data) {
            if (err) console.log(err);
            done();
        });
    }, 5000);
    
    it('should return error if user already exists', function (done) {
        db.addUser(fakeUser, function(){});
        db.addUser(fakeUser, function(err, users){
            expect(err.message).equal("duplicate key error index");
            done();
        });
    });

    it('should be able to add a user to the database', function (done) {
        db.addUser(fakeUser, function(err, users){
            if(users){
                expect(users).to.exist;
                expect(users[0].firstName).equal("fakeFirst");
                expect(users[0].lastName).equal("fakeLast");
                expect(users[0].email).equal("fake@email.com");
            } else {
                expect(err.errmsg).contains("Error");
            }
            var userEmail = {email: "fake@email.com"};
            db.findUsers(userEmail, function (err, users){
                expect(users).to.exist;
                expect(users[0].firstName).equal("fakeFirst");
                done();
            });
        });
    });

    it('should be able to remove a user from the database', function (done) {
        //create the user so we can remove it.
        db.addUser(fakeUser, function(err, user){
            db.removeUser(fakeUser, function (err, data) {
                if (err) console.log(err);
                var userEmail = {email: "fake@email.com"};
                db.findUsers(userEmail, function (err, users){
                    expect(users[0]).to.not.exist;
                    done();
                });
            });
        });
    });

    xit('should be able to find users in the the database', function (done) {
        //exports.findUsers = function(queryObject, next) {
        //    db.collection("users").find(queryObject).toArray(function(err, users){
        //        if (err){
        //            console.warn(err.message);
        //            next(err, null);
        //        } else {
        //            if (users) {
        //                next(err, users);
        //            } else {
        //                next("No user(s) found");
        //            }
        //        }
        //    });
        //};
    });

    xit('should be find a specific user in the database', function (done) {
        //
        //exports.findUser = function(id, next) {
        //    db.collection("users").find(id).toArray(function(err, users){
        //        if (users[0]){
        //            next(err, users[0]);
        //        } else {
        //            next("User not found");
        //        }
        //    });
        //};
        //
    });

    xit('should be able to update a snippet in the database', function (done) {
        //exports.addUpdateSnippet = function(snippet, next) {
        //    db.collection("snippets").update({snippetId:snippet._id}, {snippetId:snippet._id, owner: snippet.owner, displayName: snippet.displayName, postedOn: Date.now()}, {upsert:true},
        //        function(err, object) {
        //            if (err){
        //                console.warn(err.message);
        //                next(err, null);
        //            }
        //            next(err, object);
        //        }
        //    );
        //};
    });


    xit('should be able to add a snippet to the database', function (done) {

    });

    xit('should be able to get a snippet from the database', function (done) {
        //exports.getSnippet = function(id, next) {
        //    db.collection('snippets').findOne({snippetId: id},
        //        function(err, result) {
        //            if (err) {
        //                console.warn(err.message);  // returns error if no matching object found
        //                next(err, null);
        //            }
        //            next(err, result);
        //        }
        //    );
        //};
    });
});