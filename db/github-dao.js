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
        console.log(JSON.stringify(subRepos));
        next(err, subRepos);
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
        console.log("resultData:" + JSON.stringify(resultData));
        next(err, resultData);
    });
};

// retrieve the repo contents (files)
exports.getRepoContents = function (repoName, next) {
    var msg = {user: "sss-storage", repo: repoName, path: ''};
    var retData = [];
    github.repos.getContent(msg, function (err, resultData) {
         if (err) {
             return next(err);
         }
        console.log("getRepoContents: " + JSON.stringify(resultData));
        try {
            for (var idx in resultData) {
                // only interested in numeric idx values
                if (Number(idx) > -1) {
                    retData.push(resultData[idx].name);
                }
            }
        } catch (ignore) {}
        console.log(JSON.stringify(retData));
        next(err, retData);
    });
};


// exports.getRepoFile = function(repoId, fileName, next) {
//     var repo = github.getRepo(auth_config.github_api.username, repoId);

//     repo.read('master', fileName, function(err, contents) {
//         if (err) {
//             return next(err);
//         }
//         console.log(JSON.stringify(contents));
//         next(null, contents);
//     });
// };

