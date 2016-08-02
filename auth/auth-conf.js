var cfg = require('../config.js');

//This is so we can set environment variables for the tokens in prod and not have them checked into git
var githubApiToken =  "";
var githubClientID = "";
var githubClientSecret =  "";
var githubCallbackURL = "";

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'testing') {
    githubApiToken = process.env.GithubApiToken;
    githubClientID = process.env.GithubClientID;
    githubClientSecret = process.env.GithubClientSecret;
    githubCallbackURL = "http://www.softwaresnippetsearch.com/auth/github/callback";   // If this url ever changes in ANY way (eg http -> https), sss-storage's configured application must be updated
} else {
    var authConfLocal = require('../auth/auth-conf-local.js');
    githubApiToken =  authConfLocal.github_api.token;
    githubClientID = authConfLocal.github.clientID;
    githubClientSecret =  authConfLocal.github.clientSecret;
    githubCallbackURL = "http://localhost:" + cfg.serverPort + '/auth/github/callback';
}

module.exports = {
    github: {
        clientID: githubClientID,
        clientSecret: githubClientSecret,
        callbackURL: githubCallbackURL
    },
    github_api: {
        username: 'pscustomdev-sss',
        token: githubApiToken
    }
};