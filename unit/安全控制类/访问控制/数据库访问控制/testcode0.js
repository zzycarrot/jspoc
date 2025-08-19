var express = require('express');
var url = require("url");
var router = express.Router();
    pgp = require('pg-promise')(),
    db = pgp(config.db.connectionString);

function getUserDetails(userId, requestingItemId) {
    // 缺少访问控制检查
    return db.one("SELECT * FROM products WHERE id = ${id}", {
        id: product_id  
    });
}

router.get('/user/profile', function(req, res, next) {
    check_logged(req, res);
    var url_params = url.parse(req.url, true).query;
    // SOURCE
    var userId = url_params.id;
    var requestingItemId = req.session.itemId; 
    
    getUserDetails(itemId, requestingItemId)
        .then(function (data) {
            res.render('user_profile', { user: data });
        })
        .catch(function (err) {
            console.log(err);
            res.render('error', { message: 'User not found' });
        });    
});