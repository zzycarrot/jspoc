var express = require('express');
var fs = require('fs');
var router = express.Router();

// 模拟用户数据库
var users = [
    { id: 1, username: 'user1', password: 'secret123', ssn: '123-45-6789' },
    { id: 2, username: 'user2', password: 'qwerty456', ssn: '987-65-4321' }
];

// 不安全的日志记录函数
function logUserActivity(userData) {
    // SINK: 将敏感信息写入日志文件
    fs.appendFileSync('activity.log', `User activity: ${JSON.stringify(userData)}\n`);
}

// 不安全的API端点，暴露敏感信息
router.get('/user/profile', function(req, res) {
    // SOURCE: 从查询参数获取用户ID
    var userId = parseInt(req.query.id);
    
    // 查找用户
    var user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).send('User not found');
    }

    // SINK: 直接返回包含敏感信息的完整用户对象
    res.json(user);
    
    // SINK: 记录包含敏感信息的活动日志
    logUserActivity(user);
});

module.exports = router;