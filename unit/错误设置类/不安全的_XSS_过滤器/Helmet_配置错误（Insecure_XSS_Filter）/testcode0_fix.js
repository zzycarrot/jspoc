var express = require('express');
var helmet = require('helmet');
var app = express();

// 错误配置 - 使用不安全的XSS过滤器设置
app.use(helmet.xssFilter({ setOnOldIE: false }));

app.get('/', function(req, res) {
    // SOURCE
    var userInput = req.query.input;
    
    // 模拟反射型XSS场景
    res.send('<html><body>' + userInput + '</body></html>'); // SINK
});

app.listen(3000);