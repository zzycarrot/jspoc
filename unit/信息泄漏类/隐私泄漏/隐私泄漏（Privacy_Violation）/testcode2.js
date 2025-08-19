var express = require('express');
var fs = require('fs');
var router = express.Router();

// 模拟用户数据库
var users = [
    { id: 1, username: 'user1', password: 'secret123', ssn: '123-45-6789' },
    { id: 2, username: 'user2', password: 'qwerty456', ssn: '987-65-4321' }
];

// 不安全的密码重置功能
router.post('/user/reset-password', function(req, res) {
    // SOURCE: 从请求体获取用户名
    var username = req.body.username;
    
    var user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).send('User not found');
    }

    // SINK: 在响应中返回明文密码（极其不安全）
    res.send(`Your password is: ${user.password}`);
});

// 不安全的错误处理暴露敏感信息
router.get('/user/details', function(req, res) {
    try {
        // SOURCE: 从查询参数获取用户ID
        var userId = parseInt(req.query.id);
        
        if (isNaN(userId)) {
            throw new Error('Invalid user ID');
        }

        var user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found in database`);
        }

        // 故意删除敏感字段
        var safeUser = { ...user };
        delete safeUser.password;
        delete safeUser.ssn;
        
        res.json(safeUser);
    } catch (err) {
        // SINK: 错误消息中暴露敏感信息（用户数据库结构）
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
});

module.exports = router;