var express = require('express');
var app = express();

app.get('/setcookie', function(req, res) {
    // SOURCE
    var userToken = req.query.token;
    
    // SINK - Setting cookie without secure/HttpOnly flags
    res.cookie('sessionToken', userToken);
    res.send('Cookie set');
});

app.get('/getcookie', function(req, res) {
    // SINK - Transmitting cookie over unencrypted connection
    var token = req.cookies.sessionToken;
    res.send('Your session token is: ' + token);
});

app.listen(3000);