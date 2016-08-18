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

    var fakeSnippet = {_id: "MochaTestRepo", owner:"testOwner", displayName:"testDisplayName", description:"fakeDescription"};
    var fakeSnippet2 = {_id: "MochaTestRepo2", owner:"testOwner", displayName:"testDisplayName2"};
    var fakeSnippetRating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:5};
    var fakeSnippetRating2 = {snippetId: "MochaTestRepo", rater:"whoever", rating:1.5};

    beforeEach(function(done) {
        //cleanup fake user
        db.removeUser(fakeUser, function (err, data) {
            if (err) console.log(err);
            done();
        });
    }, 5000);

    afterEach(function(done) {
        //cleanup fake user and snippets
        db.removeUser(fakeUser, function (err, data) {
            db.removeSnippet(fakeSnippet._id, function(err, result){
                db.removeSnippet(fakeSnippet2._id, function(err, result){
                    db.removeSnippetRating(fakeSnippetRating, function (err, result) {
                        db.removeSnippetRating(fakeSnippetRating2, function (err, result) {
                            if (err) console.log(err);
                            done();
                        });
                    });
                });
            });
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

    it('should find a specific user in the database', function (done) {
        db.addUser(fakeUser, function(err, user) {
            var userId = user[0]._id.id;
            db.findUser(userId, function(err, result){
                expect(result.lastName).to.be.eql(fakeUser.lastName);
                done();
            })
        });
    });

    it('should be able to add a snippet in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            expect(result).to.be.eql(1);
            db.getSnippet(fakeSnippet._id, function(err, result) {
                expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                expect(result.description).to.be.eql(fakeSnippet.description);
                done();
            })
        });
    });

    it('should be able to update a snippet in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            expect(result).to.be.eql(1);
            fakeSnippet.displayName="blah";
            db.addUpdateSnippet(fakeSnippet, function(err, result) {
                db.getSnippet(fakeSnippet._id, function (err, result) {
                    expect(result.displayName).to.be.eql("blah");
                    done();
                })
            })
        });
    });

    it('should be able to get a snippet from the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            expect(result).to.be.eql(1);
            db.getSnippet(fakeSnippet._id, function (err, result) {
                expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                done();
            })
        });
    });

    it('should be able to get snippets by owner from the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            db.addUpdateSnippet(fakeSnippet2, function(err, result) {
                db.getSnippetsByOwner(fakeSnippet.owner, function (err, results) {
                    expect(results).to.exist;
                    expect(results[0].displayName).to.be.eql(fakeSnippet2.displayName);
                    expect(results[1].displayName).to.be.eql(fakeSnippet.displayName);
                    done();
                });
            });
        });
    });

    it('should be able to add a snippet ratings to the database', function (done) {
        //add a rating
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            expect(err).to.be.null;
            done();
        });
    });

    it('should be able to update a snippet rating in the database', function (done) {
        var modifiedRating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:4};

        //add a rating
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            db.addUpdateSnippetRating(modifiedRating, function (err, result) {
                //get the rating
                db.getSnippetRatings(fakeSnippetRating.snippetId, function (err, results) {
                    expect(results).to.exist;
                    expect(results[0].snippetId).to.be.eql(fakeSnippetRating.snippetId);
                    expect(results[0].rater).to.be.eql(fakeSnippetRating.rater);
                    expect(results[0].rating).to.be.eql(4);
                    done();
                });
            });
        });
    });

    it('should be able to get a snippet rating from the database', function (done) {
        //add a rating
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            //get the rating
            db.getSnippetRatings(fakeSnippetRating.snippetId, function (err, results) {
                expect(results).to.exist;
                expect(results[0].snippetId).to.be.eql(fakeSnippetRating.snippetId);
                expect(results[0].rater).to.be.eql(fakeSnippetRating.rater);
                expect(results[0].rating).to.be.eql(5);
                done();
            });
        });
    });

    it('should be able to get a users snippet rating from the database', function (done) {
        //add a rating
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            //get the rating
            var userRating = {
                snippetId: fakeSnippetRating.snippetId,
                rater: fakeSnippetRating.rater
            };
            db.getSnippetRatingByUser(userRating, function (err, result) {
                expect(result).to.exist;
                expect(result.snippetId).to.be.eql(fakeSnippetRating.snippetId);
                expect(result.rater).to.be.eql(fakeSnippetRating.rater);
                expect(result.rating).to.be.eql(5);
                done();
            });
        });
    });

    it('should be able to remove a snippet rating from the database', function (done) {
        //add a rating
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            //get the rating
            db.getSnippetRatings(fakeSnippetRating.snippetId, function (err, results) {
                expect(results).to.exist;
                expect(results[0].snippetId).to.be.eql(fakeSnippetRating.snippetId);
                expect(results[0].rater).to.be.eql(fakeSnippetRating.rater);
                expect(results[0].rating).to.be.eql(5);
                db.removeSnippetRating(fakeSnippetRating, function (err, result) {
                    expect(result).to.be.eql(1);
                    done();
                });
            });
        });
    });

    it('should get the snippets average of ratings', function (done) {
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            db.addUpdateSnippetRating(fakeSnippetRating2, function (err, result) {
                db.getSnippetRatingsAvg(fakeSnippetRating.snippetId, function (err, result) {
                    expect(result).to.be.eql(3.25);
                    done();
                })
            });
        });
    });
});