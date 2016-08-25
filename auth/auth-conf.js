var cfg = require('../config.js');

//This is so we can set environment variables for the tokens in prod and not have them checked into git
var githubApiToken =  "";
var githubClientID = "";
var githubClientSecret =  "";
var githubCallbackURL = "";
var googleClientID = "";
var googleClientSecret =  "";
var googleCallbackURL = "";
var mongoUri = "";

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'testing') {
    githubApiToken = process.env.GithubApiToken;
    githubClientID = process.env.GithubClientID;
    githubClientSecret = process.env.GithubClientSecret;
    githubCallbackURL = "http://www.softwaresnippetsearch.com/auth/github/callback";
    googleClientID = process.env.GoogleClientID;
    googleClientSecret = process.env.GoogleClientSecret;
    googleCallbackURL = "http://www.softwaresnippetsearch.com/auth/google/callback";   // If this url ever changes in ANY way (eg http -> https), sss-storage's configured application must be updated
    mongoUri = process.env.MongoUri;
} else {
    var authConfLocal = require('../auth/auth-conf-local.js');
    githubApiToken =  authConfLocal.github_api.token;
    githubClientID = authConfLocal.github.clientID;
    githubClientSecret =  authConfLocal.github.clientSecret;
    githubCallbackURL = "http://localhost:" + cfg.serverPort + '/auth/github/callback';
    googleClientID = authConfLocal.google.clientID;
    googleClientSecret =  authConfLocal.google.clientSecret;
    googleCallbackURL = "http://localhost:" + cfg.serverPort + '/auth/google/callback';
    mongoUri =  authConfLocal.mongo.uri;
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
    },
    google: {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL
    },
    mongo: {
        uri: mongoUri
    }
};