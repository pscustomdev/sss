var cfg = require('../config.js');
var authConfLocal = require('../auth/auth-conf-local.js');

//Take environment variables first and if that doesn't work then go local.

//GITHUB
var githubApiToken =  (process.env.GithubApiToken) ? process.env.GithubApiToken : authConfLocal.github.token;
var githubClientID =  (process.env.GithubClientID) ? process.env.GithubClientID : authConfLocal.github.clientID;
var githubClientSecret =  (process.env.GithubClientSecret) ? process.env.GithubClientSecret : authConfLocal.github.clientSecret;
var githubCallbackUrl = "";

//GOOGLE
var googleClientID =  (process.env.GoogleClientID) ? process.env.GoogleClientID : authConfLocal.google.clientID;
var googleClientSecret =  (process.env.GoogleClientSecret) ? process.env.GoogleClientSecret : authConfLocal.google.clientSecret;
var googleCallbackUrl = "";

//AZURE
var azureBlobStorageKey =  (process.env.AzureBlobStorageKey) ? process.env.AzureBlobStorageKey : authConfLocal.azure.blobStorage.key;
var azureBlobStorageName =  (process.env.AzureBlobStorageName) ? process.env.AzureBlobStorageName : authConfLocal.azure.blobStorage.name;
var azureSearchKey =  (process.env.AzureSearchKey) ? process.env.AzureSearchKey : authConfLocal.azure.search.key;
var azureSearchUrl =  (process.env.AzureSearchUrl) ? process.env.AzureSearchUrl : authConfLocal.azure.search.url;

//MONGO
//This is for DEV
var mongoUri = (process.env.MongoUri) ? process.env.MongoUri : authConfLocal.mongo.uri;

//Won't use authConfLocal for anything but dev so we don't tax azure too much except to test or prod.
if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'testing') {
    mongoUri = process.env.MongoUri;
}

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'testing') {
    githubCallbackUrl = "http://www.softwaresnippetsearch.com/auth/github/callback";
    googleCallbackUrl = "http://www.softwaresnippetsearch.com/auth/google/callback";   // If this Url ever changes in ANY way (eg http -> https), sss-storage's configured application must be updated
} else {
    githubCallbackUrl = "http://localhost:" + cfg.serverPort + '/auth/github/callback';
    googleCallbackUrl = "http://localhost:" + cfg.serverPort + '/auth/google/callback';
}

module.exports = {
    github: {
        clientID: githubClientID,
        clientSecret: githubClientSecret,
        callbackUrl: githubCallbackUrl,
        username: 'pscustomdev-sss',
        token: githubApiToken
    },
    google: {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackUrl: googleCallbackUrl
    },
    mongo: {
        uri: mongoUri
    },
    azure: {
        blobStorage: {
            key: azureBlobStorageKey,
            name: azureBlobStorageName
        },
        search: {
            key: azureSearchKey,
            url: azureSearchUrl
        }
    }
};