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
        db.addUser(fakeUser, function(err, users){
            db.removeUser(fakeUser, function (err, data) {
                if (err) console.log(err);
                var userEmail = {email: "fake@email.com"};
                db.findUsers(userEmail, function (err, user){
                    expect(user).to.not.exist;
                    done();
                });
            });
        });
    });
});