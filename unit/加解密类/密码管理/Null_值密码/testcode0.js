var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// 模拟用户数据库
var users = [
    { username: 'admin', password: 'admin123' },
    { username: 'guest', password: null }
];

function authenticate(username, password) {
    // SOURCE
    var user = users.find(u => u.username === username);
    // 漏洞点：允许null密码通过验证
    // SINK
    if (user && (user.password === password || password === null)) {
        return true;
    }
    return false;
}

app.post('/login', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    if (authenticate(username, password)) {
        res.send('Login successful!');
    } else {
        res.send('Login failed!');
    }
});

app.listen(3000);