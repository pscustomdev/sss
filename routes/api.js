// Routes starting with "/api"
module.exports = function(app) {
    var express = require('express');
    var api_routes = express.Router();
    var restrict = require('../auth/restrict');
    var github = require('../db/github-dao');
    var ghm = require("github-flavored-markdown");

    api_routes.get('/snippets',
        function (req, res) {
            github.getRepos(function (err, repos) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories'});
                }
                res.json(repos);
            });
        }
    );
    api_routes.get('/snippet',
        function (req, res) {
            github.getRepo(function (err, repo) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repository'});
                }
                res.json(repo);
            });
        }
    );
    api_routes.get('/snippet-overview/:snippetId',
        function (req, res) {
            var retObj = {};
            github.getRepoContents(req.params.snippetId, function (err, contents) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repository contents'});
                }
                retObj = contents;
                // get the description
                github.getRepo(req.params.snippetId, function (err, repo) {
                    if (err) {
                        return res.status(500).json({error: 'Error retrieving repository'});
                    }
                    retObj.description = repo.description;
                    // get the readme
                    github.getReadme(req.params.snippetId, function (err, readmeobj) {
                        if (err) {
                            return res.status(500).json({error: 'Error retrieving repository readme'});
                        }
                        var b = new Buffer(readmeobj.content, 'base64');
                        retObj.readme = ghm.parse(b.toString());
                        res.json(retObj);
                    });
                });
            });
        }
    );
    api_routes.get('/snippet-detail/:snippetId/:fileName',
        function (req, res) {
            github.getRepoFile(req.params.snippetId, req.params.fileName, function (err, repos) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories'});
                }
                res.json(repos);
            });
        }
    );

    api_routes.get('/snippet-search',
        function (req, res) {
            var searchTerms = req.query.q;
            console.log("searchTerm: " + searchTerms);
            github.searchCode(searchTerms, function (err, repos) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories'});
                }
                res.json(repos);
            });
        }
    );

    api_routes.get('/snippet-search/:repoOwner/:repoName',
        function (req, res) {
            github.getCommits(req.params.repoOwner, req.params.repoName, function (err, commits) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories'});
                }
                res.json(commits);
            });
        }
    );

    app.use('/api', api_routes);
};