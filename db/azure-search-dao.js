var auth_config = require('../auth/auth-conf');
var request = require('request');
var db = require('../db/mongo-dao');
var _ = require('underscore');

var azureSearchUrl = auth_config.azure.search.url;

var snippetIndex = "sssdb-index";
var fileIndex    = "sssblob-index";

exports.searchSnippets = function (searchTerms, next) {
    var highlightedFields = "readme,description,displayName";
    //Call to get snippets from mongo
    searchSnippets(snippetIndex, searchTerms, highlightedFields, function(err, snippetResults){
        if (err) {
            next(err, null);
        }
        highlightedFields = "content";
        //Call to get any matching files from the blob storage.
        searchSnippets(fileIndex, searchTerms, highlightedFields, function(err, filesResults){
            if (err) {
                next(err, null);
            }
            //Combine snippet and file search results
            _.each(filesResults, function(fileResult){
                //Extract the snippetId from the metadata_storage_path so we know which snippet the file is for.
                //Base64 decode the path
                var metaPath = new Buffer(fileResult.metadata_storage_path, 'base64').toString();
                var fileSnippetId = metaPath.split("/")[4]; //get the snippet Id from the path.

                //Check to see if the file snippet is in the snippetResults already.
                var snippetResult =  _.findWhere(snippetResults, {snippetId:fileSnippetId});
                //If it is then add the highlights with the filename to @search.highlights.
                //If not then add the snippet with the file and @searchhighlights
                // search.highlights will not be set when searching for *
                if(snippetResult && snippetResult['@search.highlights'] && fileResult['@search.highlights']) {
                    var fileName = fileResult.metadata_storage_name;
                    snippetResult['@search.highlights'][fileName] = fileResult['@search.highlights'].content;
                } else {
                    fileResult.snippetId = fileSnippetId;
                    snippetResults.push(fileResult)
                }
            });
            //Get a list of all the snippets who don't have a displayname
            var noDisplayNames = _.filter(snippetResults, function(snippet){
                return !snippet.displayName
            });

            var snippetIdsWithoutDisplayName =  _.pluck(noDisplayNames, 'snippetId');

            if(snippetIdsWithoutDisplayName && snippetIdsWithoutDisplayName.length) {
                //Get all the snippets from the db so we can get the display names
                db.getSnippets(snippetIdsWithoutDisplayName, function (err, snippets) {
                    if(err) {
                        return next(err, []);
                    }

                    //Go through each of the snippets that don't have a display name and add the displayName to them.
                    _.each(snippetResults, function (s, i) {
                        if(s && !s.displayName) {
                            var found = _.findWhere(snippets, {snippetId:s.snippetId});
                            if (found){
                                s.displayName = found.displayName || found.snippetId;
                            } else {
                                //This should never happen but if it does we don't want to display the file in the
                                // search results since it doesn't have a snippet with it. So we delete it.
                                snippetResults.splice(i, 1);
                            }
                        }
                    });
                    next(err, snippetResults);
                });
            } else {
                next(err, snippetResults);
            }
        })
    })
};


function searchSnippets(index, searchTerms, highlightedFields, next) {
    // var highlightedFields = "readme,description,displayName";
    // var highlightedFields = "content";
    var url = azureSearchUrl +
        "/indexes/" + index +
        "/docs?search=" + encodeURIComponent(searchTerms) +
        "&highlight=" + highlightedFields +
        "&api-version=2015-02-28" +
        "&searchMode=all";

    var headers = {'api-key': auth_config.azure.search.key};

    var options = {
        url: url,
        headers: headers,
        withCredentials: false
    };

    request.get(options, function(err, response, body){
        var results = "";
        var body = JSON.parse(body);

        if(body && body.value){
            results = body.value;
        } else {
            results = body.Message;
        }
        //TODO Now we need to search the files and see what we get back.
        next(err, results);
    });
};

// *** INDEXING FUNCTIONS ***
var indexersScheduled = [];
var indexerIntervalMins = 5;

// run an indexer where indexType is: db | file
exports.runIndexer = function (indexType, next) {
    var indexer = "";
    if (indexType == "db") {
        indexer = snippetIndex;
    }
    if (indexType == "file") {
        indexer = fileIndex;
    }
    indexer += "er";  // we name the indexer the same as the index with the "er" at the end

    scheduleIndexer(indexer);
    next(null, "");
};

// schedule the indexer to run in indexerIntervalMins minutes if it is not already scheduled
// if an error occurs indicating that it has run recently, schedule it again
function scheduleIndexer(indexer) {
    // if the index has already been scheduled, ignore the request
    if (_.contains(indexersScheduled, indexer)) { return; }

    console.info(new Date().toLocaleTimeString() + ": Scheduling indexer to run in " + indexerIntervalMins + " minutes: " + indexer);
    indexersScheduled.push(indexer);
    // schedule the indexer run for indexerIntervalMins minutes
    setTimeout(function() {
        performIndexing(indexer, function(err, result) {
            // result that is not empty indicates it has run recently so reschedule it
            if (result && result.length > 0 && result.indexOf("indexer")) {
                console.info("Warning running indexer: " + indexer + "; rescheduling. (" + err.message + " :: " + result + ")");
                indexersScheduled = _.without(indexersScheduled, indexer);
                scheduleIndexer(indexer);
            } else {
                indexersScheduled = _.without(indexersScheduled, indexer);
                console.info(new Date().toLocaleTimeString() + ": Indexer completed: " + indexer);
            }
        });
    },1000*60*indexerIntervalMins);
}

function performIndexing(indexer, next) {
    var url = azureSearchUrl + "/indexers/" + indexer + "/run?&api-version=2015-02-28";
    var headers = {'api-key': auth_config.azure.search.key};
    var options = {
        url: url,
        headers: headers,
        withCredentials: false
    };

    request.post(options, function(err, response, _body){
        if (err) {
            console.warn(err.message);
            next(err, err.message);
        }
        if (response && response.statusCode == 202) {
            return next(null, "");
        }
        var body = {};
        if (_body.length > 0) {
            body = JSON.parse(_body);
        }
        if(body && body.error && body.error.message){
            console.warn(body.error.message);
            next(body.error, body.error.message);
        } else {
            next(err, "");
        }
    });
}
