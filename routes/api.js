var _ = require('underscore');
var authConf = require('../auth/auth-conf.js');
var stats = require('../db/stats-dao.js');
var isBinaryFile = require("isbinaryfile");
var db = require('../db/mongo-dao');

function generateMetaData(fileName, content, fileBuffer, fileSize) {
    var metaData = {};
    metaData.fileExtension = fileName.substring(fileName.lastIndexOf(".") + 1);
    if (fileBuffer) {
        metaData.binary = isBinaryFile.sync(fileBuffer, fileSize);
    } else {
        metaData.binary = false;
    }

    if (metaData.binary) {
        metaData.editable = false;
        metaData.viewable = false;
        switch (metaData.fileExtension) {
            case "bmp":
            case "gif":
            case "jpg":
            case "jpeg":
            case "png":
                metaData.viewable = true;
                break;
        }
    }
    else {
        metaData.editable = true;
        metaData.viewable = false;
    }

    if (content) {
        metaData.deleted = (content === "deleted=true" ? "true" : "false"); // if the content is "deleted=true" the file is marked for deletion
    } else {
        metaData.deleted = false;
    }

    return metaData;
}

function getSnippetRatingByUser(params, next){
    var userRating = {
        snippetId:params.snippetId,
        rater:params.user
    };
    db.getSnippetRatingByUser(userRating, function (err, rating) {
        next(err, rating);
    });
}

