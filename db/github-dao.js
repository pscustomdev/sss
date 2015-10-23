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
        "user-agent": "SoftwareSnippetSearch" // GitHub is happy with a unique user agent
    }
});

github.authenticate({
    type: "oauth",
    token: auth_config.github_api.token
});

exports.getRepos = function(next) {
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

exports.searchCode = function (s, next) {
    var searchCriteria = {};
    searchCriteria.q =  s + "+user:sss-storage";

    //This will search the name, desc and README
    console.log("searchCriteria:" + JSON.stringify(searchCriteria));
    github.search.code(searchCriteria, function(err, resultData) {
        console.log("resultData:" + JSON.stringify(resultData));
        next(err, resultData);
    });
};

// exports.getRepoContents = function(repoId, next) {
//     var repo = github.getRepo(auth_config.github_api.username, repoId);
//     var pathToDir = ""; //Leaving empty because no sub directory planned

//     repo.contents('master', pathToDir, function(err, contents) {
//         if (err) {
//             console.log(JSON.parse(err.request.responseText).message);
//             return next(err);
//         }
//         console.log(JSON.stringify(contents));
//         next(null, contents);
//     });
// };

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

