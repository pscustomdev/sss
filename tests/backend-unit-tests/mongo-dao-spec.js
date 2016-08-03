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

    it('should be able to find users in the the database', function (done) {
        db.addUser(fakeUser, function(err, user) {
            db.findUsers({firstName: fakeUser.firstName}, function(err, results){
                expect(results[0].lastName).to.be.eql(fakeUser.lastName);
                done();
            })
        });
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

    it('should be able to add a snippet in the database', function (done) {
        var fakeSnippet = {_id: "MochaTestRepo", owner:"testOwner", displayName:"testDisplayName"};
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            expect(result).to.be.eql(1);
            db.getSnippet(fakeSnippet._id, function(err, result) {
                expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                db.removeSnippet(fakeSnippet._id, function(err, result){
                    done();
                });
            })
        });
    });

    it('should be able to update a snippet in the database', function (done) {
        var fakeSnippet = {_id: "MochaTestRepo", owner:"testOwner", displayName:"testDisplayName"};
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            expect(result).to.be.eql(1);
            fakeSnippet.displayName="blah";
            db.addUpdateSnippet(fakeSnippet, function(err, result) {
                db.getSnippet(fakeSnippet._id, function (err, result) {
                    expect(result.displayName).to.be.eql("blah");
                    db.removeSnippet(fakeSnippet._id, function (err, result) {
                        done();
                    });
                })
            })
        });
    });

    it('should be able to get a snippet from the database', function (done) {
        var fakeSnippet = {_id: "MochaTestRepo", owner:"testOwner", displayName:"testDisplayName"};
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            expect(result).to.be.eql(1);
            db.getSnippet(fakeSnippet._id, function (err, result) {
                expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                db.removeSnippet(fakeSnippet._id, function (err, result) {
                    done();
                });
            })
        });
    });
});