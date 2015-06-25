var express = require('express');
var router = express.Router();
var db = require('../db/mongo-dao');
var passport = require('passport');

/* GET users listing. */
router.get('/create', function(req, res, next) {
    res.render('users/create');
});

router.post('/create', function(req, res, next) {
     db.addUser(req.body, function(err, users){
        if (err) {
            var vm = {
                title: "Create an acccount",
                input: req.body,
                error: err
            };
            delete vm.input.password;
            return res.render("users/create", vm);    
        } 
        
        req.login(req.body, function (err) {
            if (err) {
                console.log("failed login: " + err);
                return res.redirect('/');
            }
            res.redirect('/main');    
        });  
    });
});

// router.post('/login', function(req, res, next) {
//   req.session.orderId = 123456;
//   if (req.body.rememberMe) {
//     req.session.cookie.maxAge = config.cookieMaxAge;
//   }
//   next();
// }, passport.authenticate('local', {failureRedirect:'/', failureFlash: 'Invalid credentials', successRedirect:'/orders'}));

router.post('/login', function(req, res, next) {
    next();    
    }, passport.authenticate('local', {
        failureRedirect: '/', 
        successRedirect: '/main',
        failureFlash: 'Invalid credentials'
}));

router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
