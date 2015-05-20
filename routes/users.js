var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/create', function(req, res, next) {
    res.render('users/create');
});

router.post('/create', function(req, res, next) {
    var somethingGoesWrong = false;
    if (somethingGoesWrong) {
        var vm = {
            title: "Create an acccount",
            input: req.body,
            error: "Something went wrong"
        };
        delete vm.input.password;
        return res.render("users/create", vm);
    }
    res.redirect('/main');
});

module.exports = router;
