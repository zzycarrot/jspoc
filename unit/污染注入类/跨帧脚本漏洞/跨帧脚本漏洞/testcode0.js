var express = require('express');
var app = express();

// 漏洞示例1: 缺少X-Frame-Options头
app.get('/vulnerable1', function(req, res) {
    // SOURCE: 请求来源
    var userInput = req.query.content;
    
    res.send(`
        <html>
            <body>
                <h1>Welcome</h1>
                <div>${userInput}</div>
            </body>
        </html>
    `);
    // SINK: 响应头未设置X-Frame-Options
});

// 漏洞示例2: 不安全的X-Frame-Options设置
app.get('/vulnerable2', function(req, res) {
    // SOURCE: 请求来源
    var frameOrigin = req.query.origin;
    
    // SINK: 允许来自任意源的iframe嵌入
    res.set('X-Frame-Options', 'ALLOW-FROM ' + frameOrigin);
    res.send('<h1>Your frame was loaded</h1>');
});

// 安全示例: 正确设置X-Frame-Options
app.get('/secure', function(req, res) {
    // SINK: 正确设置DENY或SAMEORIGIN
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.send('<h1>This page cannot be framed</h1>');
});

// 现代浏览器替代方案: Content-Security-Policy
app.get('/modern-secure', function(req, res) {
    // SINK: 使用CSP的frame-ancestors指令
    res.set('Content-Security-Policy', "frame-ancestors 'self'");
    res.send('<h1>This page has frame protection via CSP</h1>');
});

app.listen(3000);