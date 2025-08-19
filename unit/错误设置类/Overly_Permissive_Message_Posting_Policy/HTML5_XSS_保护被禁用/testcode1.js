var express = require('express');
var helmet = require('helmet');
var app = express();


// 使用helmet但覆盖其默认XSS保护设置
app.use(helmet());
app.use(function(req, res, next) {
    // SOURCE: 开发者主动覆盖helmet的XSS保护设置
    res.setHeader('X-XSS-Protection', '0'); // SINK: 设置禁用XSS保护的HTTP头
    next();
});

app.get('/', function(req, res) {
    res.send('XSS protection is disabled on this page');
});

app.listen(3000);