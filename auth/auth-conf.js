var cfg = require('../config.js');
var authConfLocal = require('../auth/auth-conf-local.js');

//Take environment variables first and if that doesn't work then go local.

//GITHUB
var githubApiToken =  (process.env.GithubApiToken) ? process.env.GithubApiToken : authConfLocal.github_api.token;
var githubClientID =  (process.env.GithubClientID) ? process.env.GithubClientID : authConfLocal.github_api.clientID;
var githubClientSecret =  (process.env.GithubClientSecret) ? process.env.GithubClientSecret : authConfLocal.github.clientSecret;
var githubCallbackURL = "";

//GOOGLE
var googleClientID =  (process.env.GoogleClientID) ? process.env.GoogleClientID : authConfLocal.google.clientID;
var googleClientSecret =  (process.env.GoogleClientSecret) ? process.env.GoogleClientSecret : authConfLocal.google.clientSecret;
var googleCallbackURL = "";

//AZURE
var azureBlobStorageKey =  (process.env.AzureBlobStorageKey) ? process.env.AzureBlobStorageKey : authConfLocal.azure.blobStorage.key;
var azureSearchKey =  (process.env.AzureSearchKey) ? process.env.AzureSearchKey : authConfLocal.azure.search.key;

//MONGO
var mongoUri =  (process.env.MongoUri) ? process.env.MongoUri : authConfLocal.mongo.uri;

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'testing') {
    githubCallbackURL = "http://www.softwaresnippetsearch.com/auth/github/callback";
    googleCallbackURL = "http://www.softwaresnippetsearch.com/auth/google/callback";   // If this url ever changes in ANY way (eg http -> https), sss-storage's configured application must be updated
} else {
    githubCallbackURL = "http://localhost:" + cfg.serverPort + '/auth/github/callback';
    googleCallbackURL = "http://localhost:" + cfg.serverPort + '/auth/google/callback';
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
    },
    azure: {
        blobStorage: {
            key: azureBlobStorageKey
        },
        search: {
            key: azureSearchKey
        }
    }
};