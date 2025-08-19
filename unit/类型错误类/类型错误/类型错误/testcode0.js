var express = require('express');
var router = express.Router();

function calculateDiscount(price, discountPercentage) {
    // 尝试对可能不是数字的值执行数学运算
    // SINK
    return price - (price * discountPercentage);
}

router.post('/apply-discount', function(req, res) {
    // SOURCE
    var userPrice = req.body.price;
    // SOURCE
    var userDiscount = req.body.discount;
    
    try {
        var finalPrice = calculateDiscount(userPrice, userDiscount);
        res.json({ finalPrice: finalPrice });
    } catch (err) {
        res.status(400).json({ error: "Invalid calculation" });
    }
});