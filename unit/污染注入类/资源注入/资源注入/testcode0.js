var express = require('express');
var fs = require('fs');
var router = express.Router();

// 漏洞1: 文件路径注入
function readFileContent(filePath) {
    // SINK
    return fs.readFileSync(filePath, 'utf8');
}

router.get('/file/read', function(req, res) {
    var query = req.query;
    // SOURCE
    var fileName = query.filename;
    try {
        var content = readFileContent('/var/www/uploads/' + fileName);
        res.send(content);
    } catch (err) {
        res.status(500).send('Error reading file');
    }
});

// 漏洞2: URL资源注入
const axios = require('axios');

function fetchRemoteResource(url) {
    // SINK
    return axios.get(url);
}

router.get('/fetch/resource', function(req, res) {
    var query = req.query;
    // SOURCE
    var resourceUrl = query.url;
    fetchRemoteResource(resourceUrl)
        .then(response => {
            res.send(response.data);
        })
        .catch(error => {
            res.status(500).send('Error fetching resource');
        });
});

// 漏洞3: 数据库连接注入
const mysql = require('mysql');

function queryDatabase(connectionConfig, query) {
    // SINK
    const connection = mysql.createConnection(connectionConfig);
    connection.connect();
    connection.query(query, (error, results) => {
        if (error) throw error;
        return results;
    });
    connection.end();
}

router.post('/db/query', function(req, res) {
    var body = req.body;
    // SOURCE
    var dbHost = body.host;
    var dbUser = body.user;
    var dbPassword = body.password;
    var dbQuery = body.query;
    
    const config = {
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: 'appdb'
    };
    
    try {
        const results = queryDatabase(config, dbQuery);
        res.json(results);
    } catch (err) {
        res.status(500).send('Database error');
    }
});