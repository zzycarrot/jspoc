var express = require('express');
var router = express.Router();
var fs = require('fs');
var util = require('util');

router.get('/config', function(req, res) {    
    var configFile = req.query.file || 'config.json';
    
    fs.readFile(configFile, 'utf8', function(err, data) {
        // SOURCE:err
        if (err) {
            // SINK - 泄漏文件系统路径信息
            res.status(500).send(`Error reading file: ${err.message}<br>Attempted path: ${__dirname}/${configFile}`);
        } else {
            // SINK - 直接返回配置文件内容
            res.type('json').send(data);
        }
    });
});

module.exports = router;