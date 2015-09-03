'use strict';

var db = require('../../db/mongo-dao');

console.log("**** (JASMINE/NODE/KARMA Back-End-Unit Testing: 'mongo-dao-spec') ****");
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
    
    it('should be able to add a user to the database', function (done) {
        db.addUser(fakeUser, function(err, users){
            if(users){
                expect(users).toBeTruthy();
                expect(users[0].firstName).toEqual("fakeFirst");
                expect(users[0].lastName).toEqual("fakeLast");
                expect(users[0].email).toEqual("fake@email.com");
            } else {
                expect(err).toEqual("ERROR");
            }
            done();
            var userEmail = {email: "fake@email.com"};
            db.findUsers(userEmail, function (err, user){
                expect(users).toBeTruthy();
                expect(users[0].firstName).toEqual("fakeFirst");
                done();
            })
        });
    });
    
    it('should be able to remove a user from the database', function (done) {
        //create the user so we can remove it.
        db.addUser(fakeUser, function(err, users){
            done();
            db.removeUser(fakeUser, function (err, data) {
                if (err) console.log(err);
                done();
                var userEmail = {email: "fake@email.com"};
                db.findUsers(userEmail, function (err, user){
                    expect(user).toBeFalsy();  
                    done();
                })
            });
        });
    });
});