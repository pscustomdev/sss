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

    // get a list of all snippets
    api_routes.get('/snippets',
        function (req, res) {
            db.getSnippets(req.params.owner, function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }
                res.json(results);
            })
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

                    var b = snippet.readme;
                    // replace <img src="image.jpg"> with a full path to the image on azure
                    var imgUrlPrefix = authConf.azure.blobStorage.url + req.params.snippetId + "/";
                    b = b.replace(/<img src=\"/g,"<img src=\"" + imgUrlPrefix);
                    snippet.readme = marked(b);
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
            // db.searchSnippets(searchTerms, function (err, results) {
                if (err) {
                    return res.status(500).json({error: 'Error searching: ' + err.message});
                }
                // get display name from the database for each hit
                // this pattern is helpful if you need to make async calls within a loop
                // but you cannot return until all async calls have completed
                if (results.length == 0) {  //no results so just return
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
                // var ctr = 0;
                // var gotSnippetsNum = 0; //Used to tell if we got all the snippets from the db;
                // results.forEach(function(result){
                //     if(!result.snippetId) {
                //         return;
                //     }
                //     db.getSnippet(result.snippetId, function (err, snippet) {
                //         if (err) {
                //             //TODO there is a bug here...if we have two results and we error on the first we will return the status
                //             // then the second will cause another error and try to return the status again causing a header changed error.
                //             return res.status(500).json({error: 'Error retrieving snippet from database'});
                //         }
                //         gotSnippetsNum++;
                //
                //         result.displayName = snippet ? snippet.displayName : snippet.snippetId;
                //         result.postedBy = snippet ? snippet.owner : "unknown";
                //         result.postedOn = snippet ? snippet.postedOn : "unknown";
                //         var seen = {};
                //         results = results.filter(function(entry) {
                //             // var previous;
                //
                //             //TODO merger @search.highlights instead of just having the one.
                //             // Have we seen this snippet before?
                //             // if (seen.hasOwnProperty(entry.snippetId)) {
                //                 // Yes, grab it and add its text matches to it
                //                 // previous = seen[entry.snippetId];
                //                 // previous.text_matches.push(entry.text_matches[0]);
                //                 //TODO make this so these aren't hardcoded values.
                //                 // previous["@search"].highlights.description.push(entry.hightlights.description);
                //                 // previous["@search"].highlights.readme.push(entry.hightlights.readme);
                //                 // previous["@search"].highlights.displayName.push(entry.hightlights.displayName);
                //
                //                 // Don't keep this entry, we've merged it into the previous one
                //                 // return false;
                //             // }
                //             // Remember that we've seen it
                //             seen[entry.snippetId] = entry;
                //
                //             // Keep this one, we'll merge any others that match into it
                //             return true;
                //         });
                //         if(gotSnippetsNum == results.length){
                //             var retObj = {
                //                 items: results,
                //                 total_count : results.length
                //             };
                //             res.json(retObj);
                //         }
                //     });
                // });
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
    api_routes.post('/rating/:snippetId',
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
