'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: '(REST api-spec') ****");

var gh = require('../../db/github-dao');
var db = require('../../db/mongo-dao');

var chaiHttp = require('chai-http');
var app = require('../../app');
var chai = require("chai");
var expect = require("chai").expect;
var should = require("chai").should();

chai.use(chaiHttp);

describe("REST API Tests", function() {

    var fakeSnippetId = "MochaTestRepo";
    var fakeSnippetDesc = "Mocha Description";
    var fakeSnippet = {_id: fakeSnippetId, description: fakeSnippetDesc};

    beforeEach(function(done) {
        //cleanup fake repo
        gh.deleteRepo(fakeSnippetId, function (err, result) {
            db.removeSnippet(fakeSnippetId, function (err, result) {
                done();
            });
        });
    }, 5000);

    afterEach(function(done) {
        gh.deleteRepo(fakeSnippetId, function (err, result) {
            db.removeSnippet(fakeSnippetId, function (err, result) {
                done();
            });
        });
    }, 5000);


    it('should get a list of all snippets on /snippets GET', function(done) {
        chai.request(app)
            .get('/api/snippets')
            .end(function(err, res){
                console.log("res: " + res);
                expect(res.status).to.eql(200);
                expect(res.data).isArray;
                done();
            });
    });

    it('should create a snippet on /snippet POST', function(done) {
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
                    .put('/api/snippet')
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

    xit('should add a repo file on /snippet-detail/:snippetId/:fileName POST', function(done) {
        //
        //// add a repo file
        //api_routes.post('/api/snippet-detail/:snippetId/:fileName', textParser,
        //    function (req, res) {
        //        // base64 encode content
        //        var content = new Buffer(req.body.content ? req.body.content : " ").toString('base64');
        //        github.addRepoFile(req.params.snippetId, req.params.fileName, content, function (err, content) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error creating file: ' + err.message});
        //            }
        //            res.json({});
        //        });
        //    }
        //);
    });

    xit('should upload and add a repo file on /snippet-detail/:snippetId POST', function(done) {
        //
        //// upload and add a repo file
        //api_routes.post('/api/snippet-detail/:snippetId',
        //    function (req, res) {
        //        var snippetId = req.params.snippetId;
        //        req.pipe(req.busboy);
        //        req.busboy.on('file', function(fieldname, file, filename) {
        //            var filesize = Number(req.headers['content-length']) * 2;
        //            var content = new Uint8Array(filesize);
        //            var offset = 0;
        //            var cnt = 0;
        //            // read data from file in buffers
        //            file.on('data', function(data) {
        //                // only process the even number packets
        //                // I don't know why the data is sent this way from angular-file-upload
        //                if (cnt == 0 || cnt % 2 == 0) {
        //                    content.set(data, offset);
        //                    offset += data.length;
        //                }
        //                cnt++;
        //            });
        //            // once file read is complete, add the file to the snippet
        //            file.on('end', function() {
        //                content = content.slice(0, offset);
        //                // base64 encode file data
        //                content = new Buffer(content).toString('base64');
        //                github.addRepoFile(req.params.snippetId, filename, content, function (err, content) {
        //                    if (err) {
        //                        return res.status(500).json({error: 'Error creating file: ' + err.message});
        //                    }
        //                    res.json({});
        //                });
        //            });
        //        });
        //    }
        //);
    });

    xit('should update contents of a repo file on /snippet-detail/:snippetId/:fileName PUT', function(done) {
        //
        //// update contents of a repo file
        //api_routes.put('/api/snippet-detail/:snippetId/:fileName', textParser,
        //    function (req, res) {
        //        // base64 encode content
        //        var content = new Buffer(req.body.content).toString('base64');
        //        github.updateRepoFile(req.params.snippetId, req.params.fileName, content, function (err, content) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error updating file: ' + err.message});
        //            }
        //            res.json({});
        //        });
        //    }
        //);
    });

    xit('should get contents of a repo file on /snippet-detail/:snippetId/:fileName GET', function(done) {
        //// get contents of a repo file
        //api_routes.get('/api/snippet-detail/:snippetId/:fileName',
        //    function (req, res) {
        //        github.getRepoFile(req.params.snippetId, req.params.fileName, function (err, content) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error retrieving file: ' + err.message});
        //            }
        //            res.json(content);
        //        });
        //    }
        //);
    });

    xit('should delete a repo file on /snippet-detail/:snippetId/:fileName DELETE', function(done) {

        //// delete a repo file
        //api_routes.delete('/api/snippet-detail/:snippetId/:fileName',
        //    function (req, res) {
        //        github.deleteRepoFile(req.params.snippetId, req.params.fileName, function (err, content) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error deleting file: ' + err.message});
        //            }
        //            res.json(content);
        //        });
        //    }
        //);
    });

    it('should search all snippets and return result on /snippet-search with searchTerms = req.query.q GET', function(done) {
        chai.request(app)
            //create the initial snippet
            //TODO not have a hardcoded string relying on current repository data
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

    xit('should get commits from a snippet on /snippet-search/:repoOwner/:repoName GET', function(done) {
        //api_routes.get('/api/snippet-search/:repoOwner/:repoName',
        //    function (req, res) {
        //        github.getCommits(req.params.repoOwner, req.params.repoName, function (err, commits) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error getting commits: ' + err.message});
        //            }
        //            res.json(commits);
        //        });
        //    }
        //);
    });

    it('should return the authenticated user /authenticated-user GET', function(done) {
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