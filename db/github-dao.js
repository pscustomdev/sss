var config = require('../auth-conf');
var Github = require('github-api');
var _ = require('underscore');

var github = new Github({
  token: config.github_token,
  auth: "oauth"
});
var user = github.getUser();

exports.getRepos = function(next) {
    user.repos(function (err, repos) {
        if (err) {
            console.log(err);
            return next(err);    
        }
        var subRepos = _.pluck(repos, 'name');
        next(null, subRepos);
    });
};

exports.getRepoContents = function(repoId, next) {
    var repo = github.getRepo(config.github_username, repoId);
    var pathToDir = ""; //Leaving empty because no sub directory planned
    
    repo.contents('master', pathToDir, function(err, contents) {
        if (err) {
            console.log(JSON.parse(err.request.responseText).message);
            return next(err);    
        }
        console.log(JSON.stringify(contents));
        next(null, contents);
    });
};

exports.getRepoFile = function(repoId, fileName, next) {
    var repo = github.getRepo(config.github_username, repoId);
    
    repo.read('master', fileName, function(err, contents) {
        if (err) {
            return next(err);    
        }
        console.log(JSON.stringify(contents));
        next(null, contents);
    });
};
