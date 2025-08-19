var express = require('express');
var fs = require('fs');
var router = express.Router();

router.get('/download', function(req, res) {
    // SOURCE
    var filePath = req.query.file;
    
    // 禁用X-Download-Options标头
    res.setHeader('X-Download-Options', '');
    
    // 读取并发送文件
    fs.readFile(filePath, function(err, data) {
        if (err) {
            res.status(404).send('File not found');
            return;
        }
        
        // SINK - 发送文件内容，没有设置安全标头
        res.send(data);
    });
});

// 启动服务器
var app = express();
app.use('/', router);
app.listen(3000, function() {
    console.log('Server running on port 3000');
});