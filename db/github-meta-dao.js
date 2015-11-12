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
