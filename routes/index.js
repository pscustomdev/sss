module.exports = function (app) {
    var path = require('path');
    var flash = require('connect-flash');
    var passport = require('passport');
    var setupAuthStrategy = require(path.join(__dirname, '../auth/authentication'));

    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    setupAuthStrategy();

    // Configure standard routes
    require('../routes/main')(app, passport);
    // Setup Router-Groups
    require('../routes/api')(app, passport);

    // Default route configurations
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    // NODE_ENV is the environment variable to set. Default is "development"
    if (app.get('env') === 'dev' || app.get('env') === 'development') {
        app.use(function(err, req, res) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
};