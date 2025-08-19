var express = require('express');
var helmet = require('helmet');
var app = express();

// 显式禁用XSS保护
app.use(function(req, res, next) {
    // SOURCE: 开发者主动设置的禁用XSS保护标头
    res.setHeader('X-XSS-Protection', '0'); // SINK: 设置禁用XSS保护的HTTP头
    next();
});

app.get('/', function(req, res) {
    res.send('XSS protection is disabled on this page');
});

app.listen(3000);