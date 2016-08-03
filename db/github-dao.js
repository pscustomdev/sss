var auth_config = require('../auth/auth-conf');
var GitHubApi = require('github');
var _ = require('underscore');

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: false,
    protocol: "https",
    host: "api.github.com",
    pathPrefix: "", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
        'user-agent': 'SoftwareSnippetSearch', // GitHub is happy with a unique user agent
        'Accept': 'application/vnd.github.v3.text-match+json'
    }
});

github.authenticate({
    type: "oauth",
    token: auth_config.github_api.token
});

// get all repos for the user
exports.getRepos = function (next) {
    github.repos.getAll({}, function (err, repos) {
        if (err) {
            console.log(err);
            return next(err);
        }
        var subRepos = _.pluck(repos, 'name');
        //console.log(JSON.stringify(subRepos));
        next(err, subRepos);
    });
};

// get data on a specific repo
exports.getRepo = function (repoName, next) {
    var msg = {user: "sss-storage", repo: repoName};
    github.repos.get(msg, function (err, repo) {
        if (err) {
            console.log(err);
            return next(err);
        }
        //console.log("getRepo: " + JSON.stringify(repo));
        next(err, repo);
    });
};

// ToDo: change to look in all of GitHub for the results, rather than just the sss-storage user
exports.searchCode = function (s, next) {
    var searchCriteria = {};
    searchCriteria.q = s + "+user:sss-storage";
    //This will search the name, desc and README
    //https://github.com/search?utf8=%E2%9C%93&q=test&type=Repositories&ref=advsearch&l=&l=
    github.search.code(searchCriteria, function (err, resultData) {
        if (err) {
            console.log("Error:" + err.message);
        }
        next(err, resultData);
    });
};

exports.getCommits = function (repoOwner, repoName, next) {
    var msg = {user: repoOwner, repo: repoName};

    github.repos.getCommits(msg, function (err, resultData) {
        //console.log("resultData:" + JSON.stringify(resultData));
        next(err, resultData);
    });
};

// get the readme file for a repo
exports.getReadme = function (repoName, next) {
    var msg = {user: "sss-storage", repo: repoName};

    github.repos.getReadme(msg, function (err, resultData) {
        //console.log("getReadme:" + JSON.stringify(resultData));
        next(err, resultData);
    });
};

// retrieve the repo contents (list of files)
// return object:
// {
//   name: reponame
//   files: [ file1, file2, ... ]
// }
exports.getRepoContents = function (repoName, next) {
    var msg = {user: "sss-storage", repo: repoName, path: ''};
    var retData = {};
    retData.name = repoName;
    retData.files = [];
    github.repos.getContent(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        //console.log("getRepoContents: " + JSON.stringify(resultData));
        try {
            for (var idx in resultData) {
                // only interested in numeric idx values
                if (Number(idx) > -1) {
                    retData.files.push(resultData[idx].name);
                }
            }
        } catch (ignore) {
        }
        //console.log(JSON.stringify(retData));
        next(err, retData);
    });
};

exports.addRepoFile = function (repoName, fileName, content, next) {
    var msg = {
        user: "sss-storage",
        repo: repoName,
        path: fileName,
        message: fileName + " creation",
        content: content
    };

    github.repos.createFile(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        next(err, resultData);
    });
};

exports.updateRepoFile = function (repoName, fileName, content, next) {
    var msg = {
        user: "sss-storage",
        repo: repoName,
        path: fileName,
        message: fileName + " update",
        content: content
    };

    exports.getRepoFileSha(repoName, fileName, function(err, sha) {
        if (err) {
            return next(err);
        }
        msg.sha = sha;

        github.repos.updateFile(msg, function (err, resultData) {
            if (err) {
                return next(err);
            }
            next(err, resultData);
        });
    });
};

exports.deleteRepoFile = function (repoName, fileName, next) {
    var msg = {
        user: "sss-storage",
        repo: repoName,
        path: fileName,
        message: fileName + " deletion"
    };

    exports.getRepoFileSha(repoName, fileName, function(err, sha) {
        if (err) {
            return next(err);
        }
        msg.sha = sha;

        github.repos.deleteFile(msg, function (err, resultData) {
            if (err) {
                return next(err);
            }
            next(err, resultData);
        });
    });
};

// get the contents of a specific repo file
exports.getRepoFile = function (repoName, fileName, next) {
    var msg = {
        user: "sss-storage",
        repo: repoName,
        path: fileName
    };

    github.repos.getContent(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        var retData = "";
        try {
            if (resultData) {
                var isBinary = false;

                // check for known binary files
                var filename = resultData.name.toLowerCase();
                if (filename.endsWith("png") ||
                    filename.endsWith("gif") ||
                    filename.endsWith("jpg") ||
                    filename.endsWith("jpeg") ||
                    filename.endsWith("bmp")
                ) {
                    isBinary = true;
                }

                // if b contains binary content, return downloadUrl instead of the data
                if (isBinary) {
                    retData = resultData.download_url;
                } else {
                    // base64 decode the data in resultData.content
                    var b = new Buffer(resultData.content, 'base64');
                    retData = b.toString();
                }
            }
        } catch (ignore) {}
        //console.log(retData);
        next(err, retData);
    });
};

// get the sha blob of a specific repo file
// this is required to update or delete a file
exports.getRepoFileSha = function (repoName, fileName, next) {
    var msg = {
        user: "sss-storage",
        repo: repoName,
        path: fileName
    };

    github.repos.getContent(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        var retData = "";
        try {
            if (resultData) {
                retData = resultData.sha;
            }
        } catch (ignore) {}
        next(err, retData);
    });
};

exports.createRepo = function (snippet, next) {
    var msg = {
        org: "sss-storage",
        name: snippet._id,
        description: snippet.description,
        auto_init: false
    };

    github.repos.createFromOrg(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }

        // create readme and add to repo
        var readmeContent = "# " + snippet.displayName + "\n" + snippet.readme;
        // base64 encode data from readmeContent
        readmeContent = new Buffer(readmeContent).toString('base64');
        exports.addRepoFile(snippet._id, "README.md", readmeContent, function (err, resultData) {
            if (err) {
                return next(err);
            }
            next(err, resultData);
        });
    });
};

exports.updateRepo = function (snippet, next) {
    var msg = {
        user: "sss-storage",
        repo: snippet._id,
        name: snippet._id,
        description: snippet.description
    };

    github.repos.update(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        next(err, resultData);
    });
};

exports.deleteRepo = function (snippetId, next) {
    var msg = {
        user: "sss-storage",
        repo: snippetId
    };

    github.repos.delete(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        next(err, resultData);
    });
};
