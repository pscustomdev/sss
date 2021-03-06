var debug = require('debug')('sss');
var config = require('../config');
var auth_conf = require('../auth/auth-conf');
var _ = require('underscore');
var mongoskin = require('mongoskin');
var db = mongoskin.db(auth_conf.mongo.uri, { safe:true }); //we use auth_conf because there is a key in the URL for azure
var userCollectionName = "sessions";
var rankingsCollection = "sessions";
var ratingsCollection = "sessions";
var LIMIT_NUM = 100;

exports.addUpdateUser = function (profile, next) {
    //We first check to see if the user exists before we Add it.
    db.collection(userCollectionName).update({id: profile.id}, profile, {upsert: true},
        function (err, object) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, object);
        }
    );
};

exports.removeUser = function (user, next) {
    db.collection(userCollectionName).remove({email: user.email}, function (err) {
        next(err);
    });
};

exports.removeAllUsers = function (next) {
    db.collection(userCollectionName).remove(
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
    db.collection(userCollectionName).find(queryObject).toArray(function (err, users) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, users);
    });
};

exports.findUser = function (id, next) {
    db.collection(userCollectionName).findOne({id: id}, function (err, user) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, user);
    });
};

exports.getUserRankings = function(next) {
    db.collection(userCollectionName).find().sort({userRatingRank: -1}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, results);
    });
};

exports.addUpdateSnippetRank = function (snippet, next) {
    db.collection(rankingsCollection).update({rankingSnippetId: snippet.rankingSnippetId}, {
            rankingSnippetId: snippet.rankingSnippetId,
            snippetRatingRank: snippet.snippetRatingRank
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

exports.getSnippetRankings = function(next) {
    db.collection(rankingsCollection).find().sort({snippetRatingRank: -1}).limit(LIMIT_NUM).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, results);
    });
};

exports.getSnippetRank = function (id, next) {
    db.collection(rankingsCollection).findOne({rankingSnippetId: id},
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, result);
        }
    );
};

// Delete the snippet from the collection
exports.removeSnippetRank = function (id, next) {
    db.collection(rankingsCollection).remove({rankingSnippetId: id},
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            next(err, result);
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
    //SnippetIds is array
    db.collection('snippets').find({snippetId: {$in: snippetIds}}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        next(err, results);
    });
};

exports.getSnippetsByLatestDate = function (next) {
    db.collection('snippets').find().sort({postedOn: -1}).limit(LIMIT_NUM).toArray(function (err, results) {
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
            exports.removeSnippetRating(id, function(err, result) {
                if (err) {
                    console.warn(err.message);
                    next(err, null);
                }
                exports.removeSnippetRank(id, function(err, result) {
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
        var removedSnippets = "";
        if (results && results.length > 0) {
            removedSnippets = _.pluck(results, "snippetId");
            results.forEach(function(snippet){
                exports.removeSnippet(snippet.snippetId, function(err, result) {
                    if (err) {
                        console.warn(err.message);
                    }
                    next(err, {"removedSnippets": removedSnippets});
                });
            });
        } else {
            next(err, {"removedSnippets": removedSnippets});
        }
    });
};

exports.addUpdateSnippetRating = function (rating, next) {
    db.collection(ratingsCollection).update({
            ratingSnippetId: rating.snippetId,
            rater: rating.rater
        }, {ratingSnippetId: rating.snippetId, rater: rating.rater, rating: rating.rating}, {upsert: true},
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
    db.collection(ratingsCollection).find({ratingSnippetId: id}).toArray(function (err, results) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        //We are going to populate the snippetId with the ratingsSnippetId so all downstream calls will work.
        //We do this because we are now combining snippets and ratings collections.
        _.each(results, function(result) {
            result.snippetId = result.ratingSnippetId
        });
        next(err, results);
    });
};

exports.removeSnippetRating = function (id, next) {
    db.collection(ratingsCollection).remove({ratingSnippetId: id},
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
    db.collection(ratingsCollection).find({ratingSnippetId: id}).toArray(function (err, ratings) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        var obj = {};
        obj.rating = calcAvgRatingForSnippet(ratings);
        obj.count = ratings.length;
        next(err, obj);
    });
};

exports.getSnippetsRatingsAvg = function (snippetIds, next) {
    var returnedRatings = [];
    db.collection(ratingsCollection).find({ratingSnippetId: {$in: snippetIds}}).toArray(function (err, ratings) {
        if (err) {
            console.warn(err.message);
            next(err, null);
        }
        if (!ratings || !ratings[0]) {
            ratings = [];
        }
        var ratingsGrouped = _.groupBy(ratings, 'ratingSnippetId');
        _.each(ratingsGrouped, function (ratings) {
            returnedRatings.push({
                snippetId: ratings[0].ratingSnippetId,
                rating: calcAvgRatingForSnippet(ratings)
            });
        });
        next(err, returnedRatings);
    });

};

exports.getSnippetRatingByUser = function (userRating, next) {
    //We do this because we combined the ratings and snippets collection
    userRating.ratingSnippetId = userRating.snippetId;
    delete userRating.snippetId;
    db.collection(ratingsCollection).findOne(userRating,
        function (err, result) {
            if (err) {
                console.warn(err.message);
                next(err, null);
            }
            if (!result) {
                result = 0;
            }
            result.snippetId = result.ratingSnippetId;
            next(err, result);
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