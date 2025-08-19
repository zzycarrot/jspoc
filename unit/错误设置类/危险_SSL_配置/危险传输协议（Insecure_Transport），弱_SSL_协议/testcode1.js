var https = require('https');
var fs = require('fs');
var express = require('express');
var app = express();
protocol = 'SSLv3_method'
// 使用不安全的SSL协议选项
var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
  // SOURCE: 不安全的SSL协议配置
  secureProtocol: protocol  // 使用不安全的SSLv23协议
};

app.get('/login', function(req, res) {
  // 处理敏感数据
  var sensitiveData = {
    username: req.query.username,
    password: req.query.password
  };
  // SINK: 通过不安全的SSL协议传输敏感数据
  res.json(sensitiveData);
});

// SINK: 创建使用不安全协议的服务
https.createServer(options, app).listen(443);