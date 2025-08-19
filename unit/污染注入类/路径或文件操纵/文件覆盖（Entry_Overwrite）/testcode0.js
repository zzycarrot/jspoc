var express = require('express');
var fs = require('fs');
var router = express.Router();

function saveUserData(userData, filename) {
    // 直接将用户控制的文件名用于文件写入
    // SINK
    fs.writeFileSync('/data/user_files/' + filename, userData);
}

router.post('/save-profile', function(req, res) {
    // SOURCE
    var userFilename = req.body.filename;
    var userContent = req.body.content;
    
    saveUserData(userContent, userFilename);
    res.send('Profile saved successfully');
});

// 依赖包: express, fs