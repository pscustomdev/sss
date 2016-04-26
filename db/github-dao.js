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
    console.log("searchCriteria:" + JSON.stringify(searchCriteria));

    //This will search the name, desc and README
    //https://github.com/search?utf8=%E2%9C%93&q=test&type=Repositories&ref=advsearch&l=&l=
    github.search.code(searchCriteria, function (err, resultData) {
        console.log("search.code: " + JSON.stringify(resultData));
        if (err) {
            console.log("Error:" + err.message);
        }
        next(err, resultData);
    });
};

exports.getCommits = function (repoOwner, repoName, next) {
    var msg = {user: repoOwner, repo: repoName};
    console.log("getCommits:" + JSON.stringify(msg));

    github.repos.getCommits(msg, function (err, resultData) {
        //console.log("resultData:" + JSON.stringify(resultData));
        next(err, resultData);
    });
};

exports.getReadme = function (repoName, next) {
    var msg = {user: "sss-storage", repo: repoName};

    github.repos.getReadme(msg, function (err, resultData) {
        //console.log("getReadme:" + JSON.stringify(resultData));
        next(err, resultData);
    });
};

// retrieve the repo contents (files)
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

exports.getRepoFile = function (repoName, fileName, next) {
    var msg = {user: "sss-storage", repo: repoName, path: fileName};

    github.repos.getContent(msg, function (err, resultData) {
        if (err) {
            return next(err);
        }
        console.log("getRepoFile: " + JSON.stringify(resultData));
        try {
            if (resultData) {
                var retData = "";
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
                    var b = new Buffer(resultData.content, 'base64');
                    retData = b.toString();
                }
            }
        } catch (ignore) {}
        //console.log(retData);
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
        readmeContent = new Buffer(readmeContent).toString('base64');
        var readme_msg = {
            user: "sss-storage",
            repo: snippet._id,
            path: "README.md",
            message: "Initial readme creation",
            content: readmeContent
        };
        github.repos.createFile(readme_msg, function(err, resultData) {
            if (err) {
                return next(err);
            }
        });

        next(err, resultData);
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
