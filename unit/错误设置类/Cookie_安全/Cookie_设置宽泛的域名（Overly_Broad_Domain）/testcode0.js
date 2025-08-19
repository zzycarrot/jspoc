var express = require('express');
var router = express.Router();

router.get('/setcookie', function(req, res) {
    // SOURCE
    var userPref = req.query.pref;
    
    // Overly Broad Domain vulnerability
    // SINK
    res.cookie('user_preference', userPref, { domain: '.example.com' });
    
    res.send('Cookie set with broad domain');
});

router.get('/getcookie', function(req, res) {
    var userPref = req.cookies.user_preference;
    res.send('Your preference: ' + userPref);
});