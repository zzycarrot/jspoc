var express = require('express');
var app = express();

app.get('/vulnerable', function(req, res) {
    // SOURCE
    var userControlledDomain = req.query.domain;
    
    // 不安全的SOP绕过设置
    res.setHeader('Access-Control-Allow-Origin', userControlledDomain);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // SINK - 返回可能包含恶意脚本的响应
    res.send('<script>alert("XSS via SOP bypass")</script>');
});

app.get('/iframe', function(req, res) {
    // SOURCE
    var externalUrl = req.query.url;
    
    // 不安全的iframe沙箱设置
    res.send(`
        <iframe 
            sandbox="allow-scripts allow-same-origin" 
            src="${externalUrl}"
        ></iframe>
    `);
    // SINK
});

app.get('/postmessage', function(req, res) {
    // SOURCE
    var targetOrigin = req.query.origin;
    
    res.send(`
        <script>
            window.addEventListener('message', function(e) {
                // 不安全的origin验证
                if (e.origin === "${targetOrigin}") {
                    eval(e.data);
                }
            });
        </script>
    `);
    // SINK
});

app.listen(3000);