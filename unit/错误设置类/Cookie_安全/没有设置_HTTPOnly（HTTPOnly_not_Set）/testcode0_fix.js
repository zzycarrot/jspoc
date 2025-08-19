var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();

app.use(cookieParser());

app.get('/login', function(req, res) {
    // SOURCE: User input comes from request query parameters
    var username = req.query.username;
    
    // VULNERABILITY: Setting cookie without HTTPOnly flag
    // SINK: Cookie set without HTTPOnly flag
    res.cookie('sessionID', 'user123_session', {
        maxAge: 900000,
        secure: true, // only sent over HTTPS
        sameSite: 'strict',
        httpOnly: true
    });
    
    res.send('Logged in successfully');
});

app.get('/profile', function(req, res) {
    var sessionCookie = req.cookies.sessionID;
    if (sessionCookie) {
        res.send('Welcome to your profile');
    } else {
        res.send('Please login first');
    }
});

app.listen(3000);