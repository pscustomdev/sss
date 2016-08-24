'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: '(REST api-spec') ****");


var gh = require('../../db/github-dao');
var db = require('../../db/mongo-dao');
var fs = require('fs');
var chaiHttp = require('chai-http');
var app = require('../../app');
var chai = require("chai");
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
    var fakeSnippetId = "MochaTestRepo";
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
        //cleanup fake repo
        gh.deleteRepo(fakeSnippetId, function (err, result) {
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
        gh.deleteRepo(fakeSnippetId, function (err, result) {
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


    it('should get a list of all snippets on /snippets GET', function(done) {
        //nock.recorder.rec({});
        mockDataListAllSnippets();
        chai.request(app)
            .get('/api/snippets')
            .end(function(err, res){
                console.log("res: " + res);
                expect(res.status).to.eql(200);
                res.body.should.be.a('array'); //shouldn't be an empty object if we are getting back snippets.
                done();
            });
    });

    it('should get a list of snippets by owner on /snippets/:owner GET', function(done) {
        //nock.recorder.rec({});
        mockDataListOwnerSnippets();
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
                                    console.log("res: " + res);
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
        //nock.recorder.rec({});
        mockDataCreateSnippet();
        chai.request(app)
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('content');
                res.body.content.should.be.a('object');
                res.body.content.should.have.property('name');
                res.body.content.should.have.property('url');
                res.body.content.name.should.equal('README.md');
                done();
            });
    });

    it('should update snippet data on /snippet PUT', function(done) {
        //nock.recorder.rec({});
        mockDataUpdateSnippet();
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('content');
                res.body.content.should.be.a('object');
                res.body.content.should.have.property('name');
                res.body.content.should.have.property('url');
                res.body.content.name.should.equal('README.md');
                //update the snippet with a new desc
                fakeSnippet.description = "blah";
                chai.request(app)
                    .put('/api/snippet/' + fakeSnippetId)
                    .send(fakeSnippet)
                    .end(function(err, res){
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('description');
                        res.body.description.should.equal("blah");
                        //Set the description back to the default for future tests.
                        fakeSnippet.description = fakeSnippetDesc;
                        done();
                    });
            });
    });

    it('should delete a snippet on /snippet DELETE', function(done) {
        //nock.recorder.rec({});
        mockDataDeleteSnippet();
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res){
                //let's make sure it's in gh before deleting it
                gh.getRepo(fakeSnippetId, function (err, repo) {
                    expect(repo.name).to.eql(fakeSnippetId);
                    //lets make sure it exists in the db before deleting it
                    db.getSnippet(fakeSnippetId, function (err, result) {
                        expect(result.displayName).to.be.eql(fakeSnippet.displayName);
                        //now let's delete it via the REST service
                        chai.request(app)
                            .delete('/api/snippet/' + fakeSnippetId)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                //Make sure it's gone from the GH
                                gh.getRepo(fakeSnippetId, function (err, repo) {
                                    expect(repo).isUndefined;
                                    //Make sure it's gone from Mongo
                                    db.getSnippet(fakeSnippet._id, function (err, result) {
                                        expect(result).isUndefined;
                                        done();
                                    })
                                });
                            });
                    });
                });
            });
    });

    it('should get data required for the snippet overview on /snippet-overview/:snippetId GET', function(done) {
        //nock.recorder.rec({});
        mockDataSnippetOverview();
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
                        res.body.should.have.property('name');
                        res.body.name.should.equal("MochaTestRepo");
                        res.body.should.have.property('description');
                        res.body.description.should.equal(fakeSnippet.description);
                        res.body.files.should.be.a('array');
                        res.body.files[0].should.equal('README.md');
                        done();
                    })
            });
    });

    it('should create a rating on /rating/:snippetId POST', function(done) {
        //nock.recorder.rec({});
        mockDataCreateRating();
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
        //nock.recorder.rec({});
        mockDataUpdateRating();
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
        //nock.recorder.rec({});
        mockDataAverageRating();
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
        //nock.recorder.rec({});
        mockDataUserRating();
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
        //nock.recorder.rec({});
        mockDataAllAverageRatings();
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
        //nock.recorder.rec({});
        mockDataDefaultRating();
        chai.request(app)
            .get('/api/rating/fakesnippet')
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.equal(0); //Since we don't have a rating set yet it will be 0.
                done();
            })
    });

    it('should add a repo file on /snippet-detail/:snippetId/:fileName POST', function(done) {
        //nock.recorder.rec({});
        mockDataAddFile();
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
                                done();
                            })
                    });
            });
    });

    // not able to test a file upload as the "attach" doesn't seem to send
    // the file so it is recognized by the code in api.js.
    xit('should upload and add a repo file on /snippet-detail/:snippetId POST', function(done) {
        nock.recorder.rec({});
        mockDataUploadFile();
        var uploadedFileName = "readme";
        var boundary = Math.random();
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
                chai.request(app)
                    //upload a new file
                    .post('/api/snippet-detail/' + fakeSnippetId)
                    .attach('file', fs.readFileSync('tests/backend-unit-tests/readme'), uploadedFileName)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(app)
                            //verify file contents
                            .get('/api/snippet-detail/' + fakeSnippetId + "/" + uploadedFileName)
                            .end(function (err, res) {
                                res.should.have.status(200);
                                // file should start with a # sign
                                res.body.should.match(/#.*/);
                                done();
                            });
                    });
            });
    });

    it('should update contents of a repo file on /snippet-detail/:snippetId/:fileName PUT', function(done) {
        //nock.recorder.rec({});
        mockDataUpdateFile();
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
                                res.body.files[1].should.equal(fakeFileName);
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

    it('should get contents of a repo file on /snippet-detail/:snippetId/:fileName GET', function(done) {
        //nock.recorder.rec({});
        mockDataGetFile();
        chai.request(app)
            //create the initial snippet
            .post('/api/snippet')
            .send(fakeSnippet)
            .end(function(err, res) {
                chai.request(app)
                    //verify file contents
                    .get('/api/snippet-detail/' + fakeSnippetId + "/README.md")
                    .end(function (err, res) {
                        res.should.have.status(200);
                        // README.md file should start with a # sign
                        res.body.should.match(/#.*/);
                        done();
                    });
            });
    });

    it('should delete a repo file on /snippet-detail/:snippetId/:fileName DELETE', function(done) {
        //nock.recorder.rec({});
        mockDataDeleteFile();
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

    it('should return html given marked-down readme data on /snippet-detail/:snippetId/readme/format PUT', function(done) {
        //nock.recorder.rec({});
        mockDataMarkedHtml();
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

    it('should search all snippets and return result on /snippet-search with searchTerms = req.query.q GET', function(done) {
        //nock.recorder.rec({});
        mockDataSearch();
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
        mockDataGetAuthenticatedUser();
        chai.request(app)
            //create the initial snippet
            .get('/api/authenticated-user')
            .end(function(err, res) {
                res.should.have.status(200);
                //TODO figure out how to authenticate so we can get the actual user.
                done();
            });
    });

    function mockDataListAllSnippets() {
        nock('https://api.github.com:443', {"encodedQueryParams": true})
            .get('/user/repos')
            .query({"access_token":apiToken})
            .reply(200, [{
                "id": 35961801,
                "name": "sss",
                "full_name": "pscustomdev/sss",
                "owner": {
                    "login": "pscustomdev",
                    "id": 12532625,
                    "avatar_url": "https://avatars.githubusercontent.com/u/12532625?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev",
                    "html_url": "https://github.com/pscustomdev",
                    "followers_url": "https://api.github.com/users/pscustomdev/followers",
                    "following_url": "https://api.github.com/users/pscustomdev/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev/repos",
                    "events_url": "https://api.github.com/users/pscustomdev/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev/sss",
                "description": "",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev/sss",
                "forks_url": "https://api.github.com/repos/pscustomdev/sss/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev/sss/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev/sss/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev/sss/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev/sss/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev/sss/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev/sss/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev/sss/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev/sss/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev/sss/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev/sss/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev/sss/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev/sss/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev/sss/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev/sss/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev/sss/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev/sss/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev/sss/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev/sss/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev/sss/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev/sss/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev/sss/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev/sss/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev/sss/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev/sss/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev/sss/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev/sss/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev/sss/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev/sss/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev/sss/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev/sss/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev/sss/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev/sss/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev/sss/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev/sss/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev/sss/deployments",
                "created_at": "2015-05-20T17:01:00Z",
                "updated_at": "2016-01-14T16:46:55Z",
                "pushed_at": "2016-08-23T17:27:09Z",
                "git_url": "git://github.com/pscustomdev/sss.git",
                "ssh_url": "git@github.com:pscustomdev/sss.git",
                "clone_url": "https://github.com/pscustomdev/sss.git",
                "svn_url": "https://github.com/pscustomdev/sss",
                "homepage": null,
                "size": 8156,
                "stargazers_count": 1,
                "watchers_count": 1,
                "language": "JavaScript",
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 2,
                "forks": 0,
                "open_issues": 2,
                "watchers": 1,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53162231,
                "name": "01b5f08f-7611-4676-9d48-959cb9bbfcf4",
                "full_name": "pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4/deployments",
                "created_at": "2016-03-04T20:04:01Z",
                "updated_at": "2016-03-04T20:04:01Z",
                "pushed_at": "2016-03-04T20:04:02Z",
                "git_url": "git://github.com/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4.git",
                "ssh_url": "git@github.com:pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4.git",
                "clone_url": "https://github.com/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4.git",
                "svn_url": "https://github.com/pscustomdev-sss/01b5f08f-7611-4676-9d48-959cb9bbfcf4",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 1,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 1,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53163024,
                "name": "3f471b34-b188-47a2-b13b-93442931b9b5",
                "full_name": "pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5/deployments",
                "created_at": "2016-03-04T20:19:51Z",
                "updated_at": "2016-03-04T20:19:51Z",
                "pushed_at": "2016-03-04T20:19:51Z",
                "git_url": "git://github.com/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5.git",
                "ssh_url": "git@github.com:pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5.git",
                "clone_url": "https://github.com/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5.git",
                "svn_url": "https://github.com/pscustomdev-sss/3f471b34-b188-47a2-b13b-93442931b9b5",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53162739,
                "name": "569f93f3-4930-4587-96ac-09231f5488d8",
                "full_name": "pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8/deployments",
                "created_at": "2016-03-04T20:14:17Z",
                "updated_at": "2016-03-04T20:14:17Z",
                "pushed_at": "2016-03-04T20:14:17Z",
                "git_url": "git://github.com/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8.git",
                "ssh_url": "git@github.com:pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8.git",
                "clone_url": "https://github.com/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8.git",
                "svn_url": "https://github.com/pscustomdev-sss/569f93f3-4930-4587-96ac-09231f5488d8",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53162660,
                "name": "635cd957-fc3f-446b-88ae-edf92952f2b3",
                "full_name": "pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3/deployments",
                "created_at": "2016-03-04T20:12:52Z",
                "updated_at": "2016-03-04T20:12:52Z",
                "pushed_at": "2016-03-04T20:12:52Z",
                "git_url": "git://github.com/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3.git",
                "ssh_url": "git@github.com:pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3.git",
                "clone_url": "https://github.com/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3.git",
                "svn_url": "https://github.com/pscustomdev-sss/635cd957-fc3f-446b-88ae-edf92952f2b3",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53163767,
                "name": "65cfdf5b-1649-47c8-a84e-6a51327f1960",
                "full_name": "pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960/deployments",
                "created_at": "2016-03-04T20:34:40Z",
                "updated_at": "2016-03-04T20:34:40Z",
                "pushed_at": "2016-03-04T20:34:41Z",
                "git_url": "git://github.com/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960.git",
                "ssh_url": "git@github.com:pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960.git",
                "clone_url": "https://github.com/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960.git",
                "svn_url": "https://github.com/pscustomdev-sss/65cfdf5b-1649-47c8-a84e-6a51327f1960",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53163497,
                "name": "70e15c6d-e865-469e-9d9d-95c08031002a",
                "full_name": "pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a/deployments",
                "created_at": "2016-03-04T20:29:13Z",
                "updated_at": "2016-03-04T20:29:13Z",
                "pushed_at": "2016-03-04T20:29:14Z",
                "git_url": "git://github.com/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a.git",
                "ssh_url": "git@github.com:pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a.git",
                "clone_url": "https://github.com/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a.git",
                "svn_url": "https://github.com/pscustomdev-sss/70e15c6d-e865-469e-9d9d-95c08031002a",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53163151,
                "name": "acf5e783-23cf-4ea8-904d-0887ecc64913",
                "full_name": "pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913/deployments",
                "created_at": "2016-03-04T20:22:18Z",
                "updated_at": "2016-03-04T20:22:18Z",
                "pushed_at": "2016-03-04T20:22:20Z",
                "git_url": "git://github.com/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913.git",
                "ssh_url": "git@github.com:pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913.git",
                "clone_url": "https://github.com/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913.git",
                "svn_url": "https://github.com/pscustomdev-sss/acf5e783-23cf-4ea8-904d-0887ecc64913",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53162855,
                "name": "b1d7d857-2dee-4d09-b301-acac3644f909",
                "full_name": "pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909/deployments",
                "created_at": "2016-03-04T20:16:43Z",
                "updated_at": "2016-03-04T20:16:43Z",
                "pushed_at": "2016-03-04T20:16:44Z",
                "git_url": "git://github.com/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909.git",
                "ssh_url": "git@github.com:pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909.git",
                "clone_url": "https://github.com/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909.git",
                "svn_url": "https://github.com/pscustomdev-sss/b1d7d857-2dee-4d09-b301-acac3644f909",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53162411,
                "name": "b8812cab-ae96-4977-8832-073d3f495140",
                "full_name": "pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140",
                "owner": {
                    "login": "pscustomdev-sss",
                    "id": 13470587,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13470587?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/pscustomdev-sss",
                    "html_url": "https://github.com/pscustomdev-sss",
                    "followers_url": "https://api.github.com/users/pscustomdev-sss/followers",
                    "following_url": "https://api.github.com/users/pscustomdev-sss/following{/other_user}",
                    "gists_url": "https://api.github.com/users/pscustomdev-sss/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/pscustomdev-sss/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/pscustomdev-sss/subscriptions",
                    "organizations_url": "https://api.github.com/users/pscustomdev-sss/orgs",
                    "repos_url": "https://api.github.com/users/pscustomdev-sss/repos",
                    "events_url": "https://api.github.com/users/pscustomdev-sss/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/pscustomdev-sss/received_events",
                    "type": "User",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140",
                "description": "test",
                "fork": false,
                "url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140",
                "forks_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/forks",
                "keys_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/teams",
                "hooks_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/hooks",
                "issue_events_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/issues/events{/number}",
                "events_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/events",
                "assignees_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/assignees{/user}",
                "branches_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/branches{/branch}",
                "tags_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/tags",
                "blobs_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/languages",
                "stargazers_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/stargazers",
                "contributors_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/contributors",
                "subscribers_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/subscribers",
                "subscription_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/subscription",
                "commits_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/contents/{+path}",
                "compare_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/merges",
                "archive_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/downloads",
                "issues_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/issues{/number}",
                "pulls_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/labels{/name}",
                "releases_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/releases{/id}",
                "deployments_url": "https://api.github.com/repos/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140/deployments",
                "created_at": "2016-03-04T20:07:56Z",
                "updated_at": "2016-03-04T20:07:56Z",
                "pushed_at": "2016-03-04T20:07:57Z",
                "git_url": "git://github.com/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140.git",
                "ssh_url": "git@github.com:pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140.git",
                "clone_url": "https://github.com/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140.git",
                "svn_url": "https://github.com/pscustomdev-sss/b8812cab-ae96-4977-8832-073d3f495140",
                "homepage": "",
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 65316331,
                "name": "0fe46aff-683f-4e99-bced-9ac9bed31ae0",
                "full_name": "sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0",
                "description": "Bryan snippet desc Blah",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0",
                "forks_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0/deployments",
                "created_at": "2016-08-09T17:52:08Z",
                "updated_at": "2016-08-15T21:46:56Z",
                "pushed_at": "2016-08-23T15:43:43Z",
                "git_url": "git://github.com/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0.git",
                "ssh_url": "git@github.com:sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0.git",
                "clone_url": "https://github.com/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0.git",
                "svn_url": "https://github.com/sss-storage/0fe46aff-683f-4e99-bced-9ac9bed31ae0",
                "homepage": null,
                "size": 129,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 65310863,
                "name": "4460bbd4-48a2-4f52-8ad9-4030f1ed9864",
                "full_name": "sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864",
                "description": "Kent's 2nd desc",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864",
                "forks_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864/deployments",
                "created_at": "2016-08-09T16:30:12Z",
                "updated_at": "2016-08-09T16:30:12Z",
                "pushed_at": "2016-08-09T16:30:14Z",
                "git_url": "git://github.com/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864.git",
                "ssh_url": "git@github.com:sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864.git",
                "clone_url": "https://github.com/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864.git",
                "svn_url": "https://github.com/sss-storage/4460bbd4-48a2-4f52-8ad9-4030f1ed9864",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 65351931,
                "name": "54fdbe84-0e61-4bd9-878c-ca207aadec66",
                "full_name": "sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66",
                "description": "Test desc google blah",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66",
                "forks_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66/deployments",
                "created_at": "2016-08-10T05:01:07Z",
                "updated_at": "2016-08-15T18:30:18Z",
                "pushed_at": "2016-08-10T05:01:09Z",
                "git_url": "git://github.com/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66.git",
                "ssh_url": "git@github.com:sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66.git",
                "clone_url": "https://github.com/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66.git",
                "svn_url": "https://github.com/sss-storage/54fdbe84-0e61-4bd9-878c-ca207aadec66",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 66386692,
                "name": "8d101585-ac22-48e2-a887-42cc549274a5",
                "full_name": "sss-storage/8d101585-ac22-48e2-a887-42cc549274a5",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5",
                "description": "Bla blah",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5",
                "forks_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5/deployments",
                "created_at": "2016-08-23T17:04:09Z",
                "updated_at": "2016-08-23T17:04:09Z",
                "pushed_at": "2016-08-23T17:04:11Z",
                "git_url": "git://github.com/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5.git",
                "ssh_url": "git@github.com:sss-storage/8d101585-ac22-48e2-a887-42cc549274a5.git",
                "clone_url": "https://github.com/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5.git",
                "svn_url": "https://github.com/sss-storage/8d101585-ac22-48e2-a887-42cc549274a5",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 65763872,
                "name": "ab2788c9-e5f2-46bf-b98b-c0652a014cbd",
                "full_name": "sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd",
                "description": "Test github snippet123",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd",
                "forks_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd/deployments",
                "created_at": "2016-08-15T20:46:13Z",
                "updated_at": "2016-08-15T20:49:40Z",
                "pushed_at": "2016-08-15T20:46:18Z",
                "git_url": "git://github.com/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd.git",
                "ssh_url": "git@github.com:sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd.git",
                "clone_url": "https://github.com/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd.git",
                "svn_url": "https://github.com/sss-storage/ab2788c9-e5f2-46bf-b98b-c0652a014cbd",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 53092812,
                "name": "CallStoredProcedureInJDBCDriver",
                "full_name": "sss-storage/CallStoredProcedureInJDBCDriver",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/CallStoredProcedureInJDBCDriver",
                "description": "Call a stored procedure via policy in a JDBC driver",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver",
                "forks_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/CallStoredProcedureInJDBCDriver/deployments",
                "created_at": "2016-03-03T23:48:29Z",
                "updated_at": "2016-03-03T23:55:22Z",
                "pushed_at": "2016-03-10T22:31:50Z",
                "git_url": "git://github.com/sss-storage/CallStoredProcedureInJDBCDriver.git",
                "ssh_url": "git@github.com:sss-storage/CallStoredProcedureInJDBCDriver.git",
                "clone_url": "https://github.com/sss-storage/CallStoredProcedureInJDBCDriver.git",
                "svn_url": "https://github.com/sss-storage/CallStoredProcedureInJDBCDriver",
                "homepage": null,
                "size": 89,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 49678444,
                "name": "Check-Group-Membership-in-Policy",
                "full_name": "sss-storage/Check-Group-Membership-in-Policy",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/Check-Group-Membership-in-Policy",
                "description": "IDM driver policy to check group membership (or any multi-value attribute)",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy",
                "forks_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/deployments",
                "created_at": "2016-01-14T22:07:42Z",
                "updated_at": "2016-01-14T22:07:42Z",
                "pushed_at": "2016-01-14T22:08:27Z",
                "git_url": "git://github.com/sss-storage/Check-Group-Membership-in-Policy.git",
                "ssh_url": "git@github.com:sss-storage/Check-Group-Membership-in-Policy.git",
                "clone_url": "https://github.com/sss-storage/Check-Group-Membership-in-Policy.git",
                "svn_url": "https://github.com/sss-storage/Check-Group-Membership-in-Policy",
                "homepage": null,
                "size": 1,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 54206816,
                "name": "ExecuteECMAScriptBasedOnTimeAndParseXML",
                "full_name": "sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML",
                "description": "Execute ECMA script based on time interval and parse XML doc to cache Auth Token",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML",
                "forks_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML/deployments",
                "created_at": "2016-03-18T14:21:16Z",
                "updated_at": "2016-03-18T15:43:20Z",
                "pushed_at": "2016-03-18T15:43:53Z",
                "git_url": "git://github.com/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML.git",
                "ssh_url": "git@github.com:sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML.git",
                "clone_url": "https://github.com/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML.git",
                "svn_url": "https://github.com/sss-storage/ExecuteECMAScriptBasedOnTimeAndParseXML",
                "homepage": "",
                "size": 35,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 57919746,
                "name": "GetMiddleOfDN",
                "full_name": "sss-storage/GetMiddleOfDN",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/GetMiddleOfDN",
                "description": "",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN",
                "forks_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/GetMiddleOfDN/deployments",
                "created_at": "2016-05-02T20:33:17Z",
                "updated_at": "2016-05-02T20:33:17Z",
                "pushed_at": "2016-05-02T20:35:17Z",
                "git_url": "git://github.com/sss-storage/GetMiddleOfDN.git",
                "ssh_url": "git@github.com:sss-storage/GetMiddleOfDN.git",
                "clone_url": "https://github.com/sss-storage/GetMiddleOfDN.git",
                "svn_url": "https://github.com/sss-storage/GetMiddleOfDN",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 52550191,
                "name": "IDMPolicyForEach",
                "full_name": "sss-storage/IDMPolicyForEach",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/IDMPolicyForEach",
                "description": "Policy for performing a for-each in an IDM policy",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach",
                "forks_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/IDMPolicyForEach/deployments",
                "created_at": "2016-02-25T19:15:23Z",
                "updated_at": "2016-02-25T19:15:23Z",
                "pushed_at": "2016-08-01T21:52:50Z",
                "git_url": "git://github.com/sss-storage/IDMPolicyForEach.git",
                "ssh_url": "git@github.com:sss-storage/IDMPolicyForEach.git",
                "clone_url": "https://github.com/sss-storage/IDMPolicyForEach.git",
                "svn_url": "https://github.com/sss-storage/IDMPolicyForEach",
                "homepage": null,
                "size": 40,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 49225392,
                "name": "IDMSearchAndReplace",
                "full_name": "sss-storage/IDMSearchAndReplace",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/IDMSearchAndReplace",
                "description": "Search and replace template for xslt used in IDM stylesheets",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace",
                "forks_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/IDMSearchAndReplace/deployments",
                "created_at": "2016-01-07T19:21:30Z",
                "updated_at": "2016-08-01T21:11:19Z",
                "pushed_at": "2016-08-15T21:43:20Z",
                "git_url": "git://github.com/sss-storage/IDMSearchAndReplace.git",
                "ssh_url": "git@github.com:sss-storage/IDMSearchAndReplace.git",
                "clone_url": "https://github.com/sss-storage/IDMSearchAndReplace.git",
                "svn_url": "https://github.com/sss-storage/IDMSearchAndReplace",
                "homepage": null,
                "size": 1,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": "XSLT",
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 65247307,
                "name": "MochaTestRepo2",
                "full_name": "sss-storage/MochaTestRepo2",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/MochaTestRepo2",
                "description": "Mocha Description2",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/MochaTestRepo2",
                "forks_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/MochaTestRepo2/deployments",
                "created_at": "2016-08-08T23:36:27Z",
                "updated_at": "2016-08-08T23:36:27Z",
                "pushed_at": "2016-08-08T23:36:28Z",
                "git_url": "git://github.com/sss-storage/MochaTestRepo2.git",
                "ssh_url": "git@github.com:sss-storage/MochaTestRepo2.git",
                "clone_url": "https://github.com/sss-storage/MochaTestRepo2.git",
                "svn_url": "https://github.com/sss-storage/MochaTestRepo2",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 49677144,
                "name": "SearchInPolicy",
                "full_name": "sss-storage/SearchInPolicy",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/SearchInPolicy",
                "description": "A policy that shows how to search the directory and parse the results",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/SearchInPolicy",
                "forks_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/SearchInPolicy/deployments",
                "created_at": "2016-01-14T21:42:53Z",
                "updated_at": "2016-01-14T21:42:53Z",
                "pushed_at": "2016-01-14T21:47:29Z",
                "git_url": "git://github.com/sss-storage/SearchInPolicy.git",
                "ssh_url": "git@github.com:sss-storage/SearchInPolicy.git",
                "clone_url": "https://github.com/sss-storage/SearchInPolicy.git",
                "svn_url": "https://github.com/sss-storage/SearchInPolicy",
                "homepage": null,
                "size": 1,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 56002212,
                "name": "SendSoapDocDirectly",
                "full_name": "sss-storage/SendSoapDocDirectly",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/SendSoapDocDirectly",
                "description": "Send a soap doc directly without waiting for it to go through the entire channel so you can get an immediate response.",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly",
                "forks_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/SendSoapDocDirectly/deployments",
                "created_at": "2016-04-11T19:43:26Z",
                "updated_at": "2016-04-11T19:43:26Z",
                "pushed_at": "2016-04-11T19:53:19Z",
                "git_url": "git://github.com/sss-storage/SendSoapDocDirectly.git",
                "ssh_url": "git@github.com:sss-storage/SendSoapDocDirectly.git",
                "clone_url": "https://github.com/sss-storage/SendSoapDocDirectly.git",
                "svn_url": "https://github.com/sss-storage/SendSoapDocDirectly",
                "homepage": null,
                "size": 40,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 54213015,
                "name": "SetCommandDestProcessor",
                "full_name": "sss-storage/SetCommandDestProcessor",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/SetCommandDestProcessor",
                "description": "Set Command Destination Processor",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor",
                "forks_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/SetCommandDestProcessor/deployments",
                "created_at": "2016-03-18T15:44:42Z",
                "updated_at": "2016-03-18T15:44:42Z",
                "pushed_at": "2016-03-18T16:00:17Z",
                "git_url": "git://github.com/sss-storage/SetCommandDestProcessor.git",
                "ssh_url": "git@github.com:sss-storage/SetCommandDestProcessor.git",
                "clone_url": "https://github.com/sss-storage/SetCommandDestProcessor.git",
                "svn_url": "https://github.com/sss-storage/SetCommandDestProcessor",
                "homepage": null,
                "size": 63,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 54218368,
                "name": "SetDriverOperationData",
                "full_name": "sss-storage/SetDriverOperationData",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/SetDriverOperationData",
                "description": "Set driver-opertion-data (ie Soap Driver URL and Method)",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/SetDriverOperationData",
                "forks_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/SetDriverOperationData/deployments",
                "created_at": "2016-03-18T17:08:18Z",
                "updated_at": "2016-03-18T17:08:18Z",
                "pushed_at": "2016-03-18T17:16:17Z",
                "git_url": "git://github.com/sss-storage/SetDriverOperationData.git",
                "ssh_url": "git@github.com:sss-storage/SetDriverOperationData.git",
                "clone_url": "https://github.com/sss-storage/SetDriverOperationData.git",
                "svn_url": "https://github.com/sss-storage/SetDriverOperationData",
                "homepage": null,
                "size": 10,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 49676822,
                "name": "Strip-CN-from-DN",
                "full_name": "sss-storage/Strip-CN-from-DN",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/Strip-CN-from-DN",
                "description": "XSLT template to strip the CN from a DN",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN",
                "forks_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/Strip-CN-from-DN/deployments",
                "created_at": "2016-01-14T21:37:16Z",
                "updated_at": "2016-01-14T21:38:39Z",
                "pushed_at": "2016-02-10T22:59:16Z",
                "git_url": "git://github.com/sss-storage/Strip-CN-from-DN.git",
                "ssh_url": "git@github.com:sss-storage/Strip-CN-from-DN.git",
                "clone_url": "https://github.com/sss-storage/Strip-CN-from-DN.git",
                "svn_url": "https://github.com/sss-storage/Strip-CN-from-DN",
                "homepage": null,
                "size": 2,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": "XSLT",
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }, {
                "id": 51478230,
                "name": "Workflow-hide-show-fields",
                "full_name": "sss-storage/Workflow-hide-show-fields",
                "owner": {
                    "login": "sss-storage",
                    "id": 13575366,
                    "avatar_url": "https://avatars.githubusercontent.com/u/13575366?v=3",
                    "gravatar_id": "",
                    "url": "https://api.github.com/users/sss-storage",
                    "html_url": "https://github.com/sss-storage",
                    "followers_url": "https://api.github.com/users/sss-storage/followers",
                    "following_url": "https://api.github.com/users/sss-storage/following{/other_user}",
                    "gists_url": "https://api.github.com/users/sss-storage/gists{/gist_id}",
                    "starred_url": "https://api.github.com/users/sss-storage/starred{/owner}{/repo}",
                    "subscriptions_url": "https://api.github.com/users/sss-storage/subscriptions",
                    "organizations_url": "https://api.github.com/users/sss-storage/orgs",
                    "repos_url": "https://api.github.com/users/sss-storage/repos",
                    "events_url": "https://api.github.com/users/sss-storage/events{/privacy}",
                    "received_events_url": "https://api.github.com/users/sss-storage/received_events",
                    "type": "Organization",
                    "site_admin": false
                },
                "private": false,
                "html_url": "https://github.com/sss-storage/Workflow-hide-show-fields",
                "description": "How to show and hide fields based on the value of a field",
                "fork": false,
                "url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields",
                "forks_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/forks",
                "keys_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/keys{/key_id}",
                "collaborators_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/collaborators{/collaborator}",
                "teams_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/teams",
                "hooks_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/hooks",
                "issue_events_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/issues/events{/number}",
                "events_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/events",
                "assignees_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/assignees{/user}",
                "branches_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/branches{/branch}",
                "tags_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/tags",
                "blobs_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/git/blobs{/sha}",
                "git_tags_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/git/tags{/sha}",
                "git_refs_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/git/refs{/sha}",
                "trees_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/git/trees{/sha}",
                "statuses_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/statuses/{sha}",
                "languages_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/languages",
                "stargazers_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/stargazers",
                "contributors_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/contributors",
                "subscribers_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/subscribers",
                "subscription_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/subscription",
                "commits_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/commits{/sha}",
                "git_commits_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/git/commits{/sha}",
                "comments_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/comments{/number}",
                "issue_comment_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/issues/comments{/number}",
                "contents_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/contents/{+path}",
                "compare_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/compare/{base}...{head}",
                "merges_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/merges",
                "archive_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/{archive_format}{/ref}",
                "downloads_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/downloads",
                "issues_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/issues{/number}",
                "pulls_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/pulls{/number}",
                "milestones_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/milestones{/number}",
                "notifications_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/notifications{?since,all,participating}",
                "labels_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/labels{/name}",
                "releases_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/releases{/id}",
                "deployments_url": "https://api.github.com/repos/sss-storage/Workflow-hide-show-fields/deployments",
                "created_at": "2016-02-10T22:46:16Z",
                "updated_at": "2016-02-10T22:46:16Z",
                "pushed_at": "2016-02-10T22:55:46Z",
                "git_url": "git://github.com/sss-storage/Workflow-hide-show-fields.git",
                "ssh_url": "git@github.com:sss-storage/Workflow-hide-show-fields.git",
                "clone_url": "https://github.com/sss-storage/Workflow-hide-show-fields.git",
                "svn_url": "https://github.com/sss-storage/Workflow-hide-show-fields",
                "homepage": null,
                "size": 0,
                "stargazers_count": 0,
                "watchers_count": 0,
                "language": null,
                "has_issues": true,
                "has_downloads": true,
                "has_wiki": true,
                "has_pages": false,
                "forks_count": 0,
                "mirror_url": null,
                "open_issues_count": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "default_branch": "master",
                "permissions": {"admin": true, "push": true, "pull": true}
            }], {
                server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 19:14:48 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '161373',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4969',
                'x-ratelimit-reset': '1471982670',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"409eeb9e29b21523fbcda85fcd68ade3"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '075bb2f6b7031ca3c0e69edb17939fae',
                'x-github-request-id': '4BA2FBBD:5CCC:69F3E5A:57BCA0A8'
            });

        nock('http://127.0.0.1:52531', {"encodedQueryParams": true})
            .get('/api/snippets')
            .reply(200, ["sss", "01b5f08f-7611-4676-9d48-959cb9bbfcf4", "3f471b34-b188-47a2-b13b-93442931b9b5", "569f93f3-4930-4587-96ac-09231f5488d8", "635cd957-fc3f-446b-88ae-edf92952f2b3", "65cfdf5b-1649-47c8-a84e-6a51327f1960", "70e15c6d-e865-469e-9d9d-95c08031002a", "acf5e783-23cf-4ea8-904d-0887ecc64913", "b1d7d857-2dee-4d09-b301-acac3644f909", "b8812cab-ae96-4977-8832-073d3f495140", "0fe46aff-683f-4e99-bced-9ac9bed31ae0", "4460bbd4-48a2-4f52-8ad9-4030f1ed9864", "54fdbe84-0e61-4bd9-878c-ca207aadec66", "8d101585-ac22-48e2-a887-42cc549274a5", "ab2788c9-e5f2-46bf-b98b-c0652a014cbd", "CallStoredProcedureInJDBCDriver", "Check-Group-Membership-in-Policy", "ExecuteECMAScriptBasedOnTimeAndParseXML", "GetMiddleOfDN", "IDMPolicyForEach", "IDMSearchAndReplace", "MochaTestRepo2", "SearchInPolicy", "SendSoapDocDirectly", "SetCommandDestProcessor", "SetDriverOperationData", "Strip-CN-from-DN", "Workflow-hide-show-fields"], {
                'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '875',
                etag: 'W/"36b-7sjFDs28WhvvGrshNzd4VA"',
                date: 'Tue, 23 Aug 2016 19:14:49 GMT',
                connection: 'close'
            });

        nock('https://api.github.com:443', {"encodedQueryParams": true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message": "Not Found", "documentation_url": "https://developer.github.com/v3"}, {
                server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 19:14:49 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4968',
                'x-ratelimit-reset': '1471982670',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCD:3257029:57BCA0A8'
            });
    }

    function mockDataListOwnerSnippets() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66400229,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:19:31Z","updated_at":"2016-08-23T20:19:31Z","pushed_at":"2016-08-23T20:19:31Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:19:31 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4936',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"5b2459788ee90b73912d53abc1f64c22"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'bae57931a6fe678a3dffe9be8e7819c8',
                'x-github-request-id': '4BA2FBBD:5CCD:32B87D9:57BCAFD3' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"1446982978f71dc24a1e16548f7d85f01cc3738f","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/1446982978f71dc24a1e16548f7d85f01cc3738f","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/1446982978f71dc24a1e16548f7d85f01cc3738f","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:19:32Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:19:32Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:19:32 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4935',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"82d44a081f97b269f91c0ccaece67521"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'cee4c0729c8e9147e7abcb45b9d69689',
                'x-github-request-id': '4BA2FBBD:5CCD:32B8816:57BCAFD3' });

        nock('http://127.0.0.1:53091', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"1446982978f71dc24a1e16548f7d85f01cc3738f","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/1446982978f71dc24a1e16548f7d85f01cc3738f","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/1446982978f71dc24a1e16548f7d85f01cc3738f","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:19:32Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:19:32Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4935","x-ratelimit-reset":"1471986645","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"82d44a081f97b269f91c0ccaece67521\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-Eek0Ofw4E3jFXWa/GspPqQ"',
                date: 'Tue, 23 Aug 2016 20:19:32 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo2","description":"Mocha Description2","auto_init":false})
            .query({"access_token":apiToken})
            .reply(422, {"message":"Validation Failed","errors":[{"resource":"Repository","code":"custom","field":"name","message":"name already exists on this account"}],"documentation_url":"https://developer.github.com/v3/repos/#create"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:19:32 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '215',
                connection: 'close',
                status: '422 Unprocessable Entity',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4934',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCC:6AA7E90:57BCAFD4' });

        nock('http://127.0.0.1:53095', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo2","description":"Mocha Description2","displayName":"Mocha Display Name2","readme":"Mocha Readme2","owner":"fakeOwner"})
            .reply(500, {"error":"Error creating repository on GitHub: {\"message\":\"Validation Failed\",\"errors\":[{\"resource\":\"Repository\",\"code\":\"custom\",\"field\":\"name\",\"message\":\"name already exists on this account\"}],\"documentation_url\":\"https://developer.github.com/v3/repos/#create\"}"}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '290',
                etag: 'W/"122-VjJNqE+tFO/LqLkGB3A3og"',
                date: 'Tue, 23 Aug 2016 20:19:32 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53098', {"encodedQueryParams":true})
            .get('/api/snippets/fakeOwner')
            .reply(200, [{"snippetId":"MochaTestRepo2","owner":"fakeOwner","displayName":"Mocha Display Name2","postedOn":1471983572539,"description":"Mocha Description2","_id":3},{"snippetId":"MochaTestRepo","owner":"fakeOwner","displayName":"Mocha Display Name","postedOn":1471983571591,"description":"Mocha Description","_id":9}], { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '308',
                etag: 'W/"134-fxPYtH5bMVZjnEjRb7KYUw"',
                date: 'Tue, 23 Aug 2016 20:19:32 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:19:32 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4933',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '474556b853193c38f1b14328ce2d1b7d',
                'x-github-request-id': '4BA2FBBD:5CCE:545B316:57BCAFD4' });
    }

    function mockDataCreateSnippet() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66400884,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:29:35Z","updated_at":"2016-08-23T20:29:35Z","pushed_at":"2016-08-23T20:29:35Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:29:35 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4924',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"6f072751c3c22cc3825076ff5813fed5"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '626ed3a9050b8faa02ef5f3c540b508d',
                'x-github-request-id': '4BA2FBBD:5CCE:547126D:57BCB22F' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"321fa49a0faec79c23f0f23a6abdc008cfba3936","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/321fa49a0faec79c23f0f23a6abdc008cfba3936","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/321fa49a0faec79c23f0f23a6abdc008cfba3936","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:29:36Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:29:36Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:29:36 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4923',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"51d067abafffda417dc1f22b6b8e1a9d"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a7f8a126c9ed3f1c4715a34c0ddc7290',
                'x-github-request-id': '4BA2FBBD:5CC8:1B41D23:57BCB22F' });

        nock('http://127.0.0.1:53195', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"321fa49a0faec79c23f0f23a6abdc008cfba3936","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/321fa49a0faec79c23f0f23a6abdc008cfba3936","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/321fa49a0faec79c23f0f23a6abdc008cfba3936","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:29:36Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:29:36Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4923","x-ratelimit-reset":"1471986645","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"51d067abafffda417dc1f22b6b8e1a9d\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-mZXe/GYgippQrf7n0Wr4Hw"',
                date: 'Tue, 23 Aug 2016 20:29:36 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:29:36 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4922',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '52189b7290fad804d77890ef34a1eeae',
                'x-github-request-id': '4BA2FBBD:5CCD:32C6946:57BCB230' });

    }

    function mockDataUpdateSnippet() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66401138,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:33:11Z","updated_at":"2016-08-23T20:33:11Z","pushed_at":"2016-08-23T20:33:12Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:33:12 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4919',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"6c51f9eb765cc906046d9bb31465a63c"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a7f8a126c9ed3f1c4715a34c0ddc7290',
                'x-github-request-id': '4BA2FBBD:5CCC:6ACCE98:57BCB307' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"fea7f62d39ef689ce812787d48fe8d819c3eee22","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/fea7f62d39ef689ce812787d48fe8d819c3eee22","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/fea7f62d39ef689ce812787d48fe8d819c3eee22","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:33:12Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:33:12Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:33:12 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4918',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"68956673fd5fb12d32a0cb742aa07ff0"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '7b641bda7ec2ca7cd9df72d2578baf75',
                'x-github-request-id': '4BA2FBBD:5CCD:32CBD1B:57BCB308' });

        nock('http://127.0.0.1:53232', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"fea7f62d39ef689ce812787d48fe8d819c3eee22","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/fea7f62d39ef689ce812787d48fe8d819c3eee22","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/fea7f62d39ef689ce812787d48fe8d819c3eee22","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:33:12Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:33:12Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4918","x-ratelimit-reset":"1471986645","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"68956673fd5fb12d32a0cb742aa07ff0\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-fVAJrx1cSCo9kH8Os8obNw"',
                date: 'Tue, 23 Aug 2016 20:33:13 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .patch('/repos/sss-storage/MochaTestRepo', {"name":"MochaTestRepo","description":"blah"})
            .query({"access_token":apiToken})
            .reply(200, {"id":66401138,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"blah","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:33:11Z","updated_at":"2016-08-23T20:33:13Z","pushed_at":"2016-08-23T20:33:12Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:33:13 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5973',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4917',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"f012527e0ef6deaceb61f3c9443c5fe6"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '9000e9eef7bb1e89f22030c676da140e',
                'x-github-request-id': '4BA2FBBD:5CCC:6ACCFAE:57BCB309' });

        nock('http://127.0.0.1:53237', {"encodedQueryParams":true})
            .put('/api/snippet/MochaTestRepo', {"_id":"MochaTestRepo","description":"blah","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"id":66401138,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"blah","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:33:11Z","updated_at":"2016-08-23T20:33:13Z","pushed_at":"2016-08-23T20:33:12Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2,"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4917","x-ratelimit-reset":"1471986645","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"f012527e0ef6deaceb61f3c9443c5fe6\"","status":"200 OK"}}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '6263',
                etag: 'W/"1877-kt26E1/x4g2M9UP5qYmsMA"',
                date: 'Tue, 23 Aug 2016 20:33:13 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:33:13 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4916',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': 'a7f8a126c9ed3f1c4715a34c0ddc7290',
                'x-github-request-id': '4BA2FBBD:5CCC:6ACCFD5:57BCB309' });
    }

    function mockDataDeleteSnippet() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66401343,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:36:07Z","updated_at":"2016-08-23T20:36:07Z","pushed_at":"2016-08-23T20:36:08Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:36:08 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4908',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"45b069200ca33bed031450c8d6189490"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '9000e9eef7bb1e89f22030c676da140e',
                'x-github-request-id': '4BA2FBBD:5CCC:6AD53BB:57BCB3B7' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"91777482f0c4fef70a967ec4c1b17e6908733beb","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/91777482f0c4fef70a967ec4c1b17e6908733beb","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/91777482f0c4fef70a967ec4c1b17e6908733beb","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:36:09Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:36:09Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:36:09 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4907',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"c2a3d55ed88ca0e2c40168aae2013353"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '52437fedc85beec8da3449496900fb9a',
                'x-github-request-id': '4BA2FBBD:5CCD:32CFF7D:57BCB3B8' });

        nock('http://127.0.0.1:53274', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"91777482f0c4fef70a967ec4c1b17e6908733beb","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/91777482f0c4fef70a967ec4c1b17e6908733beb","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/91777482f0c4fef70a967ec4c1b17e6908733beb","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:36:09Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:36:09Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4907","x-ratelimit-reset":"1471986645","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"c2a3d55ed88ca0e2c40168aae2013353\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-UUCBPkh6CXVHIy6qvg1Eag"',
                date: 'Tue, 23 Aug 2016 20:36:09 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(200, {"id":66401343,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:36:07Z","updated_at":"2016-08-23T20:36:07Z","pushed_at":"2016-08-23T20:36:08Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:36:09 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4906',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"45b069200ca33bed031450c8d6189490"',
                'last-modified': 'Tue, 23 Aug 2016 20:36:07 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '173530fed4bbeb1e264b2ed22e8b5c20',
                'x-github-request-id': '4BA2FBBD:5CCE:5480A7D:57BCB3B9' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:36:09 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4905',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '4c8b2d4732c413f4b9aefe394bd65569',
                'x-github-request-id': '4BA2FBBD:5CCD:32CFFC0:57BCB3B9' });

        nock('http://127.0.0.1:53280', {"encodedQueryParams":true})
            .delete('/api/snippet/MochaTestRepo')
            .reply(200, "", { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-nUVowAnSA6sQ4z6plToCZA"',
                date: 'Tue, 23 Aug 2016 20:36:10 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:36:10 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4904',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCC:6AD55D9:57BCB3B9' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:36:10 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4903',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCC:6AD560D:57BCB3BA' });
    }

    function mockDataSnippetOverview() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66401584,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:39:34Z","updated_at":"2016-08-23T20:39:34Z","pushed_at":"2016-08-23T20:39:35Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:39:35 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4901',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"0f4f25bfe0432fbb2a3b5bb95144b583"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '13d09b732ebe76f892093130dc088652',
                'x-github-request-id': '4BA2FBBD:5CCE:54885B0:57BCB486' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"16a9638b269ff207f6cecfdde98e80e867e3bb6f","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/16a9638b269ff207f6cecfdde98e80e867e3bb6f","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/16a9638b269ff207f6cecfdde98e80e867e3bb6f","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:39:35Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:39:35Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:39:35 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4900',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"4413a3cc6ba3a197e9bad0ca55b9ec49"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'e183f7c661b1bbc2c987b3c4dc7b04e0',
                'x-github-request-id': '4BA2FBBD:5CCC:6ADE931:57BCB487' });

        nock('http://127.0.0.1:53310', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"16a9638b269ff207f6cecfdde98e80e867e3bb6f","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/16a9638b269ff207f6cecfdde98e80e867e3bb6f","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/16a9638b269ff207f6cecfdde98e80e867e3bb6f","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:39:35Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T20:39:35Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4900","x-ratelimit-reset":"1471986645","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"4413a3cc6ba3a197e9bad0ca55b9ec49\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-+6zh2dv4l4Hhx+kTyqQnkg"',
                date: 'Tue, 23 Aug 2016 20:39:36 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/')
            .query({"access_token":apiToken})
            .reply(200, [{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}], { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:39:36 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '794',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4899',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"ec4020307d52b12ac95fe11213709dc9"',
                'last-modified': 'Tue, 23 Aug 2016 20:39:34 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '2811da37fbdda4367181b328b22b2499',
                'x-github-request-id': '4BA2FBBD:5CCC:6ADE95E:57BCB488' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(200, {"id":66401584,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T20:39:34Z","updated_at":"2016-08-23T20:39:34Z","pushed_at":"2016-08-23T20:39:35Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:39:36 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4898',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"0f4f25bfe0432fbb2a3b5bb95144b583"',
                'last-modified': 'Tue, 23 Aug 2016 20:39:34 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '593010132f82159af0ded24b4932e109',
                'x-github-request-id': '4BA2FBBD:5CCC:6ADE9AA:57BCB488' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/readme')
            .query({"access_token":apiToken})
            .reply(200, {"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:39:36 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '871',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4897',
                'x-ratelimit-reset': '1471986645',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"2fcb9fbf2ed93a700a6a042e7f615c73"',
                'last-modified': 'Tue, 23 Aug 2016 20:39:35 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a6882e5cd2513376cb9481dbcd83f3a2',
                'x-github-request-id': '4BA2FBBD:5CCC:6ADE9DF:57BCB488' });

        nock('http://127.0.0.1:53314', {"encodedQueryParams":true})
            .get('/api/snippet-overview/MochaTestRepo')
            .reply(200, {"name":"MochaTestRepo","files":["README.md"],"_id":"MochaTestRepo","description":"Mocha Description","readme":"<h1 id=\"mocha-display-name\">Mocha Display Name</h1>\n<p>Mocha Readme</p>\n","displayName":"Mocha Display Name","owner":"fakeOwner","postedOn":1471984774868,"isOwner":true}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '285',
                etag: 'W/"11d-LIETwIYK65sUL0QGA1MJcw"',
                date: 'Tue, 23 Aug 2016 20:39:37 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:39:37 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4896',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': 'c6c65e5196703428e7641f7d1e9bc353',
                'x-github-request-id': '4BA2FBBD:5CCC:6ADEA12:57BCB489' });
    }

    function mockDataCreateRating() {
        nock('http://127.0.0.1:53372', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner","rating":5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 20:46:24 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53374', {"encodedQueryParams":true})
            .get('/api/rating/MochaTestRepo')
            .reply(200, 5, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1',
                etag: 'W/"1-5No7f7vOI0XXdysGdKMY1Q"',
                date: 'Tue, 23 Aug 2016 20:46:24 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:46:24 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4893',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCD:32DE93D:57BCB620' });
    }

    function mockDataUpdateRating() {
        nock('http://127.0.0.1:53406', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner","rating":4})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 20:48:41 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53408', {"encodedQueryParams":true})
            .get('/api/rating/MochaTestRepo')
            .reply(200, 4, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1',
                etag: 'W/"1-qH/2eaLz5x2RgaZ7dUISLA"',
                date: 'Tue, 23 Aug 2016 20:48:42 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:48:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4888',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCD:32E20D7:57BCB6A9' });
    }

    function mockDataAverageRating() {
        nock('http://127.0.0.1:53431', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner","rating":5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 20:50:24 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53433', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner2","rating":1.5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 20:50:24 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53435', {"encodedQueryParams":true})
            .get('/api/rating/MochaTestRepo')
            .reply(200, 3.25, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '4',
                etag: 'W/"4-3X9UI5KksxlGgmY4MWhHyw"',
                date: 'Tue, 23 Aug 2016 20:50:24 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:50:24 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4885',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCE:54A1414:57BCB70F' });
    }

    function mockDataUserRating() {
        nock('http://127.0.0.1:53457', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner","rating":5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 20:52:10 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53459', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner2","rating":1.5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 20:52:10 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53461', {"encodedQueryParams":true})
            .get('/api/rating/MochaTestRepo/testOwner')
            .reply(200, {"snippetId":"MochaTestRepo","rater":"testOwner","rating":5,"_id":7}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '68',
                etag: 'W/"44-3VbJttjZRHxecv3jzg+B8w"',
                date: 'Tue, 23 Aug 2016 20:52:10 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 20:52:10 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4882',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCE:54A51A4:57BCB77A' });
    }

    function mockDataAllAverageRatings() {
        nock('http://127.0.0.1:53592', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner","rating":5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:09:55 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53594', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo', {"snippetId":"MochaTestRepo","rater":"testOwner2","rating":1.5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:09:55 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53596', {"encodedQueryParams":true})
            .post('/api/rating/MochaTestRepo2', {"snippetId":"MochaTestRepo2","rater":"whoever","rating":1.5})
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:09:55 GMT',
                connection: 'close' });

        nock('http://127.0.0.1:53598', {"encodedQueryParams":true})
            .get('/api/ratings/MochaTestRepo%2CMochaTestRepo2')
            .reply(200, [{"snippetId":"MochaTestRepo","rating":3.25},{"snippetId":"MochaTestRepo2","rating":1.5}], { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '89',
                etag: 'W/"59-ykBnu4kmieVDOFbPy3FUBQ"',
                date: 'Tue, 23 Aug 2016 21:09:55 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:09:55 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4879',
                'x-ratelimit-reset': '1471986645',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCC:6B31FF6:57BCBBA3' });
    }

    function mockDataDefaultRating() {
        nock('http://127.0.0.1:53627', {"encodedQueryParams":true})
            .get('/api/rating/fakesnippet')
            .reply(200, 0, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1',
                etag: 'W/"1-z80ghJXVZe9m59/5+Ydk2g"',
                date: 'Tue, 23 Aug 2016 21:12:01 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:12:01 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4997',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCD:3300FCE:57BCBC21' });
    }

    function mockDataAddFile() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66403798,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:14:19Z","updated_at":"2016-08-23T21:14:19Z","pushed_at":"2016-08-23T21:14:20Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:20 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4918',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"dafa54a702ee87b29d714e5e57fb28e1"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '49aa99f015c25437a7443c4d3a58cd17',
                'x-github-request-id': '4BA2FBBD:5CCD:3304246:57BCBCAB' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"2857b0d9e6264695f0094a41b082d5728136e33a","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/2857b0d9e6264695f0094a41b082d5728136e33a","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/2857b0d9e6264695f0094a41b082d5728136e33a","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:14:20Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:14:20Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:20 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4917',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"fe48ffed8037f94e951c90624fbe6dc5"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'edf23fdc48375d9066b698b8d98062e9',
                'x-github-request-id': '4BA2FBBD:5CCC:6B3E858:57BCBCAC' });

        nock('http://127.0.0.1:53672', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"2857b0d9e6264695f0094a41b082d5728136e33a","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/2857b0d9e6264695f0094a41b082d5728136e33a","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/2857b0d9e6264695f0094a41b082d5728136e33a","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:14:20Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:14:20Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4917","x-ratelimit-reset":"1471990250","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"fe48ffed8037f94e951c90624fbe6dc5\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-7s4ONKupO1/yYGDQRW7WGA"',
                date: 'Tue, 23 Aug 2016 21:14:21 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile', {"message":"MochaTestFile creation","content":"IA=="})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},"commit":{"sha":"a868e4ce1453a276953f272d032778b23d5ff7da","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/a868e4ce1453a276953f272d032778b23d5ff7da","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/a868e4ce1453a276953f272d032778b23d5ff7da","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:14:21Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:14:21Z"},"tree":{"sha":"aa80a5230f63a172a42c5c752c017a396d3e0503","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/aa80a5230f63a172a42c5c752c017a396d3e0503"},"message":"MochaTestFile creation","parents":[{"sha":"2857b0d9e6264695f0094a41b082d5728136e33a","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/2857b0d9e6264695f0094a41b082d5728136e33a","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/2857b0d9e6264695f0094a41b082d5728136e33a"}]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:21 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1804',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4916',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"3a81b12d5c443bfcbaa9dfea75d5c3b6"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'd0b3c2c33a23690498aa8e70a435a259',
                'x-github-request-id': '4BA2FBBD:5CCE:54D4638:57BCBCAD' });

        nock('http://127.0.0.1:53676', {"encodedQueryParams":true})
            .post('/api/snippet-detail/MochaTestRepo/MochaTestFile')
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:14:21 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/')
            .query({"access_token":apiToken})
            .reply(200, [{"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}], { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:21 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1614',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4915',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"de98f43f0fc00e721d4b799fc2fbd592"',
                'last-modified': 'Tue, 23 Aug 2016 21:14:19 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'b0ef53392caa42315c6206737946d931',
                'x-github-request-id': '4BA2FBBD:5CCC:6B3E930:57BCBCAD' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(200, {"id":66403798,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:14:19Z","updated_at":"2016-08-23T21:14:19Z","pushed_at":"2016-08-23T21:14:21Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:21 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4914',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"48e31646c781b10ff40b5877048d03bf"',
                'last-modified': 'Tue, 23 Aug 2016 21:14:19 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'e724c57ebb9961c772a91e2dd7421c8d',
                'x-github-request-id': '4BA2FBBD:5CC8:1B66B51:57BCBCAD' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/readme')
            .query({"access_token":apiToken})
            .reply(200, {"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:21 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '871',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4913',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"2fcb9fbf2ed93a700a6a042e7f615c73"',
                'last-modified': 'Tue, 23 Aug 2016 21:14:21 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '8166eb1845e56d99ba68a6b1065016c1',
                'x-github-request-id': '4BA2FBBD:5CCC:6B3E97D:57BCBCAD' });

        nock('http://127.0.0.1:53679', {"encodedQueryParams":true})
            .get('/api/snippet-overview/MochaTestRepo')
            .reply(200, {"name":"MochaTestRepo","files":["README.md","MochaTestFile"],"_id":"MochaTestRepo","description":"Mocha Description","readme":"<h1 id=\"mocha-display-name\">Mocha Display Name</h1>\n<p>Mocha Readme</p>\n","displayName":"Mocha Display Name","owner":"fakeOwner","postedOn":1471986859926,"isOwner":true}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '301',
                etag: 'W/"12d-CxhrsmFtD0VgZKNnWXNJoA"',
                date: 'Tue, 23 Aug 2016 21:14:22 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:14:22 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4912',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '7f48e2f7761567e923121f17538d7a6d',
                'x-github-request-id': '4BA2FBBD:5CCC:6B3E9BC:57BCBCAE' });
    }

    function mockDataUploadFile() {

    }

    function mockDataUpdateFile() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66404203,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:20:40Z","updated_at":"2016-08-23T21:20:40Z","pushed_at":"2016-08-23T21:20:41Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4905',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"b864051bdbc13c3fe3160d2987147d61"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '7b641bda7ec2ca7cd9df72d2578baf75',
                'x-github-request-id': '4BA2FBBD:5CC8:1B6B8A9:57BCBE28' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:41Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:41Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4904',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"b427c35a093ac19ce23ba1dced5e3442"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'd0b3c2c33a23690498aa8e70a435a259',
                'x-github-request-id': '4BA2FBBD:5CCE:54E1AA7:57BCBE29' });

        nock('http://127.0.0.1:53745', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:41Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:41Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4904","x-ratelimit-reset":"1471990250","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"b427c35a093ac19ce23ba1dced5e3442\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-ZafcLWYQ4utU3P32mw9/BQ"',
                date: 'Tue, 23 Aug 2016 21:20:41 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile', {"message":"MochaTestFile creation","content":"IA=="})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},"commit":{"sha":"f54b9b8647e2a7c394c824b07f2cb73cc3466abb","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/f54b9b8647e2a7c394c824b07f2cb73cc3466abb","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/f54b9b8647e2a7c394c824b07f2cb73cc3466abb","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:41Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:41Z"},"tree":{"sha":"aa80a5230f63a172a42c5c752c017a396d3e0503","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/aa80a5230f63a172a42c5c752c017a396d3e0503"},"message":"MochaTestFile creation","parents":[{"sha":"a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/a9bc1f96b87b978bf0b5b87c88d50bb7dec3013c"}]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1804',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4903',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"74ef9ccf16cb600fd2b6fa305dea75b4"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '5aeb3f30c9e3ef6ef7bcbcddfd9a68f7',
                'x-github-request-id': '4BA2FBBD:5CCD:330C1F3:57BCBE29' });

        nock('http://127.0.0.1:53749', {"encodedQueryParams":true})
            .post('/api/snippet-detail/MochaTestRepo/MochaTestFile')
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:20:42 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/')
            .query({"access_token":apiToken})
            .reply(200, [{"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}], { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1614',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4902',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"de98f43f0fc00e721d4b799fc2fbd592"',
                'last-modified': 'Tue, 23 Aug 2016 21:20:40 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'e183f7c661b1bbc2c987b3c4dc7b04e0',
                'x-github-request-id': '4BA2FBBD:5CCE:54E1AED:57BCBE29' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(200, {"id":66404203,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:20:40Z","updated_at":"2016-08-23T21:20:40Z","pushed_at":"2016-08-23T21:20:41Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4901',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"b864051bdbc13c3fe3160d2987147d61"',
                'last-modified': 'Tue, 23 Aug 2016 21:20:40 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '1e9204dbc0447a6f39c3b3c44d87b3f8',
                'x-github-request-id': '4BA2FBBD:5CCE:54E1B10:57BCBE29' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/readme')
            .query({"access_token":apiToken})
            .reply(200, {"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '871',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4900',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"2fcb9fbf2ed93a700a6a042e7f615c73"',
                'last-modified': 'Tue, 23 Aug 2016 21:20:41 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a474937f3b2fa272558fa6dc951018ad',
                'x-github-request-id': '4BA2FBBD:5CCD:330C23D:57BCBE2A' });

        nock('http://127.0.0.1:53752', {"encodedQueryParams":true})
            .get('/api/snippet-overview/MochaTestRepo')
            .reply(200, {"name":"MochaTestRepo","files":["README.md","MochaTestFile"],"_id":"MochaTestRepo","description":"Mocha Description","readme":"<h1 id=\"mocha-display-name\">Mocha Display Name</h1>\n<p>Mocha Readme</p>\n","displayName":"Mocha Display Name","owner":"fakeOwner","postedOn":1471987240923,"isOwner":true}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '301',
                etag: 'W/"12d-gTQMCzCogbHzaG0RxBpzsQ"',
                date: 'Tue, 23 Aug 2016 21:20:42 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile')
            .query({"access_token":apiToken})
            .reply(200, {"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","content":"IA==\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '858',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4899',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"689d02855bb24390db00d452eda9922e"',
                'last-modified': 'Tue, 23 Aug 2016 21:20:41 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'ef96c2e493b28ffea49b891b085ed2dd',
                'x-github-request-id': '4BA2FBBD:5CCD:330C255:57BCBE2A' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile', {"message":"MochaTestFile update","content":"U2FtcGxlIGRhdGEgdG8gd3JpdGUgdG8gZmlsZQ==","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73"})
            .query({"access_token":apiToken})
            .reply(200, {"content":{"name":"MochaTestFile","path":"MochaTestFile","sha":"1bc8e456657723ff6d4fc21105f8724a4cf21dad","size":28,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/1bc8e456657723ff6d4fc21105f8724a4cf21dad","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/1bc8e456657723ff6d4fc21105f8724a4cf21dad","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},"commit":{"sha":"322b3439c7c8b10cb79dc2d2098fe47bb3f3b14b","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/322b3439c7c8b10cb79dc2d2098fe47bb3f3b14b","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/322b3439c7c8b10cb79dc2d2098fe47bb3f3b14b","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:42Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:20:42Z"},"tree":{"sha":"6c6b89d824c54ab6706b295819b041039297f740","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/6c6b89d824c54ab6706b295819b041039297f740"},"message":"MochaTestFile update","parents":[{"sha":"f54b9b8647e2a7c394c824b07f2cb73cc3466abb","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/f54b9b8647e2a7c394c824b07f2cb73cc3466abb","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/f54b9b8647e2a7c394c824b07f2cb73cc3466abb"}]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1803',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4898',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"4ca77d4d7d756d48c961a82597580904"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '474556b853193c38f1b14328ce2d1b7d',
                'x-github-request-id': '4BA2FBBD:5CCE:54E1B81:57BCBE2A' });

        nock('http://127.0.0.1:53757', {"encodedQueryParams":true})
            .put('/api/snippet-detail/MochaTestRepo/MochaTestFile', {"content":"Sample data to write to file"})
            .reply(200, {}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:20:43 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile')
            .query({"access_token":apiToken})
            .reply(200, {"name":"MochaTestFile","path":"MochaTestFile","sha":"1bc8e456657723ff6d4fc21105f8724a4cf21dad","size":28,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/1bc8e456657723ff6d4fc21105f8724a4cf21dad","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","content":"U2FtcGxlIGRhdGEgdG8gd3JpdGUgdG8gZmlsZQ==\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/1bc8e456657723ff6d4fc21105f8724a4cf21dad","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:43 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '895',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4897',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"310a858d266ecd2fa7929f7fb9ba8e42"',
                'last-modified': 'Tue, 23 Aug 2016 21:20:42 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'e183f7c661b1bbc2c987b3c4dc7b04e0',
                'x-github-request-id': '4BA2FBBD:5CCE:54E1BAE:57BCBE2B' });

        nock('http://127.0.0.1:53761', {"encodedQueryParams":true})
            .get('/api/snippet-detail/MochaTestRepo/MochaTestFile')
            .reply(200, "Sample data to write to file", { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '30',
                etag: 'W/"1e-WyV3ZASphKWZtbZzflsQKA"',
                date: 'Tue, 23 Aug 2016 21:20:43 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:20:43 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4896',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '5aeb3f30c9e3ef6ef7bcbcddfd9a68f7',
                'x-github-request-id': '4BA2FBBD:5CCD:330C292:57BCBE2B' });
    }

    function mockDataGetFile() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66404394,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:23:33Z","updated_at":"2016-08-23T21:23:33Z","pushed_at":"2016-08-23T21:23:34Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:23:34 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4893',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"4107fa1bf61f4333f7b429a48da588cd"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '7efb7ae49588ef0269c6a1c1bd3721d9',
                'x-github-request-id': '4BA2FBBD:5CCD:330F9E0:57BCBED5' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"504638419c84c985445a52113ad51b46f2088dbc","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/504638419c84c985445a52113ad51b46f2088dbc","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/504638419c84c985445a52113ad51b46f2088dbc","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:23:34Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:23:34Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:23:34 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4892',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"cf75a5cb6a648970d8c481df0991d7cb"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '8dd185e423974a7e13abbbe6e060031e',
                'x-github-request-id': '4BA2FBBD:5CCD:330FA0D:57BCBED6' });

        nock('http://127.0.0.1:53799', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"504638419c84c985445a52113ad51b46f2088dbc","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/504638419c84c985445a52113ad51b46f2088dbc","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/504638419c84c985445a52113ad51b46f2088dbc","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:23:34Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:23:34Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4892","x-ratelimit-reset":"1471990250","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"cf75a5cb6a648970d8c481df0991d7cb\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-OAxxYEwGKesknAfFVw7YIQ"',
                date: 'Tue, 23 Aug 2016 21:23:34 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/README.md')
            .query({"access_token":apiToken})
            .reply(200, {"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:23:34 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '871',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4891',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"2fcb9fbf2ed93a700a6a042e7f615c73"',
                'last-modified': 'Tue, 23 Aug 2016 21:23:34 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '8a5c38021a5cd7cef7b8f49a296fee40',
                'x-github-request-id': '4BA2FBBD:5CCE:54E8002:57BCBED6' });

        nock('http://127.0.0.1:53803', {"encodedQueryParams":true})
            .get('/api/snippet-detail/MochaTestRepo/README.md')
            .reply(200, "# Mocha Display Name\nMocha Readme", { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '36',
                etag: 'W/"24-r9W5+ytDDdvEbIMUGS/HYw"',
                date: 'Tue, 23 Aug 2016 21:23:35 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:23:34 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4890',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '76d9828c7e4f1d910f7ba069e90ce976',
                'x-github-request-id': '4BA2FBBD:5CCE:54E8022:57BCBED6' });
    }

    function mockDataDeleteFile() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .post('/orgs/sss-storage/repos', {"name":"MochaTestRepo","description":"Mocha Description","auto_init":false})
            .query({"access_token":apiToken})
            .reply(201, {"id":66404542,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:25:40Z","updated_at":"2016-08-23T21:25:40Z","pushed_at":"2016-08-23T21:25:40Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:40 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4887',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"823430ac575e17ed181694264a4ff71b"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'public_repo, repo',
                location: 'https://api.github.com/repos/sss-storage/MochaTestRepo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'b0ef53392caa42315c6206737946d931',
                'x-github-request-id': '4BA2FBBD:5CCE:54EC802:57BCBF54' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/README.md', {"message":"README.md creation","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l"})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:40Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:40Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:40 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1501',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4886',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"fc42c38f4a701804f9548005a512ae9e"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'cee4c0729c8e9147e7abcb45b9d69689',
                'x-github-request-id': '4BA2FBBD:5CCC:6B5C06C:57BCBF54' });

        nock('http://127.0.0.1:53832', {"encodedQueryParams":true})
            .post('/api/snippet', {"_id":"MochaTestRepo","description":"Mocha Description","displayName":"Mocha Display Name","readme":"Mocha Readme","owner":"fakeOwner"})
            .reply(200, {"content":{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}},"commit":{"sha":"edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:40Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:40Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"README.md creation","parents":[]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4886","x-ratelimit-reset":"1471990250","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"fc42c38f4a701804f9548005a512ae9e\"","status":"201 Created"}}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1796',
                etag: 'W/"704-vxavFO0dsJLY94ZLazk74A"',
                date: 'Tue, 23 Aug 2016 21:25:41 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .put('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile', {"message":"MochaTestFile creation","content":"IA=="})
            .query({"access_token":apiToken})
            .reply(201, {"content":{"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},"commit":{"sha":"e382d87dbbb0eedf244d26f32d2c1b346c90ed36","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/e382d87dbbb0eedf244d26f32d2c1b346c90ed36","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/e382d87dbbb0eedf244d26f32d2c1b346c90ed36","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:41Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:41Z"},"tree":{"sha":"aa80a5230f63a172a42c5c752c017a396d3e0503","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/aa80a5230f63a172a42c5c752c017a396d3e0503"},"message":"MochaTestFile creation","parents":[{"sha":"edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/edfe0b886afd2ab8e562359cbf54e859bf4f1b9d","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/edfe0b886afd2ab8e562359cbf54e859bf4f1b9d"}]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1804',
                connection: 'close',
                status: '201 Created',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4885',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"3169390df0ef4bef7de10dd33b6c1214"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a30e6f9aa7cf5731b87dfb3b9992202d',
                'x-github-request-id': '4BA2FBBD:5CCD:33129B2:57BCBF54' });

        nock('http://127.0.0.1:53836', {"encodedQueryParams":true})
            .post('/api/snippet-detail/MochaTestRepo/MochaTestFile')
            .reply(200, {}, { 'x-powered-by': 'Express',
                vary: 'X-HTTP-Method-Override',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2',
                etag: 'W/"2-mZFLkyvTelC5g8XnyQrpOw"',
                date: 'Tue, 23 Aug 2016 21:25:41 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/')
            .query({"access_token":apiToken})
            .reply(200, [{"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}},{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}], { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1614',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4884',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"de98f43f0fc00e721d4b799fc2fbd592"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:40 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a51acaae89a7607fd7ee967627be18e4',
                'x-github-request-id': '4BA2FBBD:5CCD:33129D2:57BCBF55' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(200, {"id":66404542,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:25:40Z","updated_at":"2016-08-23T21:25:40Z","pushed_at":"2016-08-23T21:25:41Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4883',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"86eb64c1990e30fdc11e2996bd80e8b1"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:40 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'e724c57ebb9961c772a91e2dd7421c8d',
                'x-github-request-id': '4BA2FBBD:5CCD:33129E6:57BCBF55' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/readme')
            .query({"access_token":apiToken})
            .reply(200, {"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:41 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '871',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4882',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"2fcb9fbf2ed93a700a6a042e7f615c73"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:41 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '8a5c38021a5cd7cef7b8f49a296fee40',
                'x-github-request-id': '4BA2FBBD:5CC8:1B6FA21:57BCBF55' });

        nock('http://127.0.0.1:53839', {"encodedQueryParams":true})
            .get('/api/snippet-overview/MochaTestRepo')
            .reply(200, {"name":"MochaTestRepo","files":["README.md","MochaTestFile"],"_id":"MochaTestRepo","description":"Mocha Description","readme":"<h1 id=\"mocha-display-name\">Mocha Display Name</h1>\n<p>Mocha Readme</p>\n","displayName":"Mocha Display Name","owner":"fakeOwner","postedOn":1471987540408,"isOwner":true}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '301',
                etag: 'W/"12d-PxTAz5rRUHHHTq9C7QxLhg"',
                date: 'Tue, 23 Aug 2016 21:25:42 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile')
            .query({"access_token":apiToken})
            .reply(200, {"name":"MochaTestFile","path":"MochaTestFile","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","size":1,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/MochaTestFile","type":"file","content":"IA==\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/MochaTestFile?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/0519ecba6ea913e21689ec692e81e9e4973fbf73","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/MochaTestFile"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '858',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4881',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"689d02855bb24390db00d452eda9922e"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:41 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '065b43cd9674091fec48a221b420fbb3',
                'x-github-request-id': '4BA2FBBD:5CCD:3312A18:57BCBF56' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo/contents/MochaTestFile')
            .query({"message":"MochaTestFile%20deletion","sha":"0519ecba6ea913e21689ec692e81e9e4973fbf73","access_token":apiToken})
            .reply(200, {"content":null,"commit":{"sha":"f2408e3e1107d3fdb12ea40533b024ebe1269ce5","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/f2408e3e1107d3fdb12ea40533b024ebe1269ce5","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/f2408e3e1107d3fdb12ea40533b024ebe1269ce5","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:42Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:42Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"MochaTestFile deletion","parents":[{"sha":"e382d87dbbb0eedf244d26f32d2c1b346c90ed36","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/e382d87dbbb0eedf244d26f32d2c1b346c90ed36","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/e382d87dbbb0eedf244d26f32d2c1b346c90ed36"}]}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '989',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4880',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"68f6ccfebee3a4aa4e2d209d470bcd63"',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'c6c65e5196703428e7641f7d1e9bc353',
                'x-github-request-id': '4BA2FBBD:5CCE:54EC909:57BCBF56' });

        nock('http://127.0.0.1:53844', {"encodedQueryParams":true})
            .delete('/api/snippet-detail/MochaTestRepo/MochaTestFile')
            .reply(200, {"content":null,"commit":{"sha":"f2408e3e1107d3fdb12ea40533b024ebe1269ce5","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/f2408e3e1107d3fdb12ea40533b024ebe1269ce5","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/f2408e3e1107d3fdb12ea40533b024ebe1269ce5","author":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:42Z"},"committer":{"name":"pscustomdev-sss","email":"pscustomdev@gmail.com","date":"2016-08-23T21:25:42Z"},"tree":{"sha":"db9072dd04da9576112b263956509df4fc97d727","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees/db9072dd04da9576112b263956509df4fc97d727"},"message":"MochaTestFile deletion","parents":[{"sha":"e382d87dbbb0eedf244d26f32d2c1b346c90ed36","url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits/e382d87dbbb0eedf244d26f32d2c1b346c90ed36","html_url":"https://github.com/sss-storage/MochaTestRepo/commit/e382d87dbbb0eedf244d26f32d2c1b346c90ed36"}]},"meta":{"x-ratelimit-limit":"5000","x-ratelimit-remaining":"4880","x-ratelimit-reset":"1471990250","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","etag":"\"68f6ccfebee3a4aa4e2d209d470bcd63\"","status":"200 OK"}}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '1279',
                etag: 'W/"4ff-LYDbQxJ4ZWBjHggSJ56hnQ"',
                date: 'Tue, 23 Aug 2016 21:25:42 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/contents/')
            .query({"access_token":apiToken})
            .reply(200, [{"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}], { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '794',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4879',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"ec4020307d52b12ac95fe11213709dc9"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:40 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '8166eb1845e56d99ba68a6b1065016c1',
                'x-github-request-id': '4BA2FBBD:5CCD:3312A44:57BCBF56' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(200, {"id":66404542,"name":"MochaTestRepo","full_name":"sss-storage/MochaTestRepo","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/MochaTestRepo","description":"Mocha Description","fork":false,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo","forks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/forks","keys_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/teams","hooks_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/events","assignees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/tags","blobs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/languages","stargazers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/subscription","commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/merges","archive_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/downloads","issues_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/deployments","created_at":"2016-08-23T21:25:40Z","updated_at":"2016-08-23T21:25:40Z","pushed_at":"2016-08-23T21:25:41Z","git_url":"git://github.com/sss-storage/MochaTestRepo.git","ssh_url":"git@github.com:sss-storage/MochaTestRepo.git","clone_url":"https://github.com/sss-storage/MochaTestRepo.git","svn_url":"https://github.com/sss-storage/MochaTestRepo","homepage":null,"size":0,"stargazers_count":0,"watchers_count":0,"language":null,"has_issues":true,"has_downloads":true,"has_wiki":true,"has_pages":false,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","permissions":{"admin":true,"push":true,"pull":true},"organization":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"network_count":0,"subscribers_count":2}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:42 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '5986',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4878',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"86eb64c1990e30fdc11e2996bd80e8b1"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:40 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': 'a30e6f9aa7cf5731b87dfb3b9992202d',
                'x-github-request-id': '4BA2FBBD:5CCE:54EC944:57BCBF56' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/repos/sss-storage/MochaTestRepo/readme')
            .query({"access_token":apiToken})
            .reply(200, {"name":"README.md","path":"README.md","sha":"dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","size":33,"url":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","html_url":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md","git_url":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","download_url":"https://raw.githubusercontent.com/sss-storage/MochaTestRepo/master/README.md","type":"file","content":"IyBNb2NoYSBEaXNwbGF5IE5hbWUKTW9jaGEgUmVhZG1l\n","encoding":"base64","_links":{"self":"https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master","git":"https://api.github.com/repos/sss-storage/MochaTestRepo/git/blobs/dc7bc8e5a2399f3fd49fd7bfe50ce3e31328d49d","html":"https://github.com/sss-storage/MochaTestRepo/blob/master/README.md"}}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:43 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '871',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4877',
                'x-ratelimit-reset': '1471990250',
                'cache-control': 'private, max-age=60, s-maxage=60',
                vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding',
                etag: '"2fcb9fbf2ed93a700a6a042e7f615c73"',
                'last-modified': 'Tue, 23 Aug 2016 21:25:42 GMT',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': '',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-served-by': '173530fed4bbeb1e264b2ed22e8b5c20',
                'x-github-request-id': '4BA2FBBD:5CCE:54EC972:57BCBF56' });

        nock('http://127.0.0.1:53848', {"encodedQueryParams":true})
            .get('/api/snippet-overview/MochaTestRepo')
            .reply(200, {"name":"MochaTestRepo","files":["README.md"],"_id":"MochaTestRepo","description":"Mocha Description","readme":"<h1 id=\"mocha-display-name\">Mocha Display Name</h1>\n<p>Mocha Readme</p>\n","displayName":"Mocha Display Name","owner":"fakeOwner","postedOn":1471987540408,"isOwner":true}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '285',
                etag: 'W/"11d-ydprVuR6i7o85tGM/EnsEQ"',
                date: 'Tue, 23 Aug 2016 21:25:43 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(204, "", { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:25:43 GMT',
                connection: 'close',
                status: '204 No Content',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4876',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'delete_repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': '1e9204dbc0447a6f39c3b3c44d87b3f8',
                'x-github-request-id': '4BA2FBBD:5CCE:54EC993:57BCBF57' });
    }

    function mockDataMarkedHtml() {
        nock('http://127.0.0.1:53894', {"encodedQueryParams":true})
            .put('/api/snippet-detail/MochaTestRepo/readme/format', {"content":"# Title\n## Subtitle"})
            .reply(200, "<h1 id=\"title\">Title</h1>\n<h2 id=\"subtitle\">Subtitle</h2>\n", { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '66',
                etag: 'W/"42-PPDV4iH7QQZQFz+sc2B/mQ"',
                date: 'Tue, 23 Aug 2016 21:29:17 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:29:17 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4873',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCC:6B65A6C:57BCC02D' });
    }

    function mockDataSearch() {
        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .get('/search/code')
            .query({"q":"idm+user%3Asss-storage","access_token":apiToken})
            .reply(200, {"total_count":8,"incomplete_results":false,"items":[{"name":"README.md","path":"/README.md","sha":"fa59e63c514e6a51e36ed715612d4f3e11e6dc8b","url":"https://api.github.com/repositories/49225392/contents//README.md?ref=ecd563b834f9736531aa844cf1b643cefddc3276","git_url":"https://api.github.com/repositories/49225392/git/blobs/fa59e63c514e6a51e36ed715612d4f3e11e6dc8b","html_url":"https://github.com/sss-storage/IDMSearchAndReplace/blob/ecd563b834f9736531aa844cf1b643cefddc3276//README.md","repository":{"id":49225392,"name":"IDMSearchAndReplace","full_name":"sss-storage/IDMSearchAndReplace","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/IDMSearchAndReplace","description":"Search and replace template for xslt used in IDM stylesheets","fork":false,"url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace","forks_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/forks","keys_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/teams","hooks_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/events","assignees_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/tags","blobs_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/languages","stargazers_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscription","commits_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/merges","archive_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/downloads","issues_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/deployments"},"score":2.332882,"text_matches":[{"object_url":"https://api.github.com/repositories/49225392/contents//README.md?ref=ecd563b834f9736531aa844cf1b643cefddc3276","object_type":"FileContent","property":"content","fragment":"# IDMSearchAndReplace\nSearch and replace template for xslt used in IDM stylesheets\n","matches":[{"text":"IDM","indices":[67,70]}]}]},{"name":"README.md","path":"/README.md","sha":"a0b9706c4daa0765a3a8950c9c49fba19d453d7a","url":"https://api.github.com/repositories/52550191/contents//README.md?ref=4ffbfd5e4b98e01a56a17504e1e45642d8f7433e","git_url":"https://api.github.com/repositories/52550191/git/blobs/a0b9706c4daa0765a3a8950c9c49fba19d453d7a","html_url":"https://github.com/sss-storage/IDMPolicyForEach/blob/4ffbfd5e4b98e01a56a17504e1e45642d8f7433e//README.md","repository":{"id":52550191,"name":"IDMPolicyForEach","full_name":"sss-storage/IDMPolicyForEach","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/IDMPolicyForEach","description":"Policy for performing a for-each in an IDM policy","fork":false,"url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach","forks_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/forks","keys_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/teams","hooks_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/events","assignees_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/tags","blobs_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/languages","stargazers_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscription","commits_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/merges","archive_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/downloads","issues_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/deployments"},"score":2.1426237,"text_matches":[{"object_url":"https://api.github.com/repositories/52550191/contents//README.md?ref=4ffbfd5e4b98e01a56a17504e1e45642d8f7433e","object_type":"FileContent","property":"content","fragment":"# IDMPolicyForEach\nPolicy for performing a for-each in an IDM policy\n\n<img src=\"ForEachPolicy.png\"/>\n\n","matches":[{"text":"IDM","indices":[58,61]}]}]},{"name":"README.md","path":"/README.md","sha":"e2d771c72129a20d60ed6cc89c94684a94b8457c","url":"https://api.github.com/repositories/49677144/contents//README.md?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","git_url":"https://api.github.com/repositories/49677144/git/blobs/e2d771c72129a20d60ed6cc89c94684a94b8457c","html_url":"https://github.com/sss-storage/SearchInPolicy/blob/7f0a9cbb225051b1d1d967b4520d82f1de8756be//README.md","repository":{"id":49677144,"name":"SearchInPolicy","full_name":"sss-storage/SearchInPolicy","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/SearchInPolicy","description":"A policy that shows how to search the directory and parse the results","fork":false,"url":"https://api.github.com/repos/sss-storage/SearchInPolicy","forks_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/forks","keys_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/teams","hooks_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/events","assignees_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/tags","blobs_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/languages","stargazers_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/subscription","commits_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/merges","archive_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/downloads","issues_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/deployments"},"score":2.1200209,"text_matches":[{"object_url":"https://api.github.com/repositories/49677144/contents//README.md?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","object_type":"FileContent","property":"content","fragment":"# SearchInPolicy\nAn IDM policy snippet that shows how to search the directory and parse the results.\n","matches":[{"text":"IDM","indices":[20,23]}]}]},{"name":"README.md","path":"/README.md","sha":"1777fe3531b92959cfc3524460281112ae9c4c50","url":"https://api.github.com/repositories/49678444/contents//README.md?ref=7adb035944f69c34a454ce49242358f3812b6fe7","git_url":"https://api.github.com/repositories/49678444/git/blobs/1777fe3531b92959cfc3524460281112ae9c4c50","html_url":"https://github.com/sss-storage/Check-Group-Membership-in-Policy/blob/7adb035944f69c34a454ce49242358f3812b6fe7//README.md","repository":{"id":49678444,"name":"Check-Group-Membership-in-Policy","full_name":"sss-storage/Check-Group-Membership-in-Policy","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/Check-Group-Membership-in-Policy","description":"IDM driver policy to check group membership (or any multi-value attribute)","fork":false,"url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy","forks_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/forks","keys_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/teams","hooks_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/events","assignees_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/tags","blobs_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/languages","stargazers_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/subscription","commits_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/merges","archive_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/downloads","issues_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/deployments"},"score":2.1076393,"text_matches":[{"object_url":"https://api.github.com/repositories/49678444/contents//README.md?ref=7adb035944f69c34a454ce49242358f3812b6fe7","object_type":"FileContent","property":"content","fragment":"# Check-Group-Membership-in-Policy\nIDM driver policy to check group membership (or any multi-value attribute)\n","matches":[{"text":"IDM","indices":[35,38]}]}]},{"name":"README.md","path":"/README.md","sha":"4896401def55fb85632036463a23263cceb10eeb","url":"https://api.github.com/repositories/49676822/contents//README.md?ref=a93229eaa03fa080f4e2ff712dfff0e051bc393f","git_url":"https://api.github.com/repositories/49676822/git/blobs/4896401def55fb85632036463a23263cceb10eeb","html_url":"https://github.com/sss-storage/Strip-CN-from-DN/blob/a93229eaa03fa080f4e2ff712dfff0e051bc393f//README.md","repository":{"id":49676822,"name":"Strip-CN-from-DN","full_name":"sss-storage/Strip-CN-from-DN","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/Strip-CN-from-DN","description":"XSLT template to strip the CN from a DN","fork":false,"url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN","forks_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/forks","keys_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/teams","hooks_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/events","assignees_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/tags","blobs_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/languages","stargazers_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/subscription","commits_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/merges","archive_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/downloads","issues_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/deployments"},"score":1.851959,"text_matches":[{"object_url":"https://api.github.com/repositories/49676822/contents//README.md?ref=a93229eaa03fa080f4e2ff712dfff0e051bc393f","object_type":"FileContent","property":"content","fragment":"# Strip-CN-from-DN\nXSLT template to strip the CN from a DN\nThis is used in an IDM driver ss policy\n","matches":[{"text":"IDM","indices":[78,81]}]}]},{"name":"IDMSearchAndReplace.xsl","path":"/IDMSearchAndReplace.xsl","sha":"e78f50bf9ea421162e4ee528184c2ab45b822c4b","url":"https://api.github.com/repositories/49225392/contents//IDMSearchAndReplace.xsl?ref=ecd563b834f9736531aa844cf1b643cefddc3276","git_url":"https://api.github.com/repositories/49225392/git/blobs/e78f50bf9ea421162e4ee528184c2ab45b822c4b","html_url":"https://github.com/sss-storage/IDMSearchAndReplace/blob/ecd563b834f9736531aa844cf1b643cefddc3276//IDMSearchAndReplace.xsl","repository":{"id":49225392,"name":"IDMSearchAndReplace","full_name":"sss-storage/IDMSearchAndReplace","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/IDMSearchAndReplace","description":"Search and replace template for xslt used in IDM stylesheets","fork":false,"url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace","forks_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/forks","keys_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/teams","hooks_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/events","assignees_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/tags","blobs_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/languages","stargazers_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscription","commits_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/merges","archive_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/downloads","issues_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/deployments"},"score":0.7290256,"text_matches":[{"object_url":"https://api.github.com/repositories/49225392/contents//IDMSearchAndReplace.xsl?ref=ecd563b834f9736531aa844cf1b643cefddc3276","object_type":"FileContent","property":"content","fragment":"  This stylesheet can be used in an existing stylesheet used by and IDM ss policy\n  \n  <xsl","matches":[{"text":"IDM","indices":[68,71]}]}]},{"name":"ForEachInPolicy.txt","path":"/ForEachInPolicy.txt","sha":"16952c756049a67d6c3ec90a0275d7fc97888d20","url":"https://api.github.com/repositories/52550191/contents//ForEachInPolicy.txt?ref=1f1098fcf324a6fa5dbaf9c144e1bb863abc57ee","git_url":"https://api.github.com/repositories/52550191/git/blobs/16952c756049a67d6c3ec90a0275d7fc97888d20","html_url":"https://github.com/sss-storage/IDMPolicyForEach/blob/1f1098fcf324a6fa5dbaf9c144e1bb863abc57ee//ForEachInPolicy.txt","repository":{"id":52550191,"name":"IDMPolicyForEach","full_name":"sss-storage/IDMPolicyForEach","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/IDMPolicyForEach","description":"Policy for performing a for-each in an IDM policy","fork":false,"url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach","forks_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/forks","keys_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/teams","hooks_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/events","assignees_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/tags","blobs_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/languages","stargazers_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscription","commits_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/merges","archive_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/downloads","issues_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/deployments"},"score":0.6121782,"text_matches":[{"object_url":"https://api.github.com/repositories/52550191/contents//ForEachInPolicy.txt?ref=1f1098fcf324a6fa5dbaf9c144e1bb863abc57ee","object_type":"FileContent","property":"content","fragment":" the automatic variable \"current-node\" to access the XML doc.\n\nA challenge with IDM is knowing the","matches":[{"text":"IDM","indices":[80,83]}]}]},{"name":"SearchInPolicy","path":"/SearchInPolicy","sha":"8d809764b3ef8df095cf0c7eafced37feb708bf4","url":"https://api.github.com/repositories/49677144/contents//SearchInPolicy?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","git_url":"https://api.github.com/repositories/49677144/git/blobs/8d809764b3ef8df095cf0c7eafced37feb708bf4","html_url":"https://github.com/sss-storage/SearchInPolicy/blob/7f0a9cbb225051b1d1d967b4520d82f1de8756be//SearchInPolicy","repository":{"id":49677144,"name":"SearchInPolicy","full_name":"sss-storage/SearchInPolicy","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/SearchInPolicy","description":"A policy that shows how to search the directory and parse the results","fork":false,"url":"https://api.github.com/repos/sss-storage/SearchInPolicy","forks_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/forks","keys_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/teams","hooks_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/events","assignees_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/tags","blobs_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/languages","stargazers_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/subscription","commits_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/merges","archive_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/downloads","issues_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/deployments"},"score":0.5300052,"text_matches":[{"object_url":"https://api.github.com/repositories/49677144/contents//SearchInPolicy?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","object_type":"FileContent","property":"content","fragment":" through the results.\nThis uses the query processor automatically passed into the IDM policy.\n\n<rule","matches":[{"text":"IDM","indices":[82,85]}]}]}]}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:30:59 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '43509',
                connection: 'close',
                status: '200 OK',
                'x-ratelimit-limit': '30',
                'x-ratelimit-remaining': '29',
                'x-ratelimit-reset': '1471987919',
                'cache-control': 'no-cache',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                vary: 'Accept-Encoding',
                'x-served-by': 'ef96c2e493b28ffea49b891b085ed2dd',
                'x-github-request-id': '4BA2FBBD:5CCC:6B6A88D:57BCC093' });

        nock('http://127.0.0.1:53916', {"encodedQueryParams":true})
            .get('/api/snippet-search')
            .query({"q":"idm"})
            .reply(200, {"total_count":5,"incomplete_results":false,"items":[{"name":"README.md","path":"/README.md","sha":"fa59e63c514e6a51e36ed715612d4f3e11e6dc8b","url":"https://api.github.com/repositories/49225392/contents//README.md?ref=ecd563b834f9736531aa844cf1b643cefddc3276","git_url":"https://api.github.com/repositories/49225392/git/blobs/fa59e63c514e6a51e36ed715612d4f3e11e6dc8b","html_url":"https://github.com/sss-storage/IDMSearchAndReplace/blob/ecd563b834f9736531aa844cf1b643cefddc3276//README.md","repository":{"id":49225392,"name":"IDMSearchAndReplace","full_name":"sss-storage/IDMSearchAndReplace","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/IDMSearchAndReplace","description":"Search and replace template for xslt used in IDM stylesheets","fork":false,"url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace","forks_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/forks","keys_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/teams","hooks_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/events","assignees_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/tags","blobs_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/languages","stargazers_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/subscription","commits_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/merges","archive_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/downloads","issues_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/IDMSearchAndReplace/deployments","displayName":"IDMSearchAndReplace","postedBy":"unknown","postedOn":"unknown"},"score":2.332882,"text_matches":[{"object_url":"https://api.github.com/repositories/49225392/contents//README.md?ref=ecd563b834f9736531aa844cf1b643cefddc3276","object_type":"FileContent","property":"content","fragment":"# IDMSearchAndReplace\nSearch and replace template for xslt used in IDM stylesheets\n","matches":[{"text":"IDM","indices":[67,70]}]},{"object_url":"https://api.github.com/repositories/49225392/contents//IDMSearchAndReplace.xsl?ref=ecd563b834f9736531aa844cf1b643cefddc3276","object_type":"FileContent","property":"content","fragment":"  This stylesheet can be used in an existing stylesheet used by and IDM ss policy\n  \n  <xsl","matches":[{"text":"IDM","indices":[68,71]}]}]},{"name":"README.md","path":"/README.md","sha":"a0b9706c4daa0765a3a8950c9c49fba19d453d7a","url":"https://api.github.com/repositories/52550191/contents//README.md?ref=4ffbfd5e4b98e01a56a17504e1e45642d8f7433e","git_url":"https://api.github.com/repositories/52550191/git/blobs/a0b9706c4daa0765a3a8950c9c49fba19d453d7a","html_url":"https://github.com/sss-storage/IDMPolicyForEach/blob/4ffbfd5e4b98e01a56a17504e1e45642d8f7433e//README.md","repository":{"id":52550191,"name":"IDMPolicyForEach","full_name":"sss-storage/IDMPolicyForEach","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/IDMPolicyForEach","description":"Policy for performing a for-each in an IDM policy","fork":false,"url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach","forks_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/forks","keys_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/teams","hooks_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/events","assignees_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/tags","blobs_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/languages","stargazers_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/subscription","commits_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/merges","archive_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/downloads","issues_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/IDMPolicyForEach/deployments","displayName":"IDMPolicyForEach","postedBy":"unknown","postedOn":"unknown"},"score":2.1426237,"text_matches":[{"object_url":"https://api.github.com/repositories/52550191/contents//README.md?ref=4ffbfd5e4b98e01a56a17504e1e45642d8f7433e","object_type":"FileContent","property":"content","fragment":"# IDMPolicyForEach\nPolicy for performing a for-each in an IDM policy\n\n<img src=\"ForEachPolicy.png\"/>\n\n","matches":[{"text":"IDM","indices":[58,61]}]},{"object_url":"https://api.github.com/repositories/52550191/contents//ForEachInPolicy.txt?ref=1f1098fcf324a6fa5dbaf9c144e1bb863abc57ee","object_type":"FileContent","property":"content","fragment":" the automatic variable \"current-node\" to access the XML doc.\n\nA challenge with IDM is knowing the","matches":[{"text":"IDM","indices":[80,83]}]}]},{"name":"README.md","path":"/README.md","sha":"e2d771c72129a20d60ed6cc89c94684a94b8457c","url":"https://api.github.com/repositories/49677144/contents//README.md?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","git_url":"https://api.github.com/repositories/49677144/git/blobs/e2d771c72129a20d60ed6cc89c94684a94b8457c","html_url":"https://github.com/sss-storage/SearchInPolicy/blob/7f0a9cbb225051b1d1d967b4520d82f1de8756be//README.md","repository":{"id":49677144,"name":"SearchInPolicy","full_name":"sss-storage/SearchInPolicy","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/SearchInPolicy","description":"A policy that shows how to search the directory and parse the results","fork":false,"url":"https://api.github.com/repos/sss-storage/SearchInPolicy","forks_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/forks","keys_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/teams","hooks_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/events","assignees_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/tags","blobs_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/languages","stargazers_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/subscription","commits_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/merges","archive_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/downloads","issues_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/SearchInPolicy/deployments","displayName":"SearchInPolicy","postedBy":"unknown","postedOn":"unknown"},"score":2.1200209,"text_matches":[{"object_url":"https://api.github.com/repositories/49677144/contents//README.md?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","object_type":"FileContent","property":"content","fragment":"# SearchInPolicy\nAn IDM policy snippet that shows how to search the directory and parse the results.\n","matches":[{"text":"IDM","indices":[20,23]}]},{"object_url":"https://api.github.com/repositories/49677144/contents//SearchInPolicy?ref=7f0a9cbb225051b1d1d967b4520d82f1de8756be","object_type":"FileContent","property":"content","fragment":" through the results.\nThis uses the query processor automatically passed into the IDM policy.\n\n<rule","matches":[{"text":"IDM","indices":[82,85]}]}]},{"name":"README.md","path":"/README.md","sha":"1777fe3531b92959cfc3524460281112ae9c4c50","url":"https://api.github.com/repositories/49678444/contents//README.md?ref=7adb035944f69c34a454ce49242358f3812b6fe7","git_url":"https://api.github.com/repositories/49678444/git/blobs/1777fe3531b92959cfc3524460281112ae9c4c50","html_url":"https://github.com/sss-storage/Check-Group-Membership-in-Policy/blob/7adb035944f69c34a454ce49242358f3812b6fe7//README.md","repository":{"id":49678444,"name":"Check-Group-Membership-in-Policy","full_name":"sss-storage/Check-Group-Membership-in-Policy","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/Check-Group-Membership-in-Policy","description":"IDM driver policy to check group membership (or any multi-value attribute)","fork":false,"url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy","forks_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/forks","keys_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/teams","hooks_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/events","assignees_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/tags","blobs_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/languages","stargazers_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/subscription","commits_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/merges","archive_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/downloads","issues_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/Check-Group-Membership-in-Policy/deployments","displayName":"Check-Group-Membership-in-Policy","postedBy":"unknown","postedOn":"unknown"},"score":2.1076393,"text_matches":[{"object_url":"https://api.github.com/repositories/49678444/contents//README.md?ref=7adb035944f69c34a454ce49242358f3812b6fe7","object_type":"FileContent","property":"content","fragment":"# Check-Group-Membership-in-Policy\nIDM driver policy to check group membership (or any multi-value attribute)\n","matches":[{"text":"IDM","indices":[35,38]}]}]},{"name":"README.md","path":"/README.md","sha":"4896401def55fb85632036463a23263cceb10eeb","url":"https://api.github.com/repositories/49676822/contents//README.md?ref=a93229eaa03fa080f4e2ff712dfff0e051bc393f","git_url":"https://api.github.com/repositories/49676822/git/blobs/4896401def55fb85632036463a23263cceb10eeb","html_url":"https://github.com/sss-storage/Strip-CN-from-DN/blob/a93229eaa03fa080f4e2ff712dfff0e051bc393f//README.md","repository":{"id":49676822,"name":"Strip-CN-from-DN","full_name":"sss-storage/Strip-CN-from-DN","owner":{"login":"sss-storage","id":13575366,"avatar_url":"https://avatars.githubusercontent.com/u/13575366?v=3","gravatar_id":"","url":"https://api.github.com/users/sss-storage","html_url":"https://github.com/sss-storage","followers_url":"https://api.github.com/users/sss-storage/followers","following_url":"https://api.github.com/users/sss-storage/following{/other_user}","gists_url":"https://api.github.com/users/sss-storage/gists{/gist_id}","starred_url":"https://api.github.com/users/sss-storage/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/sss-storage/subscriptions","organizations_url":"https://api.github.com/users/sss-storage/orgs","repos_url":"https://api.github.com/users/sss-storage/repos","events_url":"https://api.github.com/users/sss-storage/events{/privacy}","received_events_url":"https://api.github.com/users/sss-storage/received_events","type":"Organization","site_admin":false},"private":false,"html_url":"https://github.com/sss-storage/Strip-CN-from-DN","description":"XSLT template to strip the CN from a DN","fork":false,"url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN","forks_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/forks","keys_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/keys{/key_id}","collaborators_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/teams","hooks_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/hooks","issue_events_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues/events{/number}","events_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/events","assignees_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/assignees{/user}","branches_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/branches{/branch}","tags_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/tags","blobs_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/refs{/sha}","trees_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/trees{/sha}","statuses_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/statuses/{sha}","languages_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/languages","stargazers_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/stargazers","contributors_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/contributors","subscribers_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/subscribers","subscription_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/subscription","commits_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/commits{/sha}","git_commits_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/git/commits{/sha}","comments_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/comments{/number}","issue_comment_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues/comments{/number}","contents_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/contents/{+path}","compare_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/compare/{base}...{head}","merges_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/merges","archive_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/downloads","issues_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/issues{/number}","pulls_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/pulls{/number}","milestones_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/milestones{/number}","notifications_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/labels{/name}","releases_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/releases{/id}","deployments_url":"https://api.github.com/repos/sss-storage/Strip-CN-from-DN/deployments","displayName":"Strip-CN-from-DN","postedBy":"unknown","postedOn":"unknown"},"score":1.851959,"text_matches":[{"object_url":"https://api.github.com/repositories/49676822/contents//README.md?ref=a93229eaa03fa080f4e2ff712dfff0e051bc393f","object_type":"FileContent","property":"content","fragment":"# Strip-CN-from-DN\nXSLT template to strip the CN from a DN\nThis is used in an IDM driver ss policy\n","matches":[{"text":"IDM","indices":[78,81]}]}]}],"meta":{"x-ratelimit-limit":"30","x-ratelimit-remaining":"29","x-ratelimit-reset":"1471987919","x-oauth-scopes":"admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user","status":"200 OK"}}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '29025',
                etag: 'W/"7161-9vQcBzJtmHysSLnE4rxW3w"',
                date: 'Tue, 23 Aug 2016 21:31:00 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:31:00 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4870',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CC8:1B73336:57BCC094' });
    }

    function mockDataGetAuthenticatedUser() {
        nock('http://127.0.0.1:53937', {"encodedQueryParams":true})
            .get('/api/authenticated-user')
            .reply(200, {"username":"fakeOwner"}, { 'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '24',
                etag: 'W/"18-4mStyiO7Q9B7Zg5X9nSdJg"',
                date: 'Tue, 23 Aug 2016 21:32:56 GMT',
                connection: 'close' });

        nock('https://api.github.com:443', {"encodedQueryParams":true})
            .delete('/repos/sss-storage/MochaTestRepo')
            .query({"access_token":apiToken})
            .reply(404, {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}, { server: 'GitHub.com',
                date: 'Tue, 23 Aug 2016 21:32:56 GMT',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '77',
                connection: 'close',
                status: '404 Not Found',
                'x-ratelimit-limit': '5000',
                'x-ratelimit-remaining': '4867',
                'x-ratelimit-reset': '1471990250',
                'x-oauth-scopes': 'admin:org, admin:org_hook, admin:public_key, admin:repo_hook, delete_repo, gist, notifications, repo, user',
                'x-accepted-oauth-scopes': 'repo',
                'x-github-media-type': 'github.v3; param=text-match; format=json',
                'access-control-expose-headers': 'ETag, Link, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
                'access-control-allow-origin': '*',
                'content-security-policy': 'default-src \'none\'',
                'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'deny',
                'x-xss-protection': '1; mode=block',
                'x-github-request-id': '4BA2FBBD:5CCC:6B70215:57BCC108' });
    }

});