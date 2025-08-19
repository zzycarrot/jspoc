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
    } catch (err) {// SOURCE:err
        // 泄漏完整的错误堆栈和系统信息
        // SINK
        res.status(500).send(`
            <h1>Error Details</h1>
            <pre>Error: ${err.message}</pre>
            <pre>Stack: ${err.stack}</pre>
            <pre>Node Version: ${process.version}</pre>
            <pre>System Platform: ${process.platform}</pre>
            <pre>Memory Usage: ${util.inspect(process.memoryUsage())}</pre>
        `);
    }
});

module.exports = router;