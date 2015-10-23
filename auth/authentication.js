module.exports = function() {
    var passport = require('passport');
    var GithubStrategy = require('passport-github').Strategy;
    var auth_config = require('../auth/auth-conf');
    var db = require('../db/mongo-dao');

    passport.use(new GithubStrategy({
            clientID: auth_config.github.clientID,
            clientSecret: auth_config.github.clientSecret,
            callbackURL: auth_config.github.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            done(null, profile);
            //db.findById({_id:profile.id}, function(err, user) {
            //    if (err) {  // Log errors, if any
            //        console.log(err);
            //    }
            //    if (!err && user != null) {  // No Error and found a User, just continue
            //        done(null, profile);
            //        //done(null, user);
            //    } else {    // Have an Error OR didn't find a User, save User to local database
            //        var _user = {
            //            oauthID: profile.id,
            //            name: profile.displayName,
            //            created: Date.now(),
            //            email: profile.email,
            //            password: 'none'
            //        };
            //        db.addUser(_user, function(err) {
            //            if (err) {
            //                console.log(err);
            //            } else {
            //                console.log("adding new user ...");
            //                done(null, profile);
            //                //done(null, _user);
            //            }
            //        });
            //    }
            //});
        }
    ));

    passport.serializeUser(function(profile, done) {
        console.log('serializeUser: ' + JSON.stringify(profile));
        done (null, profile);
    });

    passport.deserializeUser(function(profile, done) {
        console.log("deserializeUser id: " + profile.id);
        done(null, {
            oauthID: profile.id,
            username: profile.username,
            name: profile._json.name,
            email: profile._json.email,
            created: Date.now(),
            password: 'none'
        });
        //db.findById({_id:id}, function(err, user) {
        //    if (!err) {
        //        done (null, user);
        //    } else {
        //        done (err, null);
        //    }
        //});

    });
};