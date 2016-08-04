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
    var fakeSnippet = {_id: fakeSnippetId, description: "Mocha Description"};

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

    xit('should get data required for the snippet overview on /snippet-overview GET', function(done) {
        //
        //// get data required for the snippet overview
        //// * specific snippet data (id, description)
        //// * list of files
        //// * readme contents
        //// * db data such as owner and display name
        //api_routes.get('/api/snippet-overview/:snippetId',
        //    function (req, res) {
        //        var retObj = {};
        //        db.getSnippet(req.params.snippetId, function (err, contents) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
        //            }
        //            retObj = contents;
        //            github.getRepoContents(req.params.snippetId, function (err, contents) {
        //                if (err) {
        //                    return res.status(500).json({error: 'Error retrieving repository contents: ' + err.message});
        //                }
        //                retObj = contents;
        //
        //                //sort contents.files with README.md at the top of the list
        //                var readMeIdx = retObj.files.indexOf("README.md");
        //                if (readMeIdx > -1) {
        //                    // preface with a space so it will sort at the top
        //                    retObj.files[readMeIdx] = " README.md";
        //                }
        //                // sort - ignore case
        //                retObj.files.sort(function(a,b) {
        //                    return a.toLowerCase().localeCompare(b.toLowerCase());
        //                });
        //                if (readMeIdx > -1) {
        //                    // strip the leading space
        //                    retObj.files[0] = "README.md";
        //                }
        //
        //                retObj._id = req.params.snippetId;
        //                // get the description
        //                github.getRepo(req.params.snippetId, function (err, repo) {
        //                    if (err) {
        //                        return res.status(500).json({error: 'Error retrieving repository: ' + err.message});
        //                    }
        //                    retObj.description = repo.description;
        //
        //                    // get the readme
        //                    github.getReadme(req.params.snippetId, function (err, readmeobj) {
        //                        if (err) {
        //                            return res.status(500).json({error: 'Error retrieving repository readme: ' + err.message});
        //                        }
        //                        var b = new Buffer(readmeobj.content, 'base64').toString();
        //                        // replace < in readme so any sample html content in the readme will render properly
        //                        b = b.replace(/</g, "&lt;");
        //                        // replace <img src="image.jpg"> with a full path to the image on github
        //                        var imgUrlPrefix = "https://raw.githubusercontent.com/sss-storage/"+req.params.snippetId+"/master/";
        //                        b = b.replace(/&lt;img src=\"/g,"<img src=\"" + imgUrlPrefix);
        //                        retObj.readme = marked(b);
        //
        //                        // get display name from database
        //                        db.getSnippet(req.params.snippetId, function (err, repo) {
        //                            if (err) {
        //                                return res.status(500).json({error: 'Error retrieving repository from database: ' + err.message});
        //                            }
        //                            retObj.displayName = repo ? repo.displayName : req.params.snippetId;
        //                            retObj.owner = repo ? repo.owner : "unknown";
        //
        //                            res.json(retObj);
        //                        });
        //
        //                    });
        //                });
        //            });
        //        });
        //    }
        //);
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

    xit('should search all snippets and return result data on /snippet-search GET', function(done) {
        //// search all snippets and return result data
        //api_routes.get('/api/snippet-search',
        //    function (req, res) {
        //        var searchTerms = req.query.q;
        //        console.log("searchTerm: " + searchTerms);
        //        github.searchCode(searchTerms, function (err, repos) {
        //            if (err) {
        //                return res.status(500).json({error: 'Error searching: ' + err.message});
        //            }
        //            // get display name from the database for each hit
        //            // this pattern is helpful if you need to make async calls within a loop
        //            // but you cannot return until all async calls have completed
        //            var numItems = repos.items.length;
        //            var ctr = 0;
        //            if (numItems == 0) {
        //                return res.json({});
        //            }
        //            for(var i in repos.items) {
        //                (function(idx) {
        //                    var repoId = repos.items[idx].repository.name;
        //                    db.getSnippet(repoId, function (err, repo) {
        //                        if (err) {
        //                            return res.status(500).json({error: 'Error retrieving repository from database'});
        //                        }
        //                        repos.items[idx].repository.displayName = repo ? repo.displayName : repoId;
        //                        repos.items[idx].repository.postedBy = repo ? repo.owner : "unknown";
        //                        repos.items[idx].repository.postedOn = repo ? repo.postedOn : "unknown";
        //                        // do not return from the function until the last db call has returned
        //                        if (ctr == numItems - 1) {
        //                            res.json(repos);
        //                        }
        //                        ctr++;
        //                    });
        //                })(i);
        //            }
        //        });
        //    }
        //);
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

    xit('should return the authenticated user /authenticated-user GET', function(done) {
        //
        //api_routes.get('/api/authenticated-user',
        //    function (req, res) {
        //        return res.send(req.user);
        //    }
        //);
    });
});