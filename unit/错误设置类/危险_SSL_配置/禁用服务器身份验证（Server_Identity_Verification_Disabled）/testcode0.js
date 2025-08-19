var https = require('https');
var fs = require('fs');
protocol = 'SSLv3_method'
//SOURCE
var options = {
  key : fs.readFileSync('my-server-key.pem'),
  cert : fs.readFileSync('server-cert.pem'),
  requestCert: true,
}

// SINK: 
https.createServer(options).listen(443);
//创建 https.Server 对象时，requestCert 设置会指定为 true，但未设置 rejectUnauthorized，其默认设置为 false。这意味着尽管服务器是为了通过 SSL 验证客户端而创建，但即使未使用提供的 CA 列表对证书进行授权，也仍然会接受连接。