var express = require('express');
var app = express();

app.get('/download', function(req, res) {
    // SOURCE: User-controlled filename
    var file = req.query.file;
    
    // Missing X-Content-Type-Options header
    // SINK: Response without proper content-type restrictions
    res.sendFile(__dirname + '/uploads/' + file);
});

app.listen(3000);