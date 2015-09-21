var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var expressSession = require('express-session');
var flash = require('connect-flash');
var connectMongo = require('connect-mongo');
var config = require('./config');
// **************************************************************
// ********* DEBUGGING HELP FOR HANDLEBARS JS *******************
if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
  var hbs = require('hbs');
  hbs.registerHelper("debug", function (optionalValue) {
    var currentdate = new Date();
    var datetime =
        currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds() + " "
        + (currentdate.getMonth()+1) + "/"
        + currentdate.getDate() + "/"
        + currentdate.getFullYear();
    console.log("");
    console.log("=========================================================");
    console.log(datetime);
    console.log("==================== Current Context (START) ============");
    console.log(this);
    console.log("==================== Current Context (END) ==============");

    if (optionalValue) {
      console.log("");
      console.log("==================== Optional Value (START) =============");
      console.log(optionalValue);
      console.log("==================== Optional Value (END) ===============");
    }
    console.log("=========================================================");
    console.log("\n\n");
  });
}
// **************************************************************

// code to be included in rendered page, depending on which route is being traversed
var routes = require('./routes/index');
var users = require('./routes/users');
var main = require('./routes/main');
var api = require('./routes/api');

var MongoStore = connectMongo(expressSession);

var passportConfig = require('./auth/passport-config');
passportConfig();

var app = express();

// change value to match the environment the current code is being deployed to ('development' or 'production')
app.set('production', process.env.NODE_ENV === 'production');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressSession(
    {
      secret: "blah",
      saveUninitialized: false,
      resave: false,
      store: new MongoStore({url: config.mongoUri})
    }
));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// route configuration for each url
app.use('/', routes);
app.use('/users', users);
app.use('/sss', main);
app.use('/api', api);

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
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;