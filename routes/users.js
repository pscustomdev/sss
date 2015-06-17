var express = require('express');
var router = express.Router();
var db = require('../db/mongo-dao');

/* GET users listing. */
router.get('/create', function(req, res, next) {
    res.render('users/create');
});

router.post('/create', function(req, res, next) {
     db.addUser(req.body, function(err, users){
        if(users){
            res.redirect('/main');   
        } else {
            var vm = {
                title: "Create an acccount",
                input: req.body,
                error: err
            };
            delete vm.input.password;
            return res.render("users/create", vm);
        }       
    });
});

module.exports = router;
