'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'github-dao-spec') ****");

var gh = require('../../db/github-dao');
var expect = require("chai").expect;

describe("GitHub Dao", function() {

    var fakeSnippetId = "MochaTestRepo";
    var fakeSnippetDesc = "Mocha Description";
    var fakeSnippetDisplayName = "Mocha Display Name";
    var fakeSnippetReadme = "Mocha Readme";
    var fakeSnippet = {_id: fakeSnippetId, description: fakeSnippetDesc, displayName: fakeSnippetDisplayName, readme: fakeSnippetReadme};
    var fakeFileName = "MochaTestFile";

    beforeEach(function(done) {
        //cleanup fake repo
        gh.deleteRepo(fakeSnippetId, function (err, result) {
            //if (err) console.log(err);
            done();
        });
    }, 5000);

    afterEach(function(done) {
        gh.deleteRepo(fakeSnippetId, function (err, result) {
            //if (err) console.log(err);
            done();
        });
    }, 5000);


    it('should create a repo and then delete it', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            expect(result).isObject;
            expect(result.content.name = "README.md");
            expect(result.content.url = "https://api.github.com/repos/sss-storage/MochaTestRepo/contents/README.md?ref=master");
            gh.deleteRepo(fakeSnippetId, function (err, result) {
                expect(result).isObject;
                expect(result.meta).isObject;
                expect(result.meta.status).to.be.eql("204 No Content");
                done();
            });
        });
    });


    it('should update a repo', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            fakeSnippet.description = "blah";
            gh.updateRepo(fakeSnippet, function (err, result) {
                expect(result).isObject;
                expect(result.description).to.be.eql("blah");
                gh.deleteRepo(fakeSnippetId, function (err, result) {
                    expect(result).isObject;
                    expect(result.meta).isObject;
                    expect(result.meta.status).to.be.eql("204 No Content");
                    done();
                });
            });
        });
    });

    it('should get all repos for user', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            console.log("err: " + JSON.stringify(err));
            console.log("result: " + JSON.stringify(result));
            gh.getRepos(function (err, repos) {
                console.log("err: " + JSON.stringify(err));
                console.log("repos:" + JSON.stringify(repos));
                expect(repos).isArray;
                expect(repos).to.include(fakeSnippetId);
                done();
            });
        })
    });

    it('should get data on a specific repo', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            gh.getRepo(fakeSnippetId, function (err, repo) {
                expect(repo.name).to.eql(fakeSnippetId);
                done();
            });
        })
    });

    it('should get contents of a single repo', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            gh.getRepoContents(fakeSnippetId, function (err, result) {
                expect(result).isObject;
                expect(result.files).isArray;
                expect(result.name).to.be.eql(fakeSnippetId);
                done();
            });
        });
    });

    it('should search the repos and return some results', function (done) {
        // use a search term for existing snippets since creating a new snippet
        // is not immediately searchable
        var searchTerm = "idm";
        gh.searchCode(searchTerm, function(err, results){
            expect(results.items[0].name).to.eql("README.md");
            done();
        });
    });

    it('should get the readme of a repo', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            gh.getReadme(fakeSnippetId, function (err, results) {
                expect(results).isArray;
                expect(results.name).to.eql("README.md");
                done();
            });
        });
    });

    it('should get the contents of a repo', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            gh.getRepoContents(fakeSnippetId, function (err, results) {
                expect(results).isObject;
                expect(results.files).isArray;
                expect(results.name).to.eql(fakeSnippetId);
                done();
            });
        });
    });

    it('should add a file to the repo', function (done) {
        var fileContent = "Mocha file content";
        gh.createRepo(fakeSnippet, function (err, result) {
            // base64 encode content
            var content = new Buffer(fileContent).toString('base64');
            gh.addRepoFile(fakeSnippetId, fakeFileName, content, function (err, result) {
                gh.getRepoContents(fakeSnippetId, function (err, results) {
                    expect(results).isObject;
                    expect(results.files).isArray;
                    expect(results.files).to.include(fakeFileName);
                    done();
                });
            });
        });
    });

    it('should update a file in the repo', function (done) {
        var fileContentOriginal = "Mocha file content";
        var fileContentUpdated = "Mocha file content updated";
        gh.createRepo(fakeSnippet, function (err, result) {
            // base64 encode content
            var contentOriginal = new Buffer(fileContentOriginal).toString('base64');
            var contentUpdated = new Buffer(fileContentUpdated).toString('base64');
            gh.addRepoFile(fakeSnippetId, fakeFileName, contentOriginal, function (err, result) {
                gh.updateRepoFile(fakeSnippetId, fakeFileName, contentUpdated, function (err, result) {
                    gh.getRepoFile(fakeSnippetId, fakeFileName, function (err, result) {
                        expect(result).to.eql(fileContentUpdated);
                        done();
                    });
                });
            });
        });
    });

    it('should delete a file from the repo', function (done) {
        var fileContent = "Mocha file content";
        gh.createRepo(fakeSnippet, function (err, result) {
            // base64 encode content
            var content = new Buffer(fileContent).toString('base64');
            gh.addRepoFile(fakeSnippetId, fakeFileName, content, function (err, result) {
                gh.getRepoContents(fakeSnippetId, function (err, results) {
                    expect(results.files).isArray;
                    expect(results.files).to.include(fakeFileName);
                    gh.deleteRepoFile(fakeSnippetId, fakeFileName, function (err, result) {
                        gh.getRepoContents(fakeSnippetId, function (err, results) {
                            expect(results.files).isArray;
                            expect(results.files).to.not.include(fakeFileName);
                            done();
                        });
                    });
                });
            });
        });
    });

    // get the contents of a specific repo file
    it('should get the contents of a file in the repo', function (done) {
        gh.createRepo(fakeSnippet, function (err, result) {
            gh.getRepoFile(fakeSnippetId, "README.md", function (err, result) {
                expect(result).to.have.string(fakeSnippetReadme);
                done();
            });
        });
    });

    it('should get the sha blob of a specific repo file', function (done) {
        var fileContent = "Mocha file content";
        gh.createRepo(fakeSnippet, function (err, result) {
            // base64 encode content
            var content = new Buffer(fileContent).toString('base64');
            gh.addRepoFile(fakeSnippetId, fakeFileName, content, function (err, result) {
                gh.getRepoFileSha(fakeSnippetId, fakeFileName, function(err, result) {
                    // the sha value is 40 chars in length
                    expect(result).to.have.lengthOf(40);
                    done();
                });
            });
        });
    });
});
