var express = require('express');
var router = express.Router();

router.post('/saveUserData', function(req, res) {
    // SOURCE
    var sensitiveData = req.body.sensitiveData;
    
    // 错误地将敏感数据存入sessionStorage后又转移到localStorage
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('tempToken', sensitiveData);
        
        // 跨会话污染漏洞点 - 将临时会话数据转移到持久存储
        // SINK
        localStorage.setItem('persistentToken', sessionStorage.getItem('tempToken'));
    }
    
    res.send('Data saved');
});

router.get('/getPersistentData', function(req, res) {
    if (typeof window !== 'undefined') {
        // 持久化的数据现在可以被长期访问
        // SINK
        var persistentData = localStorage.getItem('persistentToken');
        res.send(persistentData);
    } else {
        res.send('No data available');
    }
});