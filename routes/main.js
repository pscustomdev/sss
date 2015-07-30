var express = require('express');
var router = express.Router();
var restrict = require('../auth/restrict');
var gh = require('../db/github-dao');

/* GET home page. */
router.get('/', restrict, function(req, res, next) { 
    var vm = {
        title: 'SSS',
        firstName: req.user ? req.user.firstName : null
    };
    res.render('main/index', vm);
});


router.get('/repos', function(req, res, next) { 
console.log('GotHere');
    gh.getRepos(function(err, repos){
console.log('GotHere1');
        if (err) {
            return res.status(500).json({error: 'Error retrieving respositories'});    
        }
        res.json(repos);
    });
});

module.exports = router;