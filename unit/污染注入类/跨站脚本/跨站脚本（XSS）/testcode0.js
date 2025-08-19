var express = require('express');
var router = express.Router();

router.get('/search', function(req, res) {
    // SOURCE
    var query = req.query.q;
    // SINK
    res.send('<h1>Search Results for: ' + query + '</h1>');
});

router.post('/comment', function(req, res) {
    // SOURCE
    var comment = req.body.comment;
    // SINK
    res.send('<div class="comment">' + comment + '</div>');
});