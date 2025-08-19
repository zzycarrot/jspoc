const crypto = require('crypto');
const express = require('express');
const app = express();

function encryptData(data, key) {
    // 使用不足长度的key (64位/8字节)
    // SINK
    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

app.post('/encrypt', express.json(), (req, res) => {
    // SOURCE
    const userData = req.body.data;
    // 使用不足长度的key (只有8字节，而AES-256需要32字节)
    const weakKey = Buffer.from('weakkey!'); 
    
    try {
        const encrypted = encryptData(userData, weakKey);
        res.send({ encrypted });
    } catch (err) {
        res.status(500).send({ error: 'Encryption failed' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});