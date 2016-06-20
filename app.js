var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var expressSession = require('express-session');
var connectMongo = require('connect-mongo');
var MongoStore = connectMongo(expressSession);
var config = require(path.join(__dirname, 'config'));

var tingo = require('tingodb')();
var sssDB = new tingo.Db('mongoDBFiles', {});

var app = express();
app.set('development', process.env.NODE_ENV === 'dev');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession(
    {
        secret: "softwaresnippetsearch",
        saveUninitialized: false,
        resave: false,
        store: new MongoStore({db:sssDB}),
        cookie: {maxAge: config.cookieMaxAge}
    }
));

// Configure routing
require(path.join(__dirname, 'routes'))(app);

module.exports = app;