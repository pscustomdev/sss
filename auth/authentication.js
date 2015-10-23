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
            console.log("LOGGING: " + profile.id);
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

    passport.serializeUser(function(user, done) {
        console.log('serializeUser: ' + user);
        done (null, user);
    });

    passport.deserializeUser(function(id, done) {
        console.log("deserializeUser id: " + JSON.stringify(id));
        done(null, {
            oauthID: id,
            name: 'blah blah',
            created: Date.now(),
            email: 'blah@utopia.com',
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