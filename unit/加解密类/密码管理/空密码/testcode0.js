var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// 模拟用户数据库
var users = {
    'admin': { password: '', role: 'admin' },
    'user1': { password: '123456', role: 'user' }
};

app.post('/login', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    // 空密码漏洞 - 没有验证密码是否为空
    if (users[username] && users[username].password === password) {
        // SINK
        res.send('Login successful! Welcome ' + username);
    } else {
        res.send('Login failed');
    }
});

app.listen(3000, function() {
    console.log('Server running on port 3000');
});