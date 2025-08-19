var express = require('express');
var crypto = require('crypto');
var router = express.Router();

function hashPassword(password) {
    // 使用不安全的MD5哈希算法
    // SINK
    return crypto.createHash('md5').update(password).digest('hex');
}

router.post('/register', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    var hashedPassword = hashPassword(password);
    
    // 存储到数据库（模拟）
    console.log(`Storing user ${username} with password hash ${hashedPassword}`);
    res.send('User registered successfully');
});

router.post('/login', function(req, res) {
    // SOURCE
    var username = req.body.username;
    var password = req.body.password;
    
    var hashedPassword = hashPassword(password);
    
    // 模拟验证（实际应从数据库获取存储的哈希）
    if (hashedPassword === '5f4dcc3b5aa765d61d8327deb882cf99') { // 示例：'password'的MD5
        res.send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});