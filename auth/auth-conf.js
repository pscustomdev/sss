var cfg = require('../config.js');


//This is so we can set environment variables for the tokens in prod and not have them checked into git
var githubClientID = process.env.GithubClientID;
var githubClientSecret = process.env.GitHubClientSecret;
var githubApiToken = process.env.GithubApiToken;

if(process.env.NODE_ENV !== 'production'){
    var authConfLocal = require('../auth/auth-conf-local.js');
    githubClientID = authConfLocal.github.clientID;
    githubClientSecret =  authConfLocal.github.clientSecret;
    githubApiToken =  authConfLocal.github_api.token;
}

module.exports = {
    github: {
        clientID: githubClientID,
        clientSecret: githubClientSecret,
        callbackURL: 'http://localhost:' + cfg.serverPort + '/auth/github/callback'
    },
    github_api: {
        username: 'pscustomdev-sss',
        token: githubApiToken
    }
};