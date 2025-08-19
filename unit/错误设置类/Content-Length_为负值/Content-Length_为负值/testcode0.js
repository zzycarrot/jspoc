var express = require('express');
var http = require('http');

var app = express();

app.use(express.json());

app.post('/process', function(req, res) {
    // SOURCE: 从请求头获取Content-Length
    var contentLength = req.get('Content-Length');
    
    // 未验证Content-Length是否为非负整数
    if (contentLength < 0) {
        // SINK: 使用负值Content-Length进行内存分配或处理
        var buffer = Buffer.alloc(contentLength);
        res.status(200).send({message: "Processed with negative length"});
    } else {
        res.status(200).send({message: "Processed normally"});
    }
});

var server = http.createServer(app);
server.listen(3000, function() {
    console.log('Server running on port 3000');
});