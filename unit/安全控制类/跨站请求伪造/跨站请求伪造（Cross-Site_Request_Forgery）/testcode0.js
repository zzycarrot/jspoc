var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 模拟用户数据库
var users = {
    'admin': { password: 'admin123', balance: 1000 }
};

// 登录端点 - 设置会话cookie
app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    if (users[username] && users[username].password === password) {
        // SOURCE: 用户凭证
        res.cookie('session', username, { httpOnly: true });
        res.send('Logged in successfully');
    } else {
        res.status(401).send('Login failed');
    }
});

// 转账端点 - 易受CSRF攻击
app.post('/transfer', function(req, res) {
    var to = req.body.to;
    var amount = parseInt(req.body.amount);
    var user = req.cookies.session;
    
    if (!user || !users[user]) {
        return res.status(401).send('Not authenticated');
    }
    
    if (users[user].balance >= amount) {
        users[user].balance -= amount;
        // SINK: 执行敏感操作(转账)而没有CSRF保护
        res.send(`Transferred $${amount} to ${to}. New balance: $${users[user].balance}`);
    } else {
        res.status(400).send('Insufficient funds');
    }
});

// 获取用户余额
app.get('/balance', function(req, res) {
    var user = req.cookies.session;
    if (!user || !users[user]) {
        return res.status(401).send('Not authenticated');
    }
    res.send(`Your balance: $${users[user].balance}`);
});

app.listen(3000, function() {
    console.log('Server running on port 3000');
});