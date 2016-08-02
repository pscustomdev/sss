'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'github-dao-spec') ****");

var gh = require('../../db/github-dao');
var expect = require("chai").expect;

describe("GitHub Dao", function() {
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
        var repoName = 'IDMPolicyForEach';
        gh.getRepo(repoName, function(err, repo){
            expect(repo.name).to.eql(repoName);
            done();
        });
    });

    it('should get search results from code', function (done) {
        gh.searchCode("This is a new file for testing", function(err, repos){
            expect(repos).isArray;
            //expect(repos).toBeTruthy();
            done();
        });
    });

    it('should get contents of a single repo', function (done) {
        gh.getRepoContents(repoName, function(err, files){
            expect(files).isArray;
            done();
        });
    });

    xit('should get search the repos and return some results', function (done) {
        //exports.searchCode = function (s, next) {
        //    var searchCriteria = {};
        //    searchCriteria.q = s + "+user:sss-storage";
        //    console.log("searchCriteria:" + JSON.stringify(searchCriteria));
        //
        //    //This will search the name, desc and README
        //    //https://github.com/search?utf8=%E2%9C%93&q=test&type=Repositories&ref=advsearch&l=&l=
        //    github.search.code(searchCriteria, function (err, resultData) {
        //        console.log("search.code: " + JSON.stringify(resultData));
        //        if (err) {
        //            console.log("Error:" + err.message);
        //        }
        //        next(err, resultData);
        //    });
        //};
    });

    xit('should get the commits of a repo', function (done) {
        //exports.getCommits = function (repoOwner, repoName, next) {
        //    var msg = {user: repoOwner, repo: repoName};
        //    console.log("getCommits:" + JSON.stringify(msg));
        //
        //    github.repos.getCommits(msg, function (err, resultData) {
        //        //console.log("resultData:" + JSON.stringify(resultData));
        //        next(err, resultData);
        //    });
        //};
    });
    xit('should get the readme of a repo', function (done) {
        //exports.getReadme = function (repoName, next) {
        //    var msg = {user: "sss-storage", repo: repoName};
        //
        //    github.repos.getReadme(msg, function (err, resultData) {
        //        //console.log("getReadme:" + JSON.stringify(resultData));
        //        next(err, resultData);
        //    });
        //};
    });

    xit('should get the contents of a repo', function (done) {
        // retrieve the repo contents (list of files)
        // return object:
        // {
        //   name: reponame
        //   files: [ file1, file2, ... ]
        // }
        //exports.getRepoContents = function (repoName, next) {
        //    var msg = {user: "sss-storage", repo: repoName, path: ''};
        //    var retData = {};
        //    retData.name = repoName;
        //    retData.files = [];
        //    github.repos.getContent(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //        //console.log("getRepoContents: " + JSON.stringify(resultData));
        //        try {
        //            for (var idx in resultData) {
        //                // only interested in numeric idx values
        //                if (Number(idx) > -1) {
        //                    retData.files.push(resultData[idx].name);
        //                }
        //            }
        //        } catch (ignore) {
        //        }
        //        //console.log(JSON.stringify(retData));
        //        next(err, retData);
        //    });
        //};
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

    xit('should create a repo', function (done) {
        //exports.createRepo = function (snippet, next) {
        //    var msg = {
        //        org: "sss-storage",
        //        name: snippet._id,
        //        description: snippet.description,
        //        auto_init: false
        //    };
        //
        //    github.repos.createFromOrg(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //
        //        // create readme and add to repo
        //        var readmeContent = "# " + snippet.displayName + "\n" + snippet.readme;
        //        // base64 encode data from readmeContent
        //        readmeContent = new Buffer(readmeContent).toString('base64');
        //        exports.addRepoFile(snippet._id, "README.md", readmeContent, function (err, resultData) {
        //            if (err) {
        //                return next(err);
        //            }
        //            next(err, resultData);
        //        });
        //    });
        //};
    });

    xit('should update a repo', function (done) {
        //exports.updateRepo = function (snippet, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: snippet._id,
        //        name: snippet._id,
        //        description: snippet.description
        //    };
        //
        //    github.repos.update(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //        next(err, resultData);
        //    });
        //};
    });

    xit('should delete a repo', function (done) {
        //exports.deleteRepo = function (snippetId, next) {
        //    var msg = {
        //        user: "sss-storage",
        //        repo: snippetId
        //    };
        //
        //    github.repos.delete(msg, function (err, resultData) {
        //        if (err) {
        //            return next(err);
        //        }
        //        next(err, resultData);
        //    });
        //};
    });


});
