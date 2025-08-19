var express = require('express');
var router = express.Router();
var fs = require('fs');
var util = require('util');

router.get('/debug/error', function(req, res) {
    
    var errorType = req.query.type;
    
    try {
        // 模拟不同类型的错误
        if (errorType === 'reference') {
            throw new ReferenceError('Reference error example');
        } else if (errorType === 'type') {
            throw new TypeError('Type error example');
        } else {
            throw new Error('Generic error example');
        }
    } catch (err) {// SOURCE :err
        // 泄漏完整的错误堆栈和系统信息
        // SINK
        console.log("errormsg: ",err.message)
    }
});

module.exports = router;