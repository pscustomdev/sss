var debug = require('debug')('sss');
var config = require('../config');
var auth_conf = require('../auth/auth-conf');
var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db(auth_conf.mongo.uri, { safe:true }); //we use auth_conf because there is a key in the URL for azure
var azureStorage = require('../db/azure-storage-dao');

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
                console.warn(err.message);
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
        }
        next(err, users);
    });
};

exports.findUser = function (id, next) {
    db.collection("users").findOne({id: id}, function (err, user) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, user);
    });
};

exports.addUpdateSnippet = function (snippet, next) {
    db.collection("snippets").update({snippetId: snippet._id}, {
            snippetId: snippet._id,
            owner: snippet.owner,
            displayName: snippet.displayName,
            postedOn: Date.now(),
            description: snippet.description,
            readme: snippet.readme,
            deleted: snippet.deleted != "true" ? "false" : snippet.deleted
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
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.getSnippets = function (snippetIds, next) {
    db.collection('snippets').find({snippetId: {$in: snippetIds}}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, results);
    });
};

exports.getSnippetsByOwner = function (owner, next) {
    db.collection('snippets').find({owner: owner}).sort({displayName: -1}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, results);
    });
};

// Delete the snippet from the collection
exports.removeSnippet = function (id, next) {
    db.collection('snippets').remove({snippetId: id},
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            // remove all snippet files
            azureStorage.deleteFolder(id, function(err, result) {
                if (err) {
                    console.warn(err.message);
                    next(err, null);
                }
                exports.removeSnippetRating(id, function(err, result) {
                    if (err) {
                        console.warn(err.message);
                        next(err, null);
                    }
                    next(err, "");
                });
            });
        }
    );
};

// WARNING: This will remove the entire snippet collection
// TODO When doing this, we should also delete all folders in the blob storage
exports.removeAllSnippets = function (next) {
    db.collection('snippets').remove(
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, result);
        }
    );
};

// delete all marked snippets and related files
exports.cleanupSnippets = function (next) {
    // iterate through all soft deleted snippets
    db.collection('snippets').find({deleted: "true"}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        if (results && results.length > 0) {
            results.forEach(function(snippet){
                exports.removeSnippet(snippet.snippetId, function(err, result) {
                    if (err) {
                        console.warn(err.message);
                    }
                    next(err, "");
                });
            });
        } else {
            next(err, "");
        }
    });
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

exports.getSnippetRatings = function (id, next) {
    db.collection('ratings').find({snippetId: id}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, results);
    });
};

exports.removeSnippetRating = function (id, next) {
    db.collection('ratings').remove({snippetId: id},
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.getSnippetRatingsAvg = function (id, next) {
    db.collection('ratings').find({snippetId: id}).toArray(function (err, ratings) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, calcAvgRatingForSnippet(ratings));
    });
};

exports.getSnippetsRatingsAvg = function (snippetIds, next) {
    var returnedRatings = [];
    db.collection('ratings').find({snippetId: {$in: snippetIds}}).toArray(function (err, ratings) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        if (!ratings || !ratings[0]) {
            ratings = [];
        }
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
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            if (!result) {
                result = 0;
            }
            next(err, result);
        }
    );
};

// WARNING: This removes all ratings
exports.removeAllRatings = function (next) {
    db.collection('ratings').remove(
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, result);
        }
    );
};

exports.createIndex = function (collection, index, next ) {
    db.createIndex("snippets",{"description":"text"},
        function(err, result){
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
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
    if (snippetRatings && snippetRatings[0]) {
        var ratings = _.pluck(snippetRatings, 'rating'); //get an array of only the ratings
        var sum = ratings.reduce(function (a, b) {
            return a + b;
        });
        avg = sum / ratings.length;
    }

    return avg;
}