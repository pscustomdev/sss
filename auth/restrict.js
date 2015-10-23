module.exports = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.returnTo = req.url;  // This sets the 'returnTo' session parameter to the current destination url, which passport respects after a successful login
    res.redirect('/login');
};