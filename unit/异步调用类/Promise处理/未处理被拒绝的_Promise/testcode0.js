var express = require('express');
var router = express.Router();

function processData(input) {
    return new Promise((resolve, reject) => {
        if (!input) {
            // SINK
            reject(new Error('Invalid input'));
        } else {
            resolve(input.toUpperCase());
        }
    });
}

router.post('/process', function(req, res) {
    // SOURCE
    const userInput = req.body.data;
    
    // 未处理被拒绝的 Promise
    processData(userInput)
        .then(result => {
            res.send({ status: 'success', data: result });
        });
    
    // 这里没有 .catch() 来处理可能的拒绝
});

module.exports = router;