module.exports = function() {
    var passport = require('passport');
    var GithubStrategy = require('passport-github').Strategy;
    var auth_conf = require('../auth/auth-conf');
    var db = require('../db/mongo-dao');

    passport.use(new GithubStrategy({
            clientID: auth_conf.github.clientID,
            clientSecret: auth_conf.github.clientSecret,
            callbackURL: auth_conf.github.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            db.findUser({ id: profile.id }, function(err, user) {
                if (err) {              // Log errors, if any
                    console.log(err);
                }
                if (!err && user) {     // No Error and found a User, just continue
                    done(null, user);
                } else {                // Have an Error OR didn't find a User, save User to local database
                    user = {            // Normalize data into our own local user
                        id: profile.id,
                        username: profile.username,
                        name: profile._json.name,
                        email: profile._json.email,
                        created: profile._json.created_at,
                        localCreation: Date(),
                        password: profile.password
                    };
                    db.addUser(user, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("added new user: " + user.username);
                            done(null, user);
                        }
                    });
                }
            });
        }
    ));

    passport.serializeUser(function(profile, done) {
        console.log('serializeUser: ' + JSON.stringify(profile));
        done (null, profile);
    });

    passport.deserializeUser(function(profile, done) {
        console.log("deserializeUser id: " + profile.id);
        db.findUser({id:profile.id}, function(err, user) {
            if (!err) {
                done (null, user);
            } else {
                done (err, null);
            }
        });
    });
};