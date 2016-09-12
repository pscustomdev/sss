var auth_config = require('../auth/auth-conf');
var request = require('request');
var _ = require('underscore');

var azureSearchUrl = auth_config.azure.search.url;

var fileIndex = "sssblob-index";
// var snippetIndex = "sssblob-index";
var snippetIndex = "sssdb-index";

exports.searchSnippets = function (searchTerms, next) {
    var highlightedFields = "readme,description,displayName";
    //Call to get snippets from mongo
    searchSnippets(snippetIndex, searchTerms, highlightedFields, function(err, snippetResults){
        highlightedFields = "content";
        //Call to get any matching files from the blob storage.
        searchSnippets(fileIndex, searchTerms, highlightedFields, function(err, filesResults){
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
                if(snippetResult) {
                    var fileName = fileResult.metadata_storage_name;
                    snippetResult['@search.highlights'][fileName] = fileResult['@search.highlights'].content;
                } else {
                    fileResult.snippetId = fileSnippetId;
                    snippetResults.push(fileResult)
                }
            });
            next(err, snippetResults);
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