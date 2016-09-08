var auth_config = require('../auth/auth-conf');
var request = require('request');


var azureSearchUrl = auth_config.azure.search.url;
var fileIndex = "sss-snippet-files-index";
var snippetIndex = "sssdb-index";


exports.searchSnippets = function (searchTerms, next) {
    var highlightedFields = "readme,description,displayName";
    var url = azureSearchUrl +
        "/indexes/" + snippetIndex +
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
        var results = JSON.parse(body).value;
        next(err, results);
    });

};