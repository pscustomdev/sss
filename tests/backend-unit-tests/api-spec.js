'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: '(REST api-spec') ****");


var azureStorage = require('../../db/azure-storage-dao');
var authConf = require('../../auth/auth-conf.js');

var db = require('../../db/mongo-dao');
var fs = require('fs');
var app = require('../../app');
var uuid = require('node-uuid');
var chai = require("chai");
var chaiHttp = require('chai-http');
var expect = require("chai").expect;
var should = require("chai").should();
var passportStub = require("passport-stub");
var nock = require("nock");

chai.use(chaiHttp);
passportStub.install(app);

describe("REST API Tests", function () {
    // var fakeSnippetId = uuid.v4();
    var fakeSnippetId = "MochaSnippet";
    var fakeSnippetDesc = "Mocha Description";
    var fakeSnippetDisplayName = "Mocha Display Name";
    var fakeSnippetReadme = "Mocha Readme";
    var fakeSnippetOwner = "fakeOwner";
    var fakeSnippet = {
        _id: fakeSnippetId,
        description: fakeSnippetDesc,
        displayName: fakeSnippetDisplayName,
        readme: fakeSnippetReadme,
        owner: fakeSnippetOwner
    };
    var fakeSnippet2 = {
        _id: fakeSnippetId + "2",
        description: fakeSnippetDesc + "2",
        displayName: fakeSnippetDisplayName + "2",
        readme: fakeSnippetReadme + "2",
        owner: fakeSnippetOwner
    };
    var fakeFileName = "MochaTestFile";
    var fakeFileName2 = "MochaTestFile2";
    var fakeSnippetRating = {snippetId: fakeSnippetId, rater: "testRater", rating: 5};
    var fakeSnippetRating2 = {snippetId: fakeSnippetId, rater: "testRater2", rating: 3};
    var fakeSnippetRating3 = {snippetId: "MochaTestRepo2", rater: "whoever", rating: 1.5};

    var fakeUser = {
        id:123,
        username:fakeSnippetOwner,
        email: "fake@email.com",
        ratingRank:20
    };
    var fakeUser2 = {
        id:1232,
        username:"fakeOwner2",
        email: "fake2@email.com",
        ratingRank:30
    };
    var fakeUser3 = {
        id:1233,
        username:"fakeOwner3",
        email: "fake3@email.com" ,
        ratingRank:45
    };

    passportStub.login({username: fakeSnippetOwner});   //login a fake user via passport since the api is protected.

    if (process.env.NODE_ENV == 'production') {
        return;
    }

    function cleanup(done){
        azureStorage.deleteFolder(fakeSnippetId, function (err, result) {
            db.removeSnippet(fakeSnippetId, function (err, result) {
                db.removeSnippet(fakeSnippet2._id, function (err, result) {
                    db.removeSnippetRating(fakeSnippetRating.snippetId, function (err, result) {
                        db.removeSnippetRating(fakeSnippetRating2.snippetId, function (err, result) {
                            db.removeSnippetRating(fakeSnippetRating3.snippetId, function (err, result) {
                                db.removeUser(fakeUser, function (err, result) {
                                    db.removeUser(fakeUser2, function (err, result) {
                                        db.removeUser(fakeUser3, function (err, result) {
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    beforeEach(function (done) {
        cleanup(done);
    }, 5000);

    afterEach(function (done) {
        // cleanup fake repo
        cleanup(done);
    }, 5000);

    it('should get a list of all snippets on /snippets/:ids GET', function (done) {
        var ids = encodeURIComponent(fakeSnippetId + "," + fakeSnippet2._id);
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                    .post('/api/snippet')
                    .send(fakeSnippet2)
                    .end(function (err, res) {
                        chai.request(app)
                            .get('/api/snippets/' + ids)
                            .end(function (err, res) {
                                console.log("res: " + res);
                                expect(res.status).to.eql(200);
                                res.body.should.be.a('array');
                                //Should check for the objects in the array but we'd need to check for postedOn timestamp and other tricky things right now so we'll do it later.
                                // expect(res.body).to.contain(fakeSnippet);
                                // expect(res.body).to.contain(fakeSnippet2);
                                done();
                            });
                    });
            });
    });

    it('should get a list of snippets by owner on /snippets?owner=fakeSnippetOwner GET', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                    .post('/api/snippet')
                    .send(fakeSnippet2)
                    .end(function (err, res) {
                        chai.request(app)
                            .get('/api/snippets?owner=' + fakeSnippetOwner)
                            .end(function (err, res) {
                                expect(res.status).to.eql(200);
                                res.body.should.be.a('array'); //shouldn't be an empty object if we are getting back snippets.
                                res.body[0].should.have.property("displayName");
                                // res.body[0].displayName.should.equal(fakeSnippet2.displayName); //Order could change so we need to see how to deal with that before enabling this.
                                res.body[0].should.have.property("owner");
                                // res.body[0].owner.should.equal(fakeSnippetOwner);
                                res.body[1].should.have.property("displayName");
                                // res.body[1].displayName.should.equal(fakeSnippet.displayName);
                                res.body[1].should.have.property("owner");
                                // res.body[1].owner.should.equal(fakeSnippetOwner);
                                done();
                            });
                    });

            });
    });

    it('should create a snippet on /snippet POST', function (done) {
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                res.should.have.status(200);
                db.getSnippet(fakeSnippetId, function (err, result) {
                    expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                    done();
                });
            });
    });

    it('should get a snippet on /snippet/:snippetId GET', function (done) {
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                res.should.have.status(200);
                db.getSnippet(fakeSnippetId, function (err, result) {
                    expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                });
                chai.request(app)
                    .get('/api/snippet/' + fakeSnippetId)
                    .end(function (err, res) {
                        console.log("res: " + res);
                        expect(res.status).to.eql(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property("displayName");
                        res.body.displayName.should.equal(fakeSnippet.displayName);
                        res.body.should.have.property("owner");
                        res.body.owner.should.equal(fakeSnippetOwner);
                        res.body.should.have.property("description");
                        res.body.description.should.equal(fakeSnippetDesc);
                        res.body.should.have.property("postedOn");
                        res.body.should.have.property("readme");
                        done();
                    });
            });
    });

    it('should update snippet data on /snippet PUT', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                res.should.have.status(200);
                //update the snippet with a new desc
                fakeSnippet.description = "blah";
                chai.request(app)
                    .put('/api/snippet/' + fakeSnippetId)
                    .send(fakeSnippet)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                            .get('/api/snippet/' + fakeSnippetId)
                            .end(function (err, res) {
                                console.log("res: " + res);
                                expect(res.status).to.eql(200);
                                res.body.should.be.a('object');
                                res.body.should.have.property("description");
                                res.body.description.should.equal(fakeSnippet.description);
                                //Set the description back to the default for future tests.
                                fakeSnippet.description = fakeSnippetDesc;
                                done();
                            });
                    });
            });
    });

    it('should delete a snippet on /snippet DELETE', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                //lets make sure it exists in the db before deleting it
                db.getSnippet(fakeSnippetId, function (err, result) {
                    expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                    //now let's delete it via the REST service
                    chai.request(app)
                        .delete('/api/snippet/' + fakeSnippetId)
                        .end(function (err, res) {
                            res.should.have.status(200);
                            //Make sure it's gone from Mongo
                            db.getSnippet(fakeSnippet._id, function (err, result) {
                                expect(result).isUndefined;
                                done();
                            })
                        });
                });
            });
    });

    it('should get data required for the snippet overview on /snippet-overview/:snippetId GET even if no files have been uploaded', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                    .get('/api/snippet-overview/' + fakeSnippetId)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        // res.body.should.have.property('name'); //TODO do we need a name now?
                        // res.body.name.should.equal("MochaTestRepo");
                        res.body.should.have.property('displayName');
                        res.body.displayName.should.equal(fakeSnippet.displayName);
                        res.body.should.have.property('description');
                        res.body.description.should.equal(fakeSnippet.description);
                        //Should start with <h1
                        res.body.readme.should.contain("Mocha Readme");
                        should.not.exist(res.body.files[0]);
                        done();
                    })
            });
    });


    it('should get data required for the snippet overview on /snippet-overview/:snippetId GET', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //create the initial snippet
                    .post('/api/snippet')
                    .send(fakeSnippet)
                    .end(function (err, res) {
                        chai.request(app)
                        //create new file
                            .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                chai.request(app)
                                    .get('/api/snippet-overview/' + fakeSnippetId)
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        res.body.should.have.property('displayName');
                                        res.body.displayName.should.equal(fakeSnippet.displayName);
                                        res.body.should.have.property('description');
                                        res.body.description.should.equal(fakeSnippet.description);
                                        //Should start with <h1
                                        res.body.readme.should.contain("Mocha Readme");
                                        res.body.files.should.be.a('array');
                                        done();
                                    })
                            });
                    });
            });
    });

    it('should create a rating on /rating/:snippetId POST', function (done) {
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function (err, res) {
                chai.request(app)
                    .get('/api/rating/' + fakeSnippetRating.snippetId)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.equal(5);
                        done();
                    })
            });
    });

    it('should get all users ratingRanks on /users/rating-rank GET', function (done) {
        db.addUpdateUser(fakeUser, function (err, result) {
            db.addUpdateUser(fakeUser2, function (err, result) {
                db.addUpdateUser(fakeUser3, function (err, result) {
                    chai.request(app)
                        .get('/api/users/rating-rank')
                        .end(function (err, res) {
                            res.body.should.be.a('array');
                            //should return a sorted array
                            res.should.have.status(200);
                            res.body.should.contain(fakeUser);
                            done();
                        })
                });
            });
        });
    });

    it('should add a ratingRank to the user when a rating is updated on /rating/:snippetId POST', function (done) {
        db.addUpdateUser(fakeUser,function(err, result) {
            chai.request(app)
                .post('/api/snippet')
                .send(fakeSnippet)
                .end(function (err, res) {
                    chai.request(app)
                        .post('/api/rating/' + fakeSnippetRating.snippetId)
                        .send(fakeSnippetRating)
                        .end(function (err, res) {
                            expect(res).to.exist;
                            db.findUsers({username: fakeUser.username}, function (err, users) {
                                expect(users[0].ratingRank).equal(30);  //This is the first ranking
                                chai.request(app)
                                    .post('/api/rating/' + fakeSnippetRating2.snippetId) //add a second ranking
                                    .send(fakeSnippetRating2)
                                    .end(function (err, res) {
                                        db.findUsers({username: fakeUser.username}, function (err, users) {
                                            expect(users[0].ratingRank).equal(32);
                                            fakeSnippetRating.rating = 1;
                                            chai.request(app)
                                                .post('/api/rating/' + fakeSnippetRating.snippetId) //This change the rating
                                                .send(fakeSnippetRating)
                                                .end(function (err, res) {
                                                    db.findUsers({username: fakeUser.username}, function (err, users) {
                                                        expect(users).to.exist;
                                                        expect(users[0].ratingRank).equal(22);
                                                        fakeSnippetRating.rating = 5;
                                                        done();
                                                    });
                                                });
                                        });
                                    })
                            });
                        });
                });
        });
    });

    it('should add a ratingRank to the snippet when a rating is updated on /rating/:snippetId POST', function (done) {
        db.addUpdateUser(fakeUser,function(err, result) {
            chai.request(app)
                .post('/api/snippet')
                .send(fakeSnippet)
                .end(function (err, res) {
                    chai.request(app)
                        .post('/api/rating/' + fakeSnippetRating.snippetId)
                        .send(fakeSnippetRating)
                        .end(function (err, res) {
                            chai.request(app)
                                .post('/api/rating/' + fakeSnippetRating2.snippetId) //add a second rating
                                .send(fakeSnippetRating2)
                                .end(function (err, res) {
                                    db.getSnippetRankings(function (err, result) {
                                        var obj = {
                                            rankingSnippetId:fakeSnippetId,
                                            ratingRank :1
                                        };
                                        result.should.contain(obj); //TODO This should be an array of snippets sorted by Rank.
                                        done();
                                    });
                                })
                        });
                });
        });
    });

    it('should update a rating on /rating/:snippetId PUT', function (done) {
        var modifiedRating = {snippetId: fakeSnippetId, rater: "testOwner", rating: 4};
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating.snippetId)
                    .send(modifiedRating)
                    .end(function (err, res) {
                        chai.request(app)
                            .get('/api/rating/' + fakeSnippetRating.snippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.should.equal(4);
                                done();
                            })
                    });
            });
    });

    it('should get an average rating for the snippet on /rating/:snippetId GET', function (done) {
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function (err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating2.snippetId)
                    .send(fakeSnippetRating2)
                    .end(function (err, res) {
                        chai.request(app)
                            .get('/api/rating/' + fakeSnippetRating.snippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.should.equal(4);
                                done();
                            });
                    });
            });
    });

    it('should get a users rating for a snippet on /rating/:snippetId/:user GET', function (done) {
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function (err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating2.snippetId)
                    .send(fakeSnippetRating2)
                    .end(function (err, res) {
                        chai.request(app)
                            .get('/api/rating/' + fakeSnippetRating.snippetId + '/' + fakeSnippetRating.rater)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.should.have.property("snippetId");
                                res.body.snippetId.should.equal(fakeSnippetRating.snippetId);
                                res.body.should.have.property("rating");
                                res.body.rating.should.equal(fakeSnippetRating.rating);
                                done();
                            });
                    });
            });
    });

    it('should get a list of snippets average ratings /ratings/:listOfIds GET', function (done) {
        var ids = encodeURIComponent(fakeSnippetRating.snippetId + "," + fakeSnippetRating3.snippetId);
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function (err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating2.snippetId)
                    .send(fakeSnippetRating2)
                    .end(function (err, res) {
                        chai.request(app)
                            .post('/api/rating/' + fakeSnippetRating3.snippetId)
                            .send(fakeSnippetRating3)
                            .end(function (err, res) {
                                chai.request(app)
                                    .get('/api/ratings/' + ids)
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        res.body[0].should.have.property("snippetId");
                                        res.body[0].should.not.have.property("rater");
                                        res.body[0].snippetId.should.equal(fakeSnippetRating.snippetId);
                                        res.body[0].should.have.property("rating");
                                        res.body[0].rating.should.equal(4);
                                        res.body[0].should.have.property("snippetId");
                                        res.body[1].snippetId.should.equal(fakeSnippetRating3.snippetId);
                                        res.body[1].should.have.property("rating");
                                        res.body[1].rating.should.equal(1.5);
                                        done();
                                    });
                            });
                    });
            });
    });

    it('should get a 0 rating if one does not exist for the snippet on /rating/:snippetId GET', function (done) {
        chai.request(app)
            .get('/api/rating/fakesnippet')
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.equal(0); //Since we don't have a rating set yet it will be 0.
                done();
            })
    });

    it('should add a file on /snippet-detail/:snippetId/:fileName POST', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //create new file
                    .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        //Get the file to make sure it was there
                        chai.request(app)
                        // get overview to assure file was created
                            .get('/api/snippet-overview/' + fakeSnippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.files.should.be.a('array');
                                res.body.files[0].name.should.equal(fakeFileName);
                                done();
                            })
                    });
            });
    });

    it('should upload and add a file on /snippet-detail/:snippetId POST', function (done) {
        var fileName = 'readme';
        var filePath = 'tests/backend-unit-tests/';
        // var boundary = Math.random();
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //upload a new file
                    .post('/api/snippet-detail/' + fakeSnippetId)
                    .attach('file', filePath + fileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                        //verify file contents
                            .get('/api/snippet-detail/' + fakeSnippetId + "/" + fileName)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                // file should start with a # sign
                                res.body.should.match(/#.*/);
                                done();
                            });
                    });
            });
    });

    it('should update contents of a file on /snippet-detail/:snippetId/:fileName PUT', function (done) {
        var fakeFileContents = "Sample data to write to file";
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //create new file
                    .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                        //get overview to assure file was created
                            .get('/api/snippet-overview/' + fakeSnippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.files.should.be.a('array');
                                res.body.files[0].name.should.equal(fakeFileName);
                                chai.request(app)
                                //update file contents
                                    .put('/api/snippet-detail/' + fakeSnippetId + "/" + fakeFileName)
                                    .send({content: fakeFileContents})
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        chai.request(app)
                                        //verify file contents
                                            .get('/api/snippet-detail/' + fakeSnippetId + "/" + fakeFileName)
                                            .end(function (err, res) {
                                                res.should.have.status(200);
                                                res.body.should.equal(fakeFileContents);
                                                done();
                                            });
                                    });
                            });
                    });
            });
    });

    it('should get contents of a file on /snippet-detail/:snippetId/:fileName GET', function (done) {
        var fileName = 'readme';
        var filePath = 'tests/backend-unit-tests/';
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //upload a new file
                    .post('/api/snippet-detail/' + fakeSnippetId)
                    // .attach('file', fs.readFileSync('tests/backend-unit-tests/readme'), uploadedFileName)
                    .attach('file', filePath + fileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                        //verify file contents
                            .get('/api/snippet-detail/' + fakeSnippetId + "/" + fileName)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                // file should start with a # sign
                                res.body.should.match(/#.*/);
                                done();
                            });
                    });
            });
    });

    it('should delete a file on /snippet-detail/:snippetId/:fileName DELETE', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //create new file
                    .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                        //get overview to assure file was created
                            .get('/api/snippet-overview/' + fakeSnippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.files.should.be.a('array');
                                res.body.files[0].name.should.equal(fakeFileName);
                                chai.request(app)
                                //delete the file
                                    .delete('/api/snippet-detail/' + fakeSnippetId + "/" + fakeFileName)
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        chai.request(app)
                                        //get overview to assure file is gone
                                            .get('/api/snippet-overview/' + fakeSnippetId)
                                            .end(function (err, res) {
                                                res.should.have.status(200);
                                                res.body.files.should.be.a('array');
                                                res.body.files.should.have.length(0);
                                                done();
                                            });

                                    });
                            });
                    });
            });
    });

    it('should cleanup (delete) a snippet marked for deletion (and delete the file folder and the ratings) DELETE', function (done) {
        var fakeRating = {snippetId: fakeSnippetId, rater: "testOwner", rating: 5};
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                // add a rating
                    .post('/api/rating/' + fakeRating.snippetId)
                    .send(fakeRating)
                    .end(function (err, res) {
                        chai.request(app)
                        //create new file
                            .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                chai.request(app)
                                //get overview to assure file was created
                                    .get('/api/snippet-overview/' + fakeSnippetId)
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        res.body.files.should.be.a('array');
                                        res.body.files[0].name.should.equal(fakeFileName);
                                        //update the snippet to mark it for deletion
                                        var fakeData = JSON.parse(JSON.stringify(fakeSnippet));
                                        fakeData.deleted = "true";
                                        chai.request(app)
                                            .put('/api/snippet/' + fakeSnippetId)
                                            .send(fakeData)
                                            .end(function (err, res) {
                                                res.should.have.status(200);
                                                chai.request(app)
                                                // cleanup (delete) the snippet marked for deletion
                                                    .delete('/api/cleanup-marked-snippets-files')
                                                    .end(function (err, res) {
                                                        res.should.have.status(200);
                                                        chai.request(app)
                                                        //get overview to assure snippet is gone
                                                            .get('/api/snippet-overview/' + fakeSnippetId)
                                                            .end(function (err, res) {
                                                                res.should.have.status(204);
                                                                // verify the files folder is empty
                                                                azureStorage.getListOfFilesInFolder(fakeSnippetId, function (err, result) {
                                                                    result.entries.should.have.length(0);
                                                                    db.getSnippetRatings(fakeSnippetId, function (err, result) {
                                                                        result.should.have.length(0);
                                                                        done();
                                                                    });
                                                                });
                                                            });
                                                    });
                                            });
                                    });
                            });
                    });
            });
    });

    it('should cleanup (delete) a file in a snippet marked for deletion DELETE', function (done) {
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function (err, res) {
                chai.request(app)
                //create new file
                    .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                        //get overview to assure file was created
                            .get('/api/snippet-overview/' + fakeSnippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.files.should.be.a('array');
                                res.body.files[0].name.should.equal(fakeFileName);
                                chai.request(app)
                                //update file contents to mark the file for deletion
                                    .put('/api/snippet-detail/' + fakeSnippetId + "/" + fakeFileName)
                                    .send({content: "deleted=true"})
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        chai.request(app)
                                            .delete('/api/cleanup-marked-snippets-files')
                                            .end(function (err, res) {
                                                res.should.have.status(200);
                                                chai.request(app)
                                                //get overview to assure file is gone
                                                    .get('/api/snippet-overview/' + fakeSnippetId)
                                                    .end(function (err, res) {
                                                        res.should.have.status(200);
                                                        res.body.files.should.be.a('array');
                                                        res.body.files.should.have.length(0);
                                                        done();
                                                    });
                                            });
                                    });
                            });
                    });
            });
    });

    xit('should search all snippets and return result on /snippet-search with searchTerms = req.query.q GET', function (done) {
        chai.request(app)
        // use a search term for existing snippets since creating a new snippet
        // is not immediately searchable
            .get('/api/snippet-search?q=taco')
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.items.should.be.a('array');
                done();
            });
    });

    it('should return the authenticated user /authenticated-user GET', function (done) {
        chai.request(app)
        //create the initial snippet
            .get('/api/authenticated-user')
            .end(function (err, res) {
                res.should.have.status(200);
                //TODO figure out how to authenticate so we can get the actual user.
                done();
            });
    });

    it('should start the db indexer /indexer/db GET', function (done) {
        chai.request(app)
            .get('/api/indexer/db')
            .end(function (err, res) {
                res.should.have.status(200);
                done();
            });
    });

    it('should start the file indexer /indexer/file GET', function (done) {
        chai.request(app)
            .get('/api/indexer/file')
            .end(function (err, res) {
                res.should.have.status(200);
                done();
            });
    });

});