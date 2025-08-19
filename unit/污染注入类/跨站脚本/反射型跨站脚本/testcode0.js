var express = require('express');
var router = express.Router();

router.get('/search', function(req, res) {
    // SOURCE
    var searchTerm = req.query.term;
    
    // SINK
    res.send('<h1>Search Results for: ' + searchTerm + '</h1>');
});

module.exports = router;