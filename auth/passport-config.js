module.exports = function() {
    var passport = require('passport');
    var passportLocal = require('passport-local');
    var db = require('../db/mongo-dao');
    var bcrypt = require('bcrypt');
    
    passport.use(new passportLocal.Strategy({usernameField:'email'}, function(email, password, next) {
        db.findUsers({email:email},function(err, users) {
            if (err) {
                console.log("err: " + err);
                return next(err);
            }
            if (!users) {
                console.log('Error logging in');
                return next(null, null);
            }
            
            bcrypt.compare(password, users[0].password, function(err, same) {
                if (err) {
                    return next(err);
                }    
                if (!same) {
                    return next(null, null);
                }
                next(null, users[0]);
            });
        });
    }));
    
    passport.serializeUser(function(user, next) {
        next(null, user.email);
    });
    
    passport.deserializeUser(function(email, next) {
        console.log("deserializeUSer email: " + JSON.stringify(email));
        db.findUsers({email:email}, function(err, users) {
            if (err) {
                return next(err);
            }
            next(err, users[0]);            
        });
    });
};