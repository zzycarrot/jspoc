var express = require('express');
var fs = require('fs');
var router = express.Router();

function readFile(filePath) {
    // SINK
    return fs.readFileSync(filePath, 'utf8');
}

router.get('/download', function(req, res) {
    var query = req.query;
    // SOURCE
    var fileName = query.file;
    var filePath = '/var/www/uploads/' + fileName;
    
    try {
        var fileContent = readFile(filePath);
        res.send(fileContent);
    } catch (err) {
        res.status(404).send('File not found');
    }
});