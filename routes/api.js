var _ = require('underscore');
var authConf = require('../auth/auth-conf.js');

// Routes starting with "/api"
module.exports = function(app) {
    var express = require('express');
    var bodyParser = require('body-parser');
    // var busboy = require('connect-busboy');
    var Busboy = require('busboy');
    var fs = require('fs');
    var marked = require("marked");
    var api_routes = express.Router();
    var restrict = require('../auth/restrict');
    var azureStorage = require('../db/azure-storage-dao');
    var azureSearch = require('../db/azure-search-dao');
    var db = require('../db/mongo-dao');

    var textParser = bodyParser.text();

    // get a list of all snippets with these ids
    api_routes.get('/snippets/:snippetIds',
        function (req, res) {
            var sIds = decodeURIComponent(req.params.snippetIds).split(",");
            db.getSnippets(sIds, function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }
                res.json(results);
            })
        }
    );

    //Get snippets by owner (we might want to make this more generic so they could get snippets by any attr)
    api_routes.get('/snippets',
        function (req, res) {
            db.getSnippetsByOwner(req.query.owner, function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }
                res.json(results);
            })
        }
    );

    //Get snippets by owner
    api_routes.get('/snippets',
        function (req, res) {
            db.getSnippetsByOwner(req.query.owner, function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }
                res.json(results);
            })
        }
    );

    // get information about a snippet
    api_routes.get('/snippet/:snippetId',
       function (req, res) {
            db.getSnippet(req.params.snippetId, function(err, snippet) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving snippet: ' + err.message});
                }
                res.json(snippet);
            })
       }
    );

    // create snippet (post)
    api_routes.post('/snippet', restrict,
        function (req, res) {
            db.addUpdateSnippet(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding snippet to database: ' + err.message});
                }
                res.json("");
            });
        }
    );

    // update snippet data such as display name and description (put)
    api_routes.put('/snippet/:snippetId', restrict,
        function (req, res) {
            db.addUpdateSnippet(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding snippet to database: ' + err.message});
                }
                res.json("");
            });
        }
    );

    // delete snippet
    api_routes.delete('/snippet/:snippetId', restrict,
        function (req, res) {
            db.removeSnippet(req.params.snippetId, function (err){
                if (err) {
                    return res.status(500).json({error: 'Error removing snippet to database: ' + err.message});
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
            db.getSnippet(req.params.snippetId, function (err, snippet) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving snippet from database: ' + err.message});
                }
                //Get file list once we are putting files
                //TODO get Files
                azureStorage.getListOfFilesInFolder(req.params.snippetId, function(err, result, response) {
                    if(!err){     //if files have been uploaded.
                        // we only need the names of the files
                        var fileNames = _.pluck(result.entries, 'name');
                        snippet.files = fileNames;
                    }
                    snippet._id = req.params.snippetId;
                    snippet.owner = snippet.owner || "unknown";
                    snippet.postedOn = snippet.postedOn || "unknown";
                    // determine if the current user is the owner
                    snippet.isOwner = false;
                    // if logged in as the admin user
                    if(req.user && req.user.username === "pscustomdev-sss"){
                        snippet.isOwner = true;
                    }
                    if (req.user && snippet.owner == req.user.username) {
                        snippet.isOwner = true;
                    }

                    res.json(snippet);
                });
            });
        }
    );

    // add a snippet file
    api_routes.post('/snippet-detail/:snippetId/:fileName', restrict, textParser,
        function (req, res) {
            req.body.content = req.body.content || " "; //we need to at least have a space as content or it won't save a file.
            azureStorage.addUpdateFileByText(req.params.snippetId, req.params.fileName, req.body.content, function (err, content){
                if (err) {
                    return res.status(500).json({error: 'Error creating file: ' + err.message});
                }
                res.json({});
            })

        }
    );

    // upload and add a snippet file
    api_routes.post('/snippet-detail/:snippetId', restrict,
        function (req, res) {
            var busboy = new Busboy({ headers: req.headers });
            busboy.on('file', function(fieldname, file, filename) {
                var filesize = Number(req.headers['content-length']) * 2;
                azureStorage.addUpdateFileByStream(req.params.snippetId, filename, file, filesize, function(err, result) {
                    if (err) {
                        return res.status(500).json({error: 'Error creating file: ' + err.message});
                    }
                    res.json({});
                });
            });
            req.pipe(busboy);
        }
    );

    // update contents of a snippet file
    api_routes.put('/snippet-detail/:snippetId/:fileName', restrict, textParser,
        function (req, res) {
            var content =req.body.content || " ";
            azureStorage.addUpdateFileByText(req.params.snippetId, req.params.fileName, content, function (err, content){
                if (err) {
                    return res.status(500).json({error: 'Error updating file: ' + err.message});
                }
                res.json({});
            });
        }
    );

    // get contents of a snippet file
    api_routes.get('/snippet-detail/:snippetId/:fileName',
        function (req, res) {
            azureStorage.getBlobToText(req.params.snippetId, req.params.fileName, function(err, content) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving file: ' + err.message});
                }
                res.json(content);
            })
        }
    );

    // delete a snippet file
    api_routes.delete('/snippet-detail/:snippetId/:fileName', restrict,
        function (req, res) {
            azureStorage.deleteFile(req.params.snippetId,req.params.fileName, function(err, content) {
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
            azureSearch.searchSnippets(searchTerms, function (err, results) {
                if (err) {
                    return res.status(500).json({error: 'Error searching: ' + err.message});
                }

                if (!results || results.length == 0) {  //no results so just return
                    return res.json({});
                }

                results.forEach(function(result){
                    result.postedBy = result ? result.owner : "unknown";
                    result.postedOn = result ? result.postedOn : "unknown";
                });

                var retObj = {
                    items: results,
                    total_count : results.length
                };
                res.json(retObj);
            });
        }
    );

    api_routes.get('/rating/:snippetId',
        function (req, res) {
            db.getSnippetRatingsAvg(req.params.snippetId, function (err, ratingAvg) {
                res.json(ratingAvg);
            });
        }
    );

    api_routes.get('/ratings/:snippetIds',
        function (req, res) {
            var sIds = decodeURIComponent(req.params.snippetIds).split(",");
            db.getSnippetsRatingsAvg(sIds, function (err, ratings) {
                res.json(ratings);
            });
        }
    );

    api_routes.get('/rating/:snippetId/:user',
        function (req, res) {
            var userRating = {
                snippetId:req.params.snippetId,
                rater:req.params.user
            };
            db.getSnippetRatingByUser(userRating, function (err, rating) {
                res.json(rating);
            });
        }
    );

    // create or update snippet rating (POST)
    api_routes.post('/rating/:snippetId', restrict,
        function (req, res) {
            db.addUpdateSnippetRating(req.body, function (err) {
                if (err) {
                    return res.status(500).json({error: 'Error adding rating to database: ' + err.message});
                }
                res.json({});
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
