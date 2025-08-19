const express = require('express');
const crypto = require('crypto');
const app = express();

// 不安全的随机数生成函数
function generateInsecureToken() {
    // SOURCE: 使用Math.random()作为随机源
    return Math.random().toString(36).substring(2);
}

// 更安全的随机数生成函数（用于对比）
function generateSecureToken() {
    // 使用crypto模块的安全随机源
    return crypto.randomBytes(32).toString('hex');
}

app.get('/generate-token', (req, res) => {
    const tokenType = req.query.type || 'insecure';
    let token;
    
    if (tokenType === 'secure') {
        token = generateSecureToken();
    } else {
        // SINK: 使用不安全的随机数生成器生成安全令牌
        token = generateInsecureToken();
    }
    
    res.send({ token });
});

app.get('/reset-password', (req, res) => {
    // SOURCE: 使用不安全的随机数生成密码重置令牌
    const resetToken = Math.floor(Math.random() * 1000000).toString();
    // SINK: 将弱随机令牌用于安全敏感操作
    saveResetToken(req.query.userId, resetToken);
    res.send({ status: 'Reset token sent' });
});

function saveResetToken(userId, token) {
    // 模拟保存令牌到数据库
    console.log(`Saving token ${token} for user ${userId}`);
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});