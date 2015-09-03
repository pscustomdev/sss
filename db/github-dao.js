var config = require('../auth-conf');
var GitHubApi = require('github');
var _ = require('underscore');


var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com",
    pathPrefix: "", // for some GHEs; none for GitHub
    timeout: 5000,
    org: "sss-storage",
    headers: {
        "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    }
});

github.authenticate({
    type: "oauth",
    token: config.github_token
});

exports.getRepos = function(next) {
    github.repos.getAll({}, function (err, repos) {
        if (err) {
            console.log(err);
            return next(err);    
        }
        var subRepos = _.pluck(repos, 'name');
        next(err, subRepos);
    });
};

// exports.getRepoContents = function(repoId, next) {
//     var repo = github.getRepo(config.github_username, repoId);
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
//     var repo = github.getRepo(config.github_username, repoId);
    
//     repo.read('master', fileName, function(err, contents) {
//         if (err) {
//             return next(err);    
//         }
//         console.log(JSON.stringify(contents));
//         next(null, contents);
//     });
// };

/*
search#code(msg, callback)null
msgObjectObject that contains the parameters and their values to be sent to the server.
callbackFunctionfunction to call when the request is finished with an error as first argument and result data as second argument.
Params on the msg object:
headers (Object): Optional. Key/ value pair of request headers to pass along with the HTTP request. Valid headers are: 'If-Modified-Since', 'If-None-Match', 'Cookie', 'User-Agent', 'Accept', 'X-GitHub-OTP'.
q (String): Required. Search Term
sort (String): Optional. indexed only Validation rule: ^indexed$.
order (String): Optional. asc or desc Validation rule: ^(asc|desc)$.
page (Number): Optional. Page number of the results to fetch. Validation rule: ^[0-9]+$.
per_page (Number): Optional. A custom page size up to 100. Default is 30. Validation rule: ^[0-9]+$.
*/
exports.searchCode = function (s, next) {
    var searchCriteria = {};
    searchCriteria.q =  s + "+user:sss-storage";
    
    //This will search the name, desc and README
    github.search.repos(searchCriteria, function(err, resultData) {
        console.log(JSON.stringify(resultData));
        next(err, resultData);
    });
    
    //This will search the code files but NOT the READ.ME
    // github.search.code(searchCriteria, function(err, resultData) {
    //     console.log(JSON.stringify(resultData));
    //     next(err, resultData);
    // });
}
