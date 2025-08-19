var express = require('express');
var url = require('url');
var router = express.Router();

router.get('/redirect', function(req, res, next) {
    var url_params = url.parse(req.url, true).query;
    // SOURCE
    var targetUrl = url_params.url;
    
    // SINK
    res.redirect(targetUrl);
});
var safedomain = ["www.safe.com","www.trusted.com"]
router.get('/safe/redirect', function(req, res, next) {
    var url_params = url.parse(req.url, true).query;
    // SOURCE
    var targetUrl = url_params.url;
    
    // 安全验证 - 只允许重定向到相同域名的URL
    if (targetUrl && safedomain.includes(targetUrl)) {
        // SINK
        res.redirect(targetUrl);
    } else {
        res.status(400).send('Invalid redirect URL');
    }
});