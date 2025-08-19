var express = require('express');
var url = require("url");
var router = express.Router();
    pgp = require('pg-promise')(),
    db = pgp(config.db.connectionString);
// function getProduct(product_id) {
//     // SQLI
//     var q = "SELECT * FROM products WHERE id = '" + product_id + "';";
//     // SINK
//     return db.one(q);
// }
function safe_getProduct(product_id) {
    // 使用参数化查询
    return db.one("SELECT * FROM products WHERE id = ${id}", {
        id: product_id  
    });
}
router.get('/products/detail', function(req, res, next) {
    check_logged(req, res);
    var url_params = url.parse(req.url, true).query;
    // SOURCE
    var product_id = url_params.id;
        //add catch err
        safe_getProduct(product_id)
            .then(function (data) {
                res.render('product_detail', { product: data });
            })
            .catch(function (err) {
                console.log(err);
                res.render('products', { products: [] });
            });
    
});