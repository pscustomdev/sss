// Routes starting with "/api"
module.exports = function(app) {
    var express = require('express');
    var ghm = require("github-flavored-markdown");
    var api_routes = express.Router();
    var restrict = require('../auth/restrict');
    var github = require('../db/github-dao');
    var db = require('../db/mongo-dao');

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

    api_routes.post('/snippet',
        function (req, res) {
            db.addModifySnippet(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding repository to database'});
                }
            });

            github.createRepo(req.body, function (err, repo) {
                if (err) {
                    return res.status(500).json({error: 'Error creating repository on GitHub'});
                }
                res.json(repo);
            });
        }
    );

    api_routes.get('/snippet-overview/:snippetId',
        function (req, res) {
            var retObj = {};
            db.getSnippet(req.params.snippetId, function (err, contents) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents'});
                }
                retObj = contents;

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
            });
        }
    );

    api_routes.get('/snippet-detail/:snippetId/:fileName',
        function (req, res) {
            var retObj = "";
            github.getRepoFile(req.params.snippetId, req.params.fileName, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories'});
                }
                //var b = new Buffer(content.content, 'base64');
                //// if b contains binary content, return content.downloadUrl instead of the data
                //var retData = "";
                //if (b) {
                //    retData = content.downloadUrl;
                //} else {
                //    retData = b.toString();
                //}
                res.json(content);
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

    api_routes.get('/authenticated-user',
        function (req, res) {
            return res.send(req.user);
        }
    );

    app.use('/api', api_routes);
};