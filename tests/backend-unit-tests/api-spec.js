'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: '(REST api-spec') ****");


var azureStorage = require('../../db/azure-storage-dao');
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

var apiToken = "";
if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'testing') {
    apiToken = process.env.GithubApiToken;
} else {
    var authConfLocal = require('../../auth/auth-conf-local.js');
    apiToken = authConfLocal.github_api.token;
}

chai.use(chaiHttp);
passportStub.install(app);

describe("REST API Tests", function() {
    var fakeSnippetId = uuid.v4();
    var fakeSnippetDesc = "Mocha Description";
    var fakeSnippetDisplayName = "Mocha Display Name";
    var fakeSnippetReadme = "Mocha Readme";
    var fakeSnippetOwner = "fakeOwner";
    var fakeSnippet = {_id: fakeSnippetId, description: fakeSnippetDesc, displayName: fakeSnippetDisplayName, readme: fakeSnippetReadme, owner: fakeSnippetOwner};
    var fakeFileName = "MochaTestFile";
    var fakeSnippetRating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:5};
    var fakeSnippetRating2 = {snippetId: "MochaTestRepo", rater:"testOwner2", rating:1.5};
    var fakeSnippetRating3 = {snippetId: "MochaTestRepo2", rater:"whoever", rating:1.5};

    /**********************************

     I M P O R T A N T:
     The github api was unpredictable for these tests and would fail intermittently.  We don't
     know if this was because of caching or a slow backend that would not recognize newly
     created repos or files.

     To get around the issue, we record the github data on a test, then mock the github http
     calls for testing.

     1) Run a single test with the following at the beginning of the test:
     nock.recorder.rec({});
     2) Create a function (e.g. mockDataxxxxx()) and copy the code generated in the log
     into the function (removing all non-code)
     3) Replace all instances of "access_token":xxxxx with "access_token":apiToken
     4) Comment out the call above to record the data, and call the newly created function.

     **********************************/

    passportStub.login({username: fakeSnippetOwner});   //login a fake user via passport since the api is protected.

    beforeEach(function(done) {
        // cleanup fake repo

        azureStorage.deleteContainer(fakeSnippetId, function (err, result) {
            db.removeSnippet(fakeSnippetId, function (err, result) {
                db.removeSnippetRating(fakeSnippetRating, function (err, result) {
                    db.removeSnippetRating(fakeSnippetRating2, function (err, result) {
                        db.removeSnippetRating(fakeSnippetRating3, function (err, result) {
                            done();
                        });
                    });
                });
            });
        });
    }, 5000);

    afterEach(function(done) {
        azureStorage.deleteContainer(fakeSnippetId, function (err, result) {
            db.removeSnippet(fakeSnippetId, function (err, result) {
                db.removeSnippet(fakeSnippetId + "2", function (err, result) {
                    db.removeSnippetRating(fakeSnippetRating, function (err, result) {
                        db.removeSnippetRating(fakeSnippetRating2, function (err, result) {
                            db.removeSnippetRating(fakeSnippetRating3, function (err, result) {
                                //Create a new snippetID because a delete takes a second and when automating tests it's too fast before we create again
                                fakeSnippetId = uuid.v4();
                                fakeSnippet._id = fakeSnippetId;
                                done();
                            });
                        });
                    });
                });
            });
        });
    }, 5000);


    it('should get a list of all snippets on /snippets GET', function(done) {
        var fakeSnippet2 = {_id: fakeSnippetId + "2", description: fakeSnippetDesc + "2", displayName: fakeSnippetDisplayName + "2", readme: fakeSnippetReadme + "2", owner: fakeSnippetOwner};
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
                chai.request(app)
                    .post('/api/snippet')
                    .send(fakeSnippet2)
                    .end(function (err, res) {
                        chai.request(app)
                            .get('/api/snippets')
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

    it('should get a list of snippets by owner on /snippets/:owner GET', function(done) {
        var fakeSnippet2 = {_id: fakeSnippetId + "2", description: fakeSnippetDesc + "2", displayName: fakeSnippetDisplayName + "2", readme: fakeSnippetReadme + "2", owner: fakeSnippetOwner};
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
                chai.request(app)
                    .post('/api/snippet')
                        .send(fakeSnippet2)
                        .end(function (err, res) {
                            chai.request(app)
                                .get('/api/snippets/' + fakeSnippetOwner)
                                .end(function (err, res) {
                                    expect(res.status).to.eql(200);
                                    res.body.should.be.a('array'); //shouldn't be an empty object if we are getting back snippets.
                                    res.body[0].should.have.property("displayName");
                                    res.body[0].displayName.should.equal(fakeSnippet2.displayName);
                                    res.body[0].should.have.property("owner");
                                    res.body[0].owner.should.equal(fakeSnippetOwner);
                                    res.body[1].should.have.property("displayName");
                                    res.body[1].displayName.should.equal(fakeSnippet.displayName);
                                    res.body[1].should.have.property("owner");
                                    res.body[1].owner.should.equal(fakeSnippetOwner);
                                    done();
                                });
                        });

            });
    });

    it('should create a snippet on /snippet POST', function(done) {
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
                res.should.have.status(200);
                db.getSnippet(fakeSnippetId, function (err, result) {
                    expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                    done();
                });
            });
    });

    it('should get a snippet on /snippet/:snippetId GET', function(done) {
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
                res.should.have.status(200);
                db.getSnippet(fakeSnippetId, function (err, result) {
                    expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                });
                chai.request(app)
                    .get('/api/snippet/' + fakeSnippetId)
                    .end(function(err, res){
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

    it('should update snippet data on /snippet PUT', function(done) {
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
                res.should.have.status(200);
                //update the snippet with a new desc
                fakeSnippet.description = "blah";
                chai.request(app)
                    .put('/api/snippet/' + fakeSnippetId)
                    .send(fakeSnippet)
                    .end(function(err, res){
                        res.should.have.status(200);
                        chai.request(app)
                            .get('/api/snippet/' + fakeSnippetId)
                            .end(function(err, res){
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

    it('should delete a snippet on /snippet DELETE', function(done) {
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
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

    it('should get data required for the snippet overview on /snippet-overview/:snippetId GET even if no files have been uploaded', function(done) {
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
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
                        res.body.readme.should.equal('# Mocha Display Name\nMocha Readme');
                        should.not.exist(res.body.files);
                        done();
                    })
            });
    });


    it('should get data required for the snippet overview on /snippet-overview/:snippetId GET', function(done) {
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
                chai.request(app)
                //create the initial snippet
                    .post('/api/snippet')
                    .send(fakeSnippet)
                    .end(function(err, res) {
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
                                        res.body.readme.should.equal('# Mocha Display Name\nMocha Readme');
                                        res.body.files.should.be.a('array'); //TODO: right now the files are returned as blobs.  Do we need to return as something else?
                                        done();
                                    })
                            });
                    });
            });
    });

    it('should create a rating on /rating/:snippetId POST', function(done) {
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function(err, res) {
                chai.request(app)
                    .get('/api/rating/' + fakeSnippetRating.snippetId)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.equal(5);
                        done();
                    })
            });
    });

    it('should update a rating on /rating/:snippetId PUT', function(done) {
        var modifiedRating = {snippetId: "MochaTestRepo", rater:"testOwner", rating:4};
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(modifiedRating)
            .end(function(err, res) {
                chai.request(app)
                    .get('/api/rating/' + fakeSnippetRating.snippetId)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.equal(4);
                        done();
                    })
            });
    });

    it('should get an average rating for the snippet on /rating/:snippetId GET', function(done) {
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function(err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating2.snippetId)
                    .send(fakeSnippetRating2)
                    .end(function(err, res) {
                        chai.request(app)
                            .get('/api/rating/' + fakeSnippetRating.snippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                res.body.should.equal(3.25);
                                done();
                            });
                    });
            });
    });

    it('should get a users rating for a snippet on /rating/:snippetId/:user GET', function(done) {
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function(err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating2.snippetId)
                    .send(fakeSnippetRating2)
                    .end(function(err, res) {
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

    it('should get a list of snippets average ratings /ratings/:listOfIds GET', function(done) {
        var ids = encodeURIComponent(fakeSnippetRating.snippetId + "," + fakeSnippetRating3.snippetId);
        chai.request(app)
            .post('/api/rating/' + fakeSnippetRating.snippetId)
            .send(fakeSnippetRating)
            .end(function(err, res) {
                chai.request(app)
                    .post('/api/rating/' + fakeSnippetRating2.snippetId)
                    .send(fakeSnippetRating2)
                    .end(function(err, res) {
                        chai.request(app)
                            .post('/api/rating/' + fakeSnippetRating3.snippetId)
                            .send(fakeSnippetRating3)
                            .end(function(err, res) {
                                chai.request(app)
                                    .get('/api/ratings/' + ids)
                                    .end(function (err, res) {
                                        res.should.have.status(200);
                                        res.body[0].should.have.property("snippetId");
                                        res.body[0].should.not.have.property("rater");
                                        res.body[0].snippetId.should.equal(fakeSnippetRating.snippetId);
                                        res.body[0].should.have.property("rating");
                                        res.body[0].rating.should.equal(3.25);
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

    it('should get a 0 rating if one does not exist for the snippet on /rating/:snippetId GET', function(done) {
        chai.request(app)
            .get('/api/rating/fakesnippet')
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.equal(0); //Since we don't have a rating set yet it will be 0.
                done();
            })
    });

    it('should add a file on /snippet-detail/:snippetId/:fileName POST', function(done) {
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
                chai.request(app)
                    //create new file
                    .post('/api/snippet-detail/' + fakeSnippetId + '/' + fakeFileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        //TODO Get the file to make sure it was there
                        // chai.request(app)
                            //get overview to assure file was created
                            // .get('/api/snippet-overview/' + fakeSnippetId)
                            // .end(function (err, res) {
                            //     res.should.have.status(200);
                            //     res.body.files.should.be.a('array');
                            //     res.body.files[1].should.equal(fakeFileName);
                                done();
                            // })
                    });
            });
    });

    it('should upload and add a file on /snippet-detail/:snippetId POST', function(done) {
        var fileName = 'readme';
        var filePath = 'tests/backend-unit-tests/';
        // var boundary = Math.random();
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
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

    it('should update contents of a file on /snippet-detail/:snippetId/:fileName PUT', function(done) {
        var fakeFileContents = "Sample data to write to file";
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
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
                                res.body.files[0].should.equal(fakeFileName);
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

    it('should get contents of a file on /snippet-detail/:snippetId/:fileName GET', function(done) {
        var fileName = 'readme';
        var filePath = 'tests/backend-unit-tests/';
        chai.request(app)
        //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
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

    it('should delete a file on /snippet-detail/:snippetId/:fileName DELETE', function(done) {
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
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
                                res.body.files[1].should.equal(fakeFileName);
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
                                                res.body.files.should.have.length(1);
                                                done();
                                            });

                                    });
                            });
                    });
            });
    });

    xit('should return html given marked-down readme data on /snippet-detail/:snippetId/readme/format PUT', function(done) {
        var fakeReadmeData = "# Title\n## Subtitle";
        chai.request(app)
            .put('/api/snippet-detail/' + fakeSnippetId + '/readme/format')
            .send({content: fakeReadmeData})
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.match(/\<h1.*/);
                done();
            });
    });

    xit('should search all snippets and return result on /snippet-search with searchTerms = req.query.q GET', function(done) {
        //nock.recorder.rec({});
        // mockDataSearch();
        chai.request(app)
            // use a search term for existing snippets since creating a new snippet
            // is not immediately searchable
            .get('/api/snippet-search?q=idm')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('items');
                res.body.items.should.a('array');
                res.body.items[0].name.should.equal("README.md");
                done();
            });
    });

    it('should return the authenticated user /authenticated-user GET', function(done) {
        //nock.recorder.rec({});
        // mockDataGetAuthenticatedUser();
        chai.request(app)
            //create the initial snippet
            .get('/api/authenticated-user')
            .end(function(err, res) {
                res.should.have.status(200);
                //TODO figure out how to authenticate so we can get the actual user.
                done();
            });
    });

});