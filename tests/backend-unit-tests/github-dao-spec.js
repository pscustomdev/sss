'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'github-dao-spec') ****");

var gh = require('../../db/github-dao');
var expect = require("chai").expect;

describe("GitHub Dao", function() {

    var fakeSnippetId = "MochaTestRepo";
    var fakeSnippet = {_id: fakeSnippetId, description: "Mocha Description"};

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
    
    var repoName = "";
    it('should get all repos for user', function (done) {
        gh.getRepos(function(err, repos){
            if (repos instanceof Array && repos.length > 0) {
                repoName = repos[0];
            }
            expect(repos).isArray;
            //expect(repos).toBeTruthy();
            done();
        });
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
        //TODO make this test independent of what's existing in the repos
        var searchTerms = "idm";
        gh.searchCode(searchTerms, function(err, results){
            expect(results.items[0].name).to.eql("README.md");
            done();
        });
    });

    it('should get the commits of a repo', function (done) {
        var repoOwner = "sss-storage";
        gh.createRepo(fakeSnippet, function (err, result) {
            gh.getCommits(repoOwner, fakeSnippetId, function (err, results) {
                expect(results).isArray;
                expect(results[0].author.login).to.be.eql("pscustomdev-sss");
                done();
            });
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

   

    xit('should add a file to the repo', function (done) {
        //
        //exports.addRepoFile = function (repoName, fileName, content, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: repoName,
        //        path: fileName,
        //        message: fileName + " creation",
        //        content: content
        //    };
        //
        //    github.repos.createFile(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //        next(err, resultData);
        //    });
        //};
    });

    xit('should update a file in the repo', function (done) {
        //exports.updateRepoFile = function (repoName, fileName, content, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: repoName,
        //        path: fileName,
        //        message: fileName + " update",
        //        content: content
        //    };
        //
        //    exports.getRepoFileSha(repoName, fileName, function (err, sha) {
        //        if (err) {
        //            return next(err);
        //        }
        //        msg.sha = sha;
        //
        //        github.repos.updateFile(msg, function (err, resultData) {
        //            if (err) {
        //                return next(err);
        //            }
        //            next(err, resultData);
        //        });
        //    });
        //};
    });

    xit('should delete a file from the repo', function (done) {
        //exports.deleteRepoFile = function (repoName, fileName, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: repoName,
        //        path: fileName,
        //        message: fileName + " deletion"
        //    };
        //
        //    exports.getRepoFileSha(repoName, fileName, function (err, sha) {
        //        if (err) {
        //            return next(err);
        //        }
        //        msg.sha = sha;
        //
        //        github.repos.deleteFile(msg, function (err, resultData) {
        //            if (err) {
        //                return next(err);
        //            }
        //            next(err, resultData);
        //        });
        //    });
        //};
    });

// get the contents of a specific repo file
    xit('should get the contents of a file in the repo', function (done) {
        //exports.getRepoFile = function (repoName, fileName, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: repoName,
        //        path: fileName
        //    };
        //
        //    github.repos.getContent(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //        console.log("getRepoFile: " + JSON.stringify(resultData));
        //        var retData = "";
        //        try {
        //            if (resultData) {
        //                var isBinary = false;
        //
        //                // check for known binary files
        //                var filename = resultData.name.toLowerCase();
        //                if (filename.endsWith("png") ||
        //                    filename.endsWith("gif") ||
        //                    filename.endsWith("jpg") ||
        //                    filename.endsWith("jpeg") ||
        //                    filename.endsWith("bmp")
        //                ) {
        //                    isBinary = true;
        //                }
        //
        //                // if b contains binary content, return downloadUrl instead of the data
        //                if (isBinary) {
        //                    retData = resultData.download_url;
        //                } else {
        //                    // base64 decode the data in resultData.content
        //                    var b = new Buffer(resultData.content, 'base64');
        //                    retData = b.toString();
        //                }
        //            }
        //        } catch (ignore) {
        //        }
        //        //console.log(retData);
        //        next(err, retData);
        //    });
        //};
    });


    xit('should get the sha blob of a specific repo file', function (done) {
        // get the sha blob of a specific repo file
        // this is required to update or delete a file
        //exports.getRepoFileSha = function (repoName, fileName, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: repoName,
        //        path: fileName
        //    };
        //
        //    github.repos.getContent(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //        console.log("getRepoFileSha: " + JSON.stringify(resultData));
        //        var retData = "";
        //        try {
        //            if (resultData) {
        //                retData = resultData.sha;
        //            }
        //        } catch (ignore) {
        //        }
        //        next(err, retData);
        //    });
        //};
    });

});
