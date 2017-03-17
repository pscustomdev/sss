'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'mongo-dao-spec') ****");

var db = require('../../db/mongo-dao');
var expect = require('chai').expect;

describe("Mongo Dao", function() {

    var fakeUser = {
        id:123,
        firstName: "fakeFirst",
        lastName: "fakeLast",
        email: "fake@email.com",
        password: "fakePassword",
        userRatingRank:20
    };
    var fakeUser2 = {
        id:1232,
        firstName: "fakeFirst2",
        lastName: "fakeLast2",
        email: "fake2@email.com",
        password: "fake2Password",
        userRatingRank:30
    };

    var fakeSnippet = {_id: "MochaTestRepo", owner:"testOwner", displayName:"testDisplayName", description:"fakeDescription"};
    var fakeSnippet2 = {_id: "MochaTestRepo2", owner:"testOwner", displayName:"testDisplayName2"};
    var fakeSnippetRating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:5};
    var fakeSnippetRating2 = {snippetId: "MochaTestRepo", rater:"testOwner2", rating:1.5};
    var fakeSnippetRating3 = {snippetId: "MochaTestRepo2", rater:"whoever", rating:1.5};
    var fakeSnippetRank = {rankingSnippetId: "MochaTestRepo", snippetRatingRank:10};
    var fakeSnippetRank2 = {rankingSnippetId: "MochaTestRepo2", snippetRatingRank:25};

    beforeEach(function(done) {
        done()
    }, 5000);

    afterEach(function(done) {
        //cleanup fake user
        db.removeUser(fakeUser, function (err, data) {
            db.removeUser(fakeUser2, function (err, data) {
                db.removeSnippet(fakeSnippet._id, function (err, result) {
                    db.removeSnippet(fakeSnippet2._id, function (err, result) {
                        db.removeSnippetRank(fakeSnippetRank.rankingSnippetId, function (err, result) {
                            db.removeSnippetRank(fakeSnippetRank2.rankingSnippetId, function (err, result) {
                                done();
                            });
                        });
                    });
                });
            });
        });
    }, 5000);

    it('should be able to add a user to the database', function (done) {
        db.addUpdateUser(fakeUser, function(err, users){
            expect(err).to.be.eql(null);
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
        db.addUpdateUser(fakeUser, function(err, user){
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

    it('should be able to update a user from the database', function (done) {
        //create the user so we can remove it.
        db.addUpdateUser(fakeUser, function(err, user){
            var obj = {
                id:123,
                firstName: "fakeFirst",
                lastName: "fakeLast",
                email: "fakeUpdated@email.com",
                userRatingRank:201
            };
            var userEmail = {email: fakeUser.email};
            db.findUsers(userEmail, function (err, users) {
                expect(users[0]).to.exist;
                expect(users[0].userRatingRank).to.be.eql(fakeUser.userRatingRank);
                expect(users[0].email).to.be.eql(fakeUser.email);
                db.addUpdateUser(obj, function (err, data) {
                    if (err) console.log(err);
                    var userEmail = {email: obj.email};
                    db.findUsers(userEmail, function (err, users) {
                        expect(users[0]).to.exist;
                        expect(users[0].userRatingRank).to.be.eql(obj.userRatingRank);
                        expect(users[0].email).to.be.eql(obj.email);
                        done();
                    });
                });
            });
        });
    });

    it('should be able to find users in the the database', function (done) {
        db.addUpdateUser(fakeUser, function(err, user) {
            db.findUsers({firstName: fakeUser.firstName}, function(err, results){
                expect(results[0].lastName).to.be.eql(fakeUser.lastName);
                done();
            })
        });
    });

    it('should find a specific user in the database', function (done) {
        db.addUpdateUser(fakeUser, function(err, user) {
            //var userId = user.ops[0]._id.id;
            db.findUser(fakeUser.id, function(err, result){
                expect(result.lastName).to.be.eql(fakeUser.lastName);
                done();
            })
        });
    });

    it('should get all users rankings', function (done) {
        db.addUpdateUser(fakeUser, function(err, user) {
            db.addUpdateUser(fakeUser2, function (err, user) {
                db.getUserRankings(function (err, results) {
                    expect(results).to.be.an("array");
                    expect(results).to.contain(fakeUser);
                    done();
                })
            });
        });
    });

    it('should be able to add a snippet in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
            db.getSnippet(fakeSnippet._id, function(err, result) {
                expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                expect(result.description).to.be.eql(fakeSnippet.description);
                done();
            })
        });
    });

    it('should be able to update a snippet in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
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
        db.addUpdateSnippet(fakeSnippet, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
            db.getSnippet(fakeSnippet._id, function (err, result) {
                expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                done();
            })
        });
    });

    it('should be able to get snippets by newest date from the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, result){
            db.addUpdateSnippet(fakeSnippet2, function(err, result) {
                db.getSnippetsByLatestDate(function (err, results) {
                    expect(results).to.exist;
                    expect(results[0].snippetId).to.be.eql(fakeSnippet2._id);
                    expect(results[1].snippetId).to.be.eql(fakeSnippet._id);
                    done();
                });
            });
        });
    });

    it('should be able to remove a snippet in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
            fakeSnippet.displayName = "blah";
            fakeSnippet.deleted = "true";
            db.addUpdateSnippet(fakeSnippet, function(err, result) {
                db.getSnippet(fakeSnippet._id, function (err, result) {
                    expect(result.deleted).to.be.eql("true");
                    db.removeSnippet(fakeSnippet._id, function(err, result) {
                        db.getSnippet(fakeSnippet._id, function (err, result) {
                            expect(result).to.be.eql(null);
                            done();
                        });
                    })
                })
            })
        });
    });

    it('should be able to mark a snippet for deletion in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
            fakeSnippet.displayName = "blah";
            fakeSnippet.deleted = "true";
            db.addUpdateSnippet(fakeSnippet, function(err, result) {
                db.getSnippet(fakeSnippet._id, function (err, result) {
                    expect(result.deleted).to.be.eql("true");
                    done();
                })
            })
        });
    });

    it('should be able to cleanup (delete) marked snippets in the database', function (done) {
        db.addUpdateSnippet(fakeSnippet, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
            fakeSnippet.displayName = "blah";
            fakeSnippet.deleted = "true";
            db.addUpdateSnippet(fakeSnippet, function(err, result) {
                db.getSnippet(fakeSnippet._id, function (err, result) {
                    expect(result.deleted).to.be.eql("true");
                    db.cleanupSnippets(function(err, result) {
                        db.getSnippet(fakeSnippet._id, function (err, result) {
                            expect(result).to.be.eql(null);
                            done();
                        });
                    })
                })
            })
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
                db.removeSnippetRating(fakeSnippetRating, function (err, msg) {
                    expect(msg.result.ok).to.be.eql(1);
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

    it('should be able to get all snippets average ratings from the database', function (done) {
        db.addUpdateSnippetRating(fakeSnippetRating, function (err, result) {
            db.addUpdateSnippetRating(fakeSnippetRating2, function (err, result) {
                db.addUpdateSnippetRating(fakeSnippetRating3, function (err, result) {
                    var ids = [fakeSnippetRating.snippetId, fakeSnippetRating3.snippetId];
                    db.getSnippetsRatingsAvg(ids, function (err, results) {
                        expect(results).to.contain({snippetId:fakeSnippetRating3.snippetId,rating: 1.5});
                        expect(results).to.contain({snippetId:fakeSnippetRating.snippetId,rating: 3.25});
                        done();
                    })
                });
            });
        });
    });

    it('should be able to add a snippet rank to the database and then get it', function (done) {
        db.addUpdateSnippetRank(fakeSnippetRank, function(err, msg){
            expect(msg.result.ok).to.be.eql(1);
            db.getSnippetRank(fakeSnippetRank.rankingSnippetId, function(err, result) {
                expect(result.rankingSnippetId).to.be.eql(fakeSnippetRank.rankingSnippetId);
                expect(result.snippetRatingRank).to.be.eql(fakeSnippetRank.snippetRatingRank);
                done();
            })
        });
    });

    it('should get all snippet rankings', function (done) {
        db.addUpdateSnippetRank(fakeSnippetRank, function(err, msg){
            db.addUpdateSnippetRank(fakeSnippetRank2, function(err, msg){
                db.getSnippetRankings(function (err, results) {
                    expect(results).to.be.an("array");
                    expect(results).to.contain(fakeSnippetRank);
                    expect(results).to.contain(fakeSnippetRank2);
                    done();
                })
            });
        });
    });

    it('should remove a snippet ranking', function (done) {
        db.addUpdateSnippetRank(fakeSnippetRank, function(err, msg){
            db.removeSnippetRank(fakeSnippetRank.rankingSnippetId, function(err, msg){
                db.getSnippetRankings(function (err, results) {
                    expect(results).to.be.an("array");
                    expect(results).to.not.contain(fakeSnippetRank);
                    done();
                })
            });
        });
    });
});