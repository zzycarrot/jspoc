var express = require('express');
var router = express.Router();

function processUserData(userInput) {
    // 这里使用了未声明的变量
    // SINK
    result = processData(userInput);
    return result;
}

function processData(data) {
    return data.toUpperCase();
}

router.get('/process', function(req, res) {
    // SOURCE
    var userInput = req.query.input;
    
    var output = processUserData(userInput);
    res.send('Processed: ' + output);
});

// 另一个更危险的例子
function checkAdmin() {
    // 这里isAdmin在声明前就被使用
    // SINK
    if (isAdmin) {
        return true;
    }
    // 这里才声明
    var isAdmin = false;
    return false;
}

router.get('/admin', function(req, res) {
    // SOURCE
    var token = req.query.token;
    
    if (checkAdmin()) {
        res.send('Admin access granted');
    } else {
        res.send('Access denied');
    }
});