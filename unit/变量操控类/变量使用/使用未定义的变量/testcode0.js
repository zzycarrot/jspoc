var express = require('express');
var router = express.Router();

function processUserData(userInput) {
    // 使用未定义的变量
    // SINK
    return undefinedVariable.process(userInput);
}

router.post('/user/process', function(req, res) {
    // SOURCE
    var userData = req.body.data;
    
    try {
        var result = processUserData(userData);
        res.send({ status: 'success', data: result });
    } catch (e) {
        res.status(500).send({ error: 'Processing failed' });
    }
});

router.get('/debug/info', function(req, res) {
    // 另一个使用未定义变量的例子
    // SINK
    res.send({ debugInfo: debugSettings.level });
});