// Routes starting with "/api"
module.exports = function(app) {
    var express = require('express');
    var bodyParser = require('body-parser');
    var busboy = require('connect-busboy');
    var fs = require('fs');
    var marked = require("marked");
    var api_routes = express.Router();
    var restrict = require('../auth/restrict');
    var github = require('../db/github-dao');
    var db = require('../db/mongo-dao');

    var textParser = bodyParser.text();

    // limit file upload to 512k which is a github limit
    api_routes.use(busboy({
        immediate: true,
        limits: {
            fileSize: 512 * 1024
        }
    }));

    // get a list of all snippets
    api_routes.get('/snippets',
        function (req, res) {
            github.getRepos(function (err, repos) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving repositories: ' + err.message});
                }
                res.json(repos);
            });
        }
    );

    api_routes.get('/snippets/:owner',
        function (req, res) {
            db.getSnippetsByOwner(req.params.owner, function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }
                res.json(results);
            })
        }
    );

    // get information about a snippet
    //TODO This is not implemented
    //api_routes.get('/snippet',
    //    function (req, res) {
    //        github.getRepo(function (err, repo) {
    //            if (err) {
    //                return res.status(500).json({error: 'Error retrieving repository: ' + err.message});
    //            }
    //            res.json(repo);
    //        });
    //    }
    //);

    // create snippet (post)
    api_routes.post('/snippet', restrict,
        function (req, res) {
            db.addUpdateSnippet(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding repository to database: ' + err.message});
                }
            });

            github.createRepo(req.body, function (err, repo) {
                if (err) {
                    return res.status(500).json({error: 'Error creating repository on GitHub: ' + err.message});
                }
                res.json(repo);
            });
        }
    );

    // update snippet data such as display name and description (put)
    api_routes.put('/snippet', restrict,
        function (req, res) {
            db.addUpdateSnippet(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding repository to database: ' + err.message});
                }
            });

            github.updateRepo(req.body, function (err, repo) {
                if (err) {
                    return res.status(500).json({error: 'Error creating repository on GitHub: ' + err.message});
                }
                res.json(repo);
            });
        }
    );

    // delete snippet
    api_routes.delete('/snippet/:snippetId', restrict,
        function (req, res) {
            db.removeSnippet(req.params.snippetId, function (err){
                if (err) {
                    return res.status(500).json({error: 'Error removing repository to database: ' + err.message});
                }
            });

            github.deleteRepo(req.params.snippetId, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error deleting repository: ' + err.message});
                }
                res.json("");
            });
        }
    );

    // get data required for the snippet overview
    // * specific snippet data (id, description)
    // * list of files
    // * readme contents
    // * db data such as owner and display name
    api_routes.get('/snippet-overview/:snippetId',
        function (req, res) {
            var retObj = {};
            db.getSnippet(req.params.snippetId, function (err, contents) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }
                retObj = contents;
                github.getRepoContents(req.params.snippetId, function (err, contents) {
                    if (err) {
                        return res.status(500).json({error: 'Error retrieving repository contents: ' + err.message});
                    }
                    retObj = contents;

                    //sort contents.files with README.md at the top of the list
                    var readMeIdx = retObj.files.indexOf("README.md");
                    if (readMeIdx > -1) {
                        // preface with a space so it will sort at the top
                        retObj.files[readMeIdx] = " README.md";
                    }
                    // sort - ignore case
                    retObj.files.sort(function(a,b) {
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    });
                    if (readMeIdx > -1) {
                        // strip the leading space
                        retObj.files[0] = "README.md";
                    }

                    retObj._id = req.params.snippetId;
                    // get the description
                    github.getRepo(req.params.snippetId, function (err, repo) {
                        if (err) {
                            return res.status(500).json({error: 'Error retrieving repository: ' + err.message});
                        }
                        retObj.description = repo.description;

                        // get the readme
                        github.getReadme(req.params.snippetId, function (err, readmeobj) {
                            if (err) {
                                return res.status(500).json({error: 'Error retrieving repository readme: ' + err.message});
                            }
                            var b = new Buffer(readmeobj.content, 'base64').toString();
                            // replace < in readme so any sample html content in the readme will render properly
                            b = b.replace(/</g, "&lt;");
                            // replace <img src="image.jpg"> with a full path to the image on github
                            var imgUrlPrefix = "https://raw.githubusercontent.com/sss-storage/"+req.params.snippetId+"/master/";
                            b = b.replace(/&lt;img src=\"/g,"<img src=\"" + imgUrlPrefix);
                            retObj.readme = marked(b);

                            // get display name from database
                            db.getSnippet(req.params.snippetId, function (err, repo) {
                                if (err) {
                                    return res.status(500).json({error: 'Error retrieving repository from database: ' + err.message});
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

    // add a repo file
    api_routes.post('/snippet-detail/:snippetId/:fileName', restrict, textParser,
        function (req, res) {
            // base64 encode content
            var content = new Buffer(req.body.content ? req.body.content : " ").toString('base64');
            github.addRepoFile(req.params.snippetId, req.params.fileName, content, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error creating file: ' + err.message});
                }
                res.json({});
            });
        }
    );

    // upload and add a repo file
    api_routes.post('/snippet-detail/:snippetId', restrict,
        function (req, res) {
            var snippetId = req.params.snippetId;
            req.pipe(req.busboy);
            req.busboy.on('file', function(fieldname, file, filename) {
                var filesize = Number(req.headers['content-length']) * 2;
                var content = new Uint8Array(filesize);
                var offset = 0;
                var cnt = 0;
                // read data from file in buffers
                file.on('data', function(data) {
                    // only process the even number packets
                    // I don't know why the data is sent this way from angular-file-upload
                    if (cnt == 0 || cnt % 2 == 0) {
                        content.set(data, offset);
                        offset += data.length;
                    }
                    cnt++;
                });
                // once file read is complete, add the file to the snippet
                file.on('end', function() {
                    content = content.slice(0, offset);
                    // base64 encode file data
                    content = new Buffer(content).toString('base64');
                    github.addRepoFile(req.params.snippetId, filename, content, function (err, content) {
                        if (err) {
                            return res.status(500).json({error: 'Error creating file: ' + err.message});
                        }
                        res.json({});
                    });
                });
            });
        }
    );

    // update contents of a repo file
    api_routes.put('/snippet-detail/:snippetId/:fileName', restrict, textParser,
        function (req, res) {
            // base64 encode content
            var content = new Buffer(req.body.content).toString('base64');
            github.updateRepoFile(req.params.snippetId, req.params.fileName, content, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error updating file: ' + err.message});
                }
                res.json({});
            });
        }
    );

    // get contents of a repo file
    api_routes.get('/snippet-detail/:snippetId/:fileName',
        function (req, res) {
            github.getRepoFile(req.params.snippetId, req.params.fileName, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving file: ' + err.message});
                }
                res.json(content);
            });
        }
    );

    // delete a repo file
    api_routes.delete('/snippet-detail/:snippetId/:fileName', restrict,
        function (req, res) {
            github.deleteRepoFile(req.params.snippetId, req.params.fileName, function (err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error deleting file: ' + err.message});
                }
                res.json(content);
            });
        }
    );

    // search all snippets and return result data
    api_routes.get('/snippet-search',
        function (req, res) {
            var searchTerms = req.query.q;
            console.log("searchTerm: " + searchTerms);
            github.searchCode(searchTerms, function (err, repos) {
                if (err) {
                    return res.status(500).json({error: 'Error searching: ' + err.message});
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
                            repos.items[idx].repository.postedBy = repo ? repo.owner : "unknown";
                            repos.items[idx].repository.postedOn = repo ? repo.postedOn : "unknown";
                            // do not return from the function until the last db call has returned
                            if (ctr == numItems - 1) {
                                //combine the text matches of any duplicate results
                                var seen = {};
                                repos.items = repos.items.filter(function(entry) {
                                    var previous;

                                    // Have we seen this repository before?
                                    if (seen.hasOwnProperty(entry.repository.full_name)) {
                                        // Yes, grab it and add its text matches to it
                                        previous = seen[entry.repository.full_name];
                                        previous.text_matches.push(entry.text_matches[0]);

                                        // Don't keep this entry, we've merged it into the previous one
                                        return false;
                                    }
                                    // Remember that we've seen it
                                    seen[entry.repository.full_name] = entry;

                                    // Keep this one, we'll merge any others that match into it
                                    return true;
                                });
                                //reset the count
                                repos.total_count=repos.items.length;
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
                    return res.status(500).json({error: 'Error getting commits: ' + err.message});
                }
                res.json(commits);
            });
        }
    );

    api_routes.get('/authenticated-user',
        //return the authenticated user
        function (req, res) {
            return res.send(req.user);
        }
    );

    app.use('/api', api_routes);
};
