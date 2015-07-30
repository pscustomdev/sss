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