// Routes starting with "/api"
module.exports = function(app) {
    var express = require('express');
    var bodyParser = require('body-parser');
    // var busboy = require('connect-busboy');
    var Busboy = require('busboy');
    var fs = require('fs');
    var api_routes = express.Router();
    var restrict = require('../auth/restrict');
    var azureStorage = require('../db/azure-storage-dao');
    var azureSearch = require('../db/azure-search-dao');

    var textParser = bodyParser.text();

    //Get snippets by owner (we might want to make this more generic so they could get snippets by any attr)
    api_routes.get('/snippets',
        function (req, res) {
            db.getSnippetsByOwner(req.query.owner, function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + (err.message || err)});
                }
                if (!results || !results[0]) {
                    return res.status(204).json({error: 'No snippets found for user'});
                }
                res.json(results);
            })
        }
    );

    api_routes.get('/snippets/rating-rank',
        function (req, res) {
            db.getSnippetRankings(function(err, results){
                if (err) {
                    return res.status(500).json({error: 'Error getting snippet rankings from database: ' + (err.message || err)});
                }
                //TODO var = snippetIds
                var snippetIds = _.pluck(results, "rankingSnippetId");
                //TODO is what is snippetIds?  AN array or what does it need to pass in?
                db.getSnippets(snippetIds, function(data){
                    //Merge the names of the snippets from data into results
                    _.each(results, function (result){
                        var found = _.findWhere(data, {snippetId: result.snippetId});
                        result.displayName = found.displayName;
                    });
                    res.json(results);
                })
            });
        }
    );

    // get information about a snippet
    api_routes.get('/snippet/:snippetId',
       function (req, res) {
            db.getSnippet(req.params.snippetId, function(err, snippet) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving snippet: ' + (err.message || err)});
                }
                if (!snippet) {
                    return res.status(204).json({error: 'Snippet not found'});
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
                    return res.status(500).json({error: 'Error adding snippet to database: ' + (err.message || err)});
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
                    return res.status(500).json({error: 'Error adding snippet to database: ' + (err.message || err)});
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
                    console.warn(err.message);
                }
                azureStorage.deleteFolder(req.params.snippetId, function(err, result) {
                    if (err) {
                        return res.status(500).json({error: 'Error removing snippet files from blob storage: ' + (err.message || err)});
                    }
                    res.json("");
                });
            });
        }
    );

    // delete all marked (soft deleted) snippets and files
    api_routes.delete('/cleanup-marked-snippets-files', restrict,
        function (req, res) {
            var error = null;
            // cleanup (deleted) marked snippets and all related files first
            db.cleanupSnippets(function (err, result){
                if (err) {
                    console.warn(err.message);
                    error = err;
                }
                azureStorage.deleteFolders(result.removedSnippets, function(err, result) {
                    if (err) {
                        console.warn(err.message);
                        error = err;
                    }
                    // then cleanup marked files that remain after cleaning up snippets and related files
                    azureStorage.cleanupFiles(function (err, result) {
                        if (err) {
                            console.warn(err.message);
                            error = err;
                        }
                        if (error) {
                            return res.status(500).json({error: 'Error cleaning up snippets and/or files: ' + (err.message || err)});
                        }
                        res.json("");
                    });
                });
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
                    return res.status(500).json({error: 'Error retrieving snippet from database: ' + (err.message || err)});
                }
                if (!snippet) {
                    return res.status(204).json({error: 'Snippet not found'});
                }
                //Get file list once we are putting files
                azureStorage.getListOfFilesInFolder(req.params.snippetId, function(err, result, response) {
                    if (err) {
                        return res.status(500).json({error: 'Error retrieving snippet file(s) from database: ' + (err.message || err)});
                    }
                    if(result){     //if files exist
                        snippet.files = result;
                    } else {
                        snippet.files = [];
                    }
                    snippet._id = req.params.snippetId;
                    snippet.owner = snippet.owner || "unknown";
                    snippet.postedOn = snippet.postedOn || "unknown";
                    snippet.imageUrlPrefix = authConf.azure.blobStorage.url;
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
            var content = req.body.content || " "; // we need to at least have a space as content or it won't save a file.
            var metaData = generateMetaData(req.params.fileName, content);

            azureStorage.addUpdateFileByText(req.params.snippetId, req.params.fileName, content, metaData, function (err, content){
                if (err) {
                    return res.status(500).json({error: 'Error creating file: ' + (err.message || err)});
                }
                res.json({});
            })
        }
    );

    // upload and add a snippet file
    api_routes.post('/snippet-detail/:snippetId', restrict,
        function (req, res) {
            var busboy = new Busboy({ headers: req.headers });

            busboy.on('file', function(fieldName, file, fileName, encoding, mimetype) {
                var metaData = {};
                var fileSize = Number(req.headers['content-length']) * 2;
                var fileBuffer = new Buffer('');

                file.on('data', function(data) {
                    console.log('File [' + fileName + '] uploaded ' + data.length + ' bytes');
                    fileBuffer = Buffer.concat([fileBuffer, data]);
                    metaData = generateMetaData(fileName, null, fileBuffer, fileSize);
                });

                file.on('end', function() {
                    azureStorage.addUpdateFileByText(req.params.snippetId, fileName, fileBuffer, metaData, function(err, result) {
                        if (err) {
                            return res.status(500).json({error: 'Error creating file: ' + (err.message || err)});
                        }
                        res.json({});
                    });
                    console.log('File [' + fileName + '] upload finished.');
                });

            });

            req.pipe(busboy);
        }
    );

    // update contents of a snippet file
    api_routes.put('/snippet-detail/:snippetId/:fileName', restrict, textParser,
        function (req, res) {
            var content = req.body.content || " "; // we need to at least have a space as content or it won't save a file.
            var metaData = generateMetaData(req.params.fileName, content, null, null);

            azureStorage.addUpdateFileByText(req.params.snippetId, req.params.fileName, content, metaData, function (err, content){
                if (err) {
                    return res.status(500).json({error: 'Error updating file: ' + (err.message || err)});
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
                    return res.status(500).json({error: 'Error retrieving file: ' + (err.message || err)});
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
                    return res.status(500).json({error: 'Error deleting file: ' + (err.message || err)});
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
                    return res.status(500).json({error: 'Error searching: ' + (err.message || err)});
                }
                if (!results || !results[0]) {  //no results so just return
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
                if (err) {
                    return res.status(500).json({error: 'Error: ' + (err.message || err)});
                }
                res.json(ratingAvg);
            });
        }
    );

    api_routes.get('/ratings/:snippetIds',
        function (req, res) {
            var sIds = decodeURIComponent(req.params.snippetIds).split(",");
            db.getSnippetsRatingsAvg(sIds, function (err, ratings) {
                if (err) {
                    return res.status(500).json({error: 'Error: ' + (err.message || err)});
                }
                res.json(ratings);
            });
        }
    );

    api_routes.get('/rating/:snippetId/:user',
        function (req, res) {
            getSnippetRatingByUser(req.params, function(err, rating){
                if (err) {
                    return res.status(500).json({error: 'Error: ' + (err.message || err)});
                }
                res.json(rating);
            });

        }
    );

    //HIGHEST RANKED SNIPPET Add the rankingDelta to the snippet's ranking
    function highestRankedSnippet(req, res, snippet, oldRating, next) {
        //Get the old rating's weight and * it by the oldRating to get the old rating's calculated weighted value
        var oldRatingWeight = stats.weights.snippet[Math.trunc(oldRating.rating)];

        //Get the new ratings weight and * it by the new rating to get the newWeightedRating
        var newRating = req.body.rating;
        var newRatingWeight = stats.weights.snippet[Math.trunc(newRating)];
        var rankingDelta = newRatingWeight - oldRatingWeight;
        var ratingRank = snippet.ratingRank ? snippet.ratingRank + rankingDelta : rankingDelta;
        var ratingRankObj = {
            rankingSnippetId: snippet.snippetId,
            ratingRank: ratingRank
        };
        db.addUpdateSnippetRank(ratingRankObj, function (err, result) {
            if (err) {
                return res.status(500).json({error: 'Error adding ranking to snippet: ' + (err.message || err)});
            }
            next && next();
        })
    }

    // Check to see if this user has ranked this before
    // calculate the rank the user is adding based on the weight
    //  if user has ranked it add the difference, else add the new rank to this snippets rank value.
    function bestContributor(req, res, snippet, oldRating, next) {
        //BEST CONTRIBUTOR Add the rankingDelta to the user's ranking
        //Get the old rating's weight and * it by the oldRating to get the old rating's calculated weighted value
        var oldRatingWeight = stats.weights.contributor[Math.trunc(oldRating.rating)];

        //Get the new ratings weight and * it by the new rating to get the newWeightedRating
        var newRating = req.body.rating;
        var newRatingWeight = stats.weights.contributor[Math.trunc(newRating)];
        //There should always be a snippet
        //GET user so we can get the current ranking of the user //BEST CONTRIBUTOR
        db.findUsers({username: snippet.owner}, function (err, users) {
            //Since we are looking up by username and not userID we need to use findUsers instead of findUser.  Ideally we'd have the userId on the snippet.
            if (err) {
                return res.status(500).json({error: 'Error adding ranking to user: ' + (err.message || err)});
            }

            if (users.length != 1) {
                return res.status(500).json({error: 'Error adding ranking to user because user was not found!'});
            }
            var rankingDelta = newRatingWeight - oldRatingWeight;
            users[0].ratingRank = users[0].ratingRank ? users[0].ratingRank + rankingDelta : rankingDelta;
            //write the new ranking to the user.
            db.addUpdateUser(users[0], function (err, result) {
                if (err) {
                    return res.status(500).json({error: 'Error updating ranking to user: ' + (err.message || err)});
                }
                next && next();
            })
        });
    }

    // create or update snippet rating (POST)
    api_routes.post('/rating/:snippetId', restrict,
        function (req, res) {
            //BestContributor
            //Look up the old rating if there was one
            req.body.user = req.body.rater; //We have to look up by the user not the rater when we make this call
            getSnippetRatingByUser(req.body, function(err, oldRating){
                if (err) {
                    return res.status(500).json({error: 'Error adding rating to database while getSnippetRatingByUser: ' + (err.message || err)});
                }
                if(oldRating == 0){
                    oldRating = {
                        rating : 0
                    };

                }
                db.addUpdateSnippetRating(req.body, function (err) {
                    if (err) {
                        return res.status(500).json({error: 'Error adding rating to database: ' + (err.message || err)});
                    }
                    //We have to get the snippet so 1) we know who the owner of the snippet that is being rated for BEST Contributor and 2) so we have it's ratingRank for HighestRankedSnippet.
                    db.getSnippet(req.body.snippetId, function (err, snippet) {
                        if (!snippet) {
                            return res.status(500).json({error: 'Error adding ranking to user or snippet.  Snippet not found!'});
                        }

                        bestContributor(req, res, snippet, oldRating, function () {
                            highestRankedSnippet(req, res, snippet, oldRating, function() {
                                res.json({});
                            });
                        });
                    });
                });
            });

        }
    );

    api_routes.get('/users/rating-rank',
        //return the authenticated user
        function (req, res) {
            db.getUserRankings(function(err, result){
                if (err) {
                    return res.status(500).json({error: 'Error getting rankings from database: ' + (err.message || err)});
                }
                res.json(result);
            });
        }
    );

    api_routes.get('/authenticated-user',
        //return the authenticated user
        function (req, res) {
            return res.send(req.user);
        }
    );

    // run the azure search indexers where indexType is: db | file
    api_routes.get('/indexer/:indexType',
        function (req, res) {
            azureSearch.runIndexer(req.params.indexType, function (err, results) {
                if (err) {
                    return res.status(500).json({error: 'Error running indexer ('+req.params.indexType+'): ' + (err.message || err)});
                }
                res.json({});
            });
        }
    );

    app.use('/api', api_routes);
};
