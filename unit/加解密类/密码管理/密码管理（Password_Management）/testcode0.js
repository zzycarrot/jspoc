var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

var users = [];

// Vulnerable user registration
app.post('/register', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password; // Password in plaintext
    
    // SINK - Storing plaintext password
    users.push({ username: username, password: password });
    
    fs.writeFileSync('users.json', JSON.stringify(users));
    res.send('User registered successfully');
});

// Vulnerable authentication
app.post('/login', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    var user = users.find(u => u.username === username);
    
    // SINK - Comparing plaintext passwords
    if (user && user.password === password) {
        res.send('Login successful');
    } else {
        res.send('Invalid credentials');
    }
});

app.listen(3000);