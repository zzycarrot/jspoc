var express = require('express');
var router = express.Router();

router.get('/login', function(req, res) {
    // SOURCE
    var username = req.query.username;
    
    // 设置cookie时使用了过于宽泛的路径"/"
    res.cookie('sessionID', 'user123', {
        path: '/',  // SINK: 过于宽泛的路径设置
        httpOnly: true
    });
    
    res.send('Login successful');
});

router.get('/admin', function(req, res) {
    if (req.cookies.sessionID === 'user123') {
        res.send('Admin panel accessed');
    } else {
        res.send('Access denied');
    }
});