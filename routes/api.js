var express = require('express');
var router = express.Router();
var restrict = require('../auth/restrict');
var gh = require('../db/github-dao');

router.get('/snippets', restrict, function(req, res, next) { 
    gh.getRepos(function(err, repos){
        if (err) {
            return res.status(500).json({error: 'Error retrieving repositories'});    
        }
        res.json(repos);
    });
});

router.get('/snippet-overview/:snippetId', restrict, function(req, res, next) { 
    gh.getRepoContents(req.params.snippetId, function(err, repos) {
        if (err) {
            return res.status(500).json({error: 'Error retrieving repositories'});    
        }
        res.json(repos);
    });
});

router.get('/snippet-detail/:snippetId/:fileName', restrict, function(req, res, next) { 
    gh.getRepoFile(req.params.snippetId, req.params.fileName, function(err, repos) {
        if (err) {
            return res.status(500).json({error: 'Error retrieving repositories'});    
        }
        res.json(repos);
    });
});

router.get('/snippet-search', restrict, function(req, res, next) { 
    console.log("WE ARE IN SNIPPET-SEARCH!!!!!!!!!!");
    var searchTerm = req.query.q;
    console.log("searchTerm: " + searchTerm);
    gh.searchCode(searchTerm, function(err, repos){
        if (err) {
            return res.status(500).json({error: 'Error retrieving repositories'});    
        }
        res.json(repos);
    });
});

module.exports = router;