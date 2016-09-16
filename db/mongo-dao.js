var debug = require('debug')('sss');
var config = require('../config');
var auth_conf = require('../auth/auth-conf');
var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db(auth_conf.mongo.uri, { safe:true }); //we use auth_conf because there is a key in the URL for azure

exports.addUser = function (profile, next) {
    db.collection("users").find({id: profile.id}).toArray(function (err, users) {
        if (err) {
            next(err, null);
        }
        db.collection("users").insert(profile, {}, function (err, results) {
            next(err, results);
        });
    });
};

exports.removeUser = function (user, next) {
    db.collection("users").remove({email: user.email}, function (err) {
        next(err);
    });
};

exports.removeAllUsers = function (next) {
    db.collection('users').remove(
        function (err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.findUsers = function (queryObject, next) {
    db.collection("users").find(queryObject).toArray(function (err, users) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        } else {
            if (users) {
                next(err, users);
            } else {
                next("No user(s) found");
            }
        }
    });
};

exports.findUser = function (id, next) {
    db.collection("users").findOne({id: id},
        function (err, user) {
            if (user) {
                next(err, user);
            } else {
                next("User not found");
            }
        }
    );
};

exports.addUpdateSnippet = function (snippet, next) {
    db.collection("snippets").update({snippetId: snippet._id}, {
            snippetId: snippet._id,
            owner: snippet.owner,
            displayName: snippet.displayName,
            postedOn: Date.now(),
            description: snippet.description,
            readme: snippet.readme
        }, {upsert: true},
        function (err, object) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};

exports.getSnippet = function (id, next) {
    db.collection('snippets').findOne({snippetId: id},
        function (err, result) {
            if (result) {
                next(err, result);
            } else {
                next("Snippet not found");
            }
        }
    );
};

exports.getSnippets = function (snippetIds, next) {
    db.collection('snippets').find({snippetId: {$in: snippetIds}}).toArray(function (err, results) {
        if (results && results[0]) {
            next(err, results);
        } else {
            next("Snippets not found");
        }
    });
};

exports.getSnippetsByOwner = function (owner, next) {
    db.collection('snippets').find({owner: owner}).sort({displayName: -1}).toArray(function (err, results) {
        if (results && results[0]) {
            next(err, results);
        } else {
            next("Snippets not found");
        }
    });
};

exports.removeSnippet = function (id, next) {
    db.collection('snippets').remove({snippetId: id},
        function (err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.removeAllSnippets = function (next) {
    db.collection('snippets').remove(
        function (err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.addUpdateSnippetRating = function (rating, next) {
    db.collection("ratings").update({
            snippetId: rating.snippetId,
            rater: rating.rater
        }, {snippetId: rating.snippetId, rater: rating.rater, rating: rating.rating}, {upsert: true},
        function (err, object) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};

exports.updateSnippetRating = function (rating, next) {
    db.collection("ratings").update({snippetId: rating.snippetId, rater: rating.rater, rating: rating.rating},
        function (err, object) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};


exports.getSnippetRatings = function (id, next) {
    db.collection('ratings').find({snippetId: id}).toArray(function (err, results) {
        if (results && results.length > 0) {
            next(err, results);
        } else {
            console.warn(err.message);
            next("No ratings found");
        }
    });
};

exports.removeSnippetRating = function (id, next) {
    db.collection('ratings').remove({snippetId: id},
        function (err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.getSnippetRatingsAvg = function (id, next) {
    db.collection('ratings').find({snippetId: id}).toArray(function (err, ratings) {
        next(err, calcAvgRatingForSnippet(ratings));
    });
};

exports.getSnippetsRatingsAvg = function (snippetIds, next) {
    var returnedRatings = [];
    db.collection('ratings').find({snippetId: {$in: snippetIds}}).toArray(function (err, ratings) {
        var ratingsGrouped = _.groupBy(ratings, 'snippetId');
        _.each(ratingsGrouped, function (ratings) {
            returnedRatings.push({
                snippetId: ratings[0].snippetId,
                rating: calcAvgRatingForSnippet(ratings)
            });
        });
        next(err, returnedRatings);
    });

};

exports.getSnippetRatingByUser = function (userRating, next) {
    db.collection('ratings').findOne(userRating,
        function (err, result) {
            if (result) {
                next(err, result);
            } else {
                next("Rating not found");
            }
        }
    );
};

exports.removeAllRatings = function (next) {
    db.collection('ratings').remove(
        function (err, result) {
            if (err) {
                console.warn(err.message);  // returns error if no matching object found
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.createIndex = function (collection, index, next ) {
    // db.createIndex(collection,{index:"text"},
    db.createIndex("snippets",{"description":"text"},
        function(err, result){
            next(err, result)
        }
    );
};


//This is how you'd use $text for a search after creating an index.
// exports.searchSnippets = function (searchTerms, next) {
//     // db.collection('snippets').find({$text: {$search: "mocha"}}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}});
//     // db.collection('snippets').find({$text: {$search: "fakeDescription"}}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).toArray(function (err, results) {
//     db.collection('snippets').find({$text: {$search: "fakeDescription"}}).toArray(function (err, results) {
//             next(err, results)
//         }
//     );
//
// };


//This is how you'd use $regex to search for a snippet
// exports.searchSnippets = function (searchTerms, next) {
//     db.collection('snippets').find({
//         $or: [{
//                 description: {
//                     $regex: new RegExp(searchTerms),
//                     $options: 'i'
//                 }
//             },{
//                 readme: {
//                     $regex: new RegExp(searchTerms),
//                     $options: 'i'
//                 }
//             }, {
//                 displayName: {
//                     $regex: new RegExp(searchTerms),
//                     $options: 'i'
//                 }
//             }]
//     }).toArray(function (err, results) {
//         next(err, results);
//     });
// };

//TingoDB doesn't support aggregate function so we have to average it ourselves.
function calcAvgRatingForSnippet(snippetRatings){
    var avg = 0;
    if (snippetRatings && snippetRatings.length > 0) {
        var ratings = _.pluck(snippetRatings, 'rating'); //get an array of only the ratings
        var sum = ratings.reduce(function (a, b) {
            return a + b;
        });
        avg = sum / ratings.length;
    }

    return avg;
}