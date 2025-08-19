var express = require('express');
var router = express.Router();
var crypto = require('crypto');

// 不安全的伪加密函数 - 使用简单的base64编码
function insecureEncrypt(password) {
    // SINK
    return Buffer.from(password).toString('base64');
}

router.post('/register', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    // 使用不安全的伪加密存储密码
    var encryptedPassword = insecureEncrypt(password);
    
    // 模拟存储用户
    var user = {
        username: username,
        password: encryptedPassword
    };
    
    // 这里应该是数据库存储操作
    console.log("Storing user:", user);
    
    res.send('Registration successful');
});

router.post('/login', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    // 模拟从数据库获取用户
    var storedUser = {
        username: username,
        password: insecureEncrypt("examplePassword") // 模拟存储的伪加密密码
    };
    
    // 使用相同的伪加密验证密码
    if (insecureEncrypt(password) === storedUser.password) {
        res.send('Login successful');
    } else {
        res.status(401).send('Login failed');
    }
});