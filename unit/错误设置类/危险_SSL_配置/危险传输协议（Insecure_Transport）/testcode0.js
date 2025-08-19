var express = require('express');
var https = require('https');
var fs = require('fs');
var app = express();

// 不安全地禁用SSL验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // SINK

app.get('/login', function(req, res) {
    // SOURCE
    var username = req.query.username;
    var password = req.query.password;
    
    // 使用HTTP协议传输敏感数据
    var options = {
        hostname: 'api.example.com',
        port: 80, // SINK: 使用不安全的HTTP端口
        path: '/validate?username=' + username + '&password=' + password,
        method: 'GET'
    };

    var request = http.request(options, function(response) {
        response.on('data', function(data) {
            res.send(data);
        });
    });

    request.on('error', function(e) {
        console.log('Problem with request: ' + e.message);
    });

    request.end();
});

// 使用自签名证书且不验证
var sslOptions = {
    key: fs.readFileSync('selfsigned.key'),
    cert: fs.readFileSync('selfsigned.crt'),
    rejectUnauthorized: false // SINK
};

https.createServer(sslOptions, app).listen(443);