module.exports = function() {
    var passport = require('passport');
    var GithubStrategy = require('passport-github').Strategy;
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    var auth_conf = require('../auth/auth-conf');
    var db = require('../db/mongo-dao');


    //Github Strategy
    passport.use(new GithubStrategy({
            clientID: auth_conf.github.clientID,
            clientSecret: auth_conf.github.clientSecret,
            callbackURL: auth_conf.github.callbackUrl
        },
        function(accessToken, refreshToken, profile, done) {
            db.findUser(profile.id, function(err, user) {
                if (err) {              // Log errors, if any
                    console.log(err);
                }
                if (!err && user) {     // No Error and found a User, just continue
                    done(null, user);
                } else {                // Have an Error OR didn't find a User, save User to local database
                    profile.provider = "github";
                    profile.name = profile._json.name;
                    profile.email = profile._json.email;
                    profile.createdAt = profile._json.created_at;
                    createUser(profile, done);
                }
            });
        }
    ));

    // GOOGLE Strategy
    passport.use(new GoogleStrategy({
            clientID        : auth_conf.google.clientID,
            clientSecret    : auth_conf.google.clientSecret,
            callbackURL     : auth_conf.google.callbackUrl
        },
        function(token, refreshToken, profile, done) {
            // try to find the user based on their google id
            db.findUser(profile.id, function(err, user) {
                if (err) {              // Log errors, if any
                    console.log(err);
                }
                if (!err && user) {     // No Error and found a User, just continue
                    done(null, user);
                } else {                // Have an Error OR didn't find a User, save User to local database
                    // if the user isnt in our database, create a new user
                    // set all of the relevant information
                    profile.username = profile.emails[0].value; // pull the first email
                    profile.name = profile.displayName;
                    profile.email = profile.emails[0].value; // pull the first email
                    profile.provider = "google";
                    profile.token = token;
                    createUser(profile, done);
                }
            });
        }));

     function createUser(profile, done) {
         user = {            // Normalize data into our own local user
             id: profile.id,
             username: profile.username,
             name: profile.name,
             email: profile.email,
             created: profile.createdAt,
             provider: profile.provider,
             localCreation: Date(),
             password: profile.password
         };
         db.addUser(user, function (err) {
             if (err) {
                 console.log(err);
             } else {
                 console.log("added new user: " + user.username);
                 done(null, user);
             }
         });
     }

    passport.serializeUser(function(profile, done) {
        console.log('serializeUser: ' + JSON.stringify(profile));
        done (null, profile);
    });

    passport.deserializeUser(function(profile, done) {
        console.log("deserializeUser id: " + profile.id);
        db.findUser(profile.id, function(err, user) {
            if (!err) {
                done (null, user);
            } else {
                done (err, null);
            }
        });
    });
};