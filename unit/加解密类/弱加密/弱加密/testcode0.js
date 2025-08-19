const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// 使用不安全的加密算法(DES)和静态密钥
function encryptData(text) {
    const key = Buffer.from('weakkey!', 'utf8'); // SOURCE: 硬编码的弱密钥
    const cipher = crypto.createCipheriv('des-ecb', key, null); // SINK: 使用不安全的DES算法和ECB模式
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptData(encrypted) {
    const key = Buffer.from('weakkey!', 'utf8'); // SOURCE: 硬编码的弱密钥
    const decipher = crypto.createDecipheriv('des-ecb', key, null); // SINK: 使用不安全的DES算法和ECB模式
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

router.post('/encrypt', function(req, res) {
    // SOURCE: 用户提供的敏感数据
    const userData = req.body.data;
    const encrypted = encryptData(userData);
    res.send({ encrypted });
});

router.post('/decrypt', function(req, res) {
    // SOURCE: 用户提供的加密数据
    const encryptedData = req.body.data;
    try {
        const decrypted = decryptData(encryptedData);
        res.send({ decrypted });
    } catch (err) {
        res.status(500).send('Decryption failed');
    }
});

// 另一个例子: 使用不安全的哈希算法(MD5)
function createWeakHash(password) {
    // SOURCE: 用户提供的密码
    // SINK: 使用不安全的MD5哈希
    return crypto.createHash('md5').update(password).digest('hex');
}

router.post('/register', function(req, res) {
    // SOURCE: 用户提供的密码
    const password = req.body.password;
    const hashedPassword = createWeakHash(password);
    // 存储哈希密码到数据库...
    res.send('Registration successful');
});

module.exports = router;