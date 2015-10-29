// Routes starting with "/"
module.exports = function(app, passport) {
    var express = require('express');
    var main_routes = express.Router();
    var restrict = require('../auth/restrict');
    var db = require('../db/mongo-dao');

    main_routes.get('/',
        function (req, res) {
            var vm = {
                title: 'Software Snippet Search',
                user: req.user,
                error: req.flash('error'),
                isAuthenticated: req.isAuthenticated()
            };
            res.render('layout', vm);
        });
    main_routes.get('/ping',    // a convenience test route
        restrict,
        function (req, res) {
            res.status(200).send("pong!");
        });
    main_routes.get('/auth/github',
        passport.authenticate('github'));
    main_routes.get('/auth/github/callback',
        passport.authenticate('github', {
                successReturnToOrRedirect: '/',
                failureRedirect: '/login',
                failureFlash: 'Invalid credentials'
            }
        ));
    main_routes.get('/login',
        function (req, res) {
            res.redirect('/auth/github');
        });
    main_routes.get('/logout',
        function (req, res) {
            req.logout();
            req.session.destroy();
            res.redirect('/');
        });

    app.use('/', main_routes);
};