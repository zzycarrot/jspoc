var express = require('express');
var url = require("url");
var router = express.Router();
    pgp = require('pg-promise')(),
    db = pgp(config.db.connectionString);
function getProduct(product_id) {
    // SQLI
    var q = "SELECT * FROM products WHERE id = '" + product_id + "';";
    // SINK
    return db.one(q);
}

router.get('/products/detail', function(req, res, next) {
    check_logged(req, res);
    var url_params = url.parse(req.url, true).query;
    // SOURCE
    var product_id = url_params.id;
        //add catch err
        getProduct(product_id)
            .then(function (data) {
                res.render('product_detail', { product: data });
            })
            .catch(function (err) {
                console.log(err);
                res.render('products', { products: [] });
            });
    
});
app.listen(3000, function() {
    console.log('Server is running on port 3000');
});