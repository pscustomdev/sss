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

    // create snippet
    api_routes.post('/snippet',
        function (req, res) {
            db.addUpdateSnippet(req.body, function (err) {
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

    // update snippet
    api_routes.put('/snippet',
        function (req, res) {
            db.addUpdateSnippet(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding repository to database'});
                }
            });

            github.updateRepo(req.body, function (err, repo) {
                if (err) {
                    return res.status(500).json({error: 'Error creating repository on GitHub'});
                }
                res.json(repo);
            });
        }
    );

    api_routes.delete('/snippet/:snippetId',
        function (req, res) {
            github.deleteRepo(req.params.snippetId, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error deleting repository'});
                }
                res.json("");
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
                    retObj._id = req.params.snippetId;
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
                            var b = new Buffer(readmeobj.content, 'base64').toString();
                            // replace < in readme so any sample html content in the readme will render properly
                            b = b.replace(/</g, "&lt;");
                            // replace <img src="image.jpg"> with a full path to the image on github
                            var imgUrlPrefix = "https://raw.githubusercontent.com/sss-storage/"+req.params.snippetId+"/master/";
                            b = b.replace(/&lt;img src=\"/g,"<img src=\"" + imgUrlPrefix);
                            retObj.readme = ghm.parse(b);

                            // get display name from database
                            db.getSnippet(req.params.snippetId, function (err, repo) {
                                if (err) {
                                    return res.status(500).json({error: 'Error retrieving repository from database'});
                                }
                                retObj.displayName = repo ? repo.displayName : req.params.snippetId;
                                retObj.owner = repo ? repo.owner : "unknown";

                                res.json(retObj);
                            });

                        });
                    });
                });
            });
        }
    );

    api_routes.get('/snippet-detail/:snippetId/:fileName',
        function (req, res) {
            github.getRepoFile(req.params.snippetId, req.params.fileName, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories'});
                }
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
                // get display name from the database for each hit
                // this pattern is helpful if you need to make async calls within a loop
                // but you cannot return until all async calls have completed
                var numItems = repos.items.length;
                var ctr = 0;
                if (numItems == 0) {
                    return res.json({});
                }
                for(var i in repos.items) {
                    (function(idx) {
                        var repoId = repos.items[idx].repository.name;
                        db.getSnippet(repoId, function (err, repo) {
                            if (err) {
                                return res.status(500).json({error: 'Error retrieving repository from database'});
                            }
                            repos.items[idx].repository.displayName = repo ? repo.displayName : repoId;
                            // do not return from the function until the last db call has returned
                            if (ctr == numItems - 1) {
                                res.json(repos);
                            }
                            ctr++;
                        });
                    })(i);
                }
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
