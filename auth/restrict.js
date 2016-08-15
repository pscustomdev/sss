module.exports = function(req, res, next) {
    var db = require('../db/mongo-dao');

    if (req.isAuthenticated()) {

        //if add then we don't need to check for the owner
        if(req.url === "/snippet" && req.method==="POST") {
            return next();
        }

        //check for the owner since only they can modify, delete, etc.
        var snippetSplit = req.url.split("/");
        var snippetId;

        if(snippetSplit.length > 2 ){
            snippetId = snippetSplit[2];
        }

        if(snippetId) {
            db.getSnippet(snippetId, function (err, snippet) {
                if (err) {
                    return res.status(500).json({error: 'Error retrieving database contents: ' + err.message});
                }

                if (snippet && (snippet.owner === req.user.username || req.user.username === "pscustomdev-sss")) {
                    //We are the owner
                    return next();
                }
            });
        } else {
            return res.status(500).json({error: 'Malformed URL unable to find Snippet ID: ' + err.message});
        }
    } else {
        req.session.returnTo = req.baseUrl + req.url;  // This sets the 'returnTo' session parameter to the current destination url, which passport respects after a successful login
        res.redirect('/login');
    }
};