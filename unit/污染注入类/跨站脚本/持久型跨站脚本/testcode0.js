var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

var comments = [];

app.post('/comment', function(req, res) {
    // SOURCE
    var userComment = req.body.comment;
    
    // 未对用户输入进行任何过滤或转义
    comments.push({
        text: userComment,
        date: new Date()
    });
    
    res.send('Comment added!');
});

app.get('/comments', function(req, res) {
    var html = '<html><body><h1>Comments</h1><ul>';
    
    comments.forEach(function(comment) {
        // SINK - 直接将用户输入插入到HTML中
        html += '<li>' + comment.text + '</li>';
    });
    
    html += '</ul></body></html>';
    res.send(html);
});

app.listen(3000);