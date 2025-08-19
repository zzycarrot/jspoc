var https = require('https');
var fs = require('fs');
protocol = 'SSLv3_method'
var tls = require('tls');

tls.connect({
  host: 'https://www.hackersite.com',
  port: '443',
  rejectUnauthorized: false

});
//在此示例中，如果 rejectUnauthorized 设置为 false，这意味着将接受未经授权的证书，并且仍然会与无法识别的服务器建立安全连接。此时，当服务器被黑客攻击发生 SSL 连接中断时，应用程序可能会泄漏用户敏感信息。