const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

const uri = process.env.MONGODB_URI || "mongodb://mongo:27017";
const client = new MongoClient(uri);

// 安全的版本 - 避免JSON注入
app.post('/api/user/create-safe', async (req, res) => {
    try {
        // 直接使用解析后的JSON对象，而不是字符串拼接
        const userInput = req.body.username;
        
        // 输入验证
        if (!userInput || typeof userInput !== 'string' || userInput.length > 50) {
            return res.status(400).send('Invalid username');
        }
        
        // 清理输入 - 移除危险字符
        const cleanUsername = userInput.replace(/['"\\]/g, '');
        
        // 安全地构造对象
        const safeUserObject = {
            user: cleanUsername,
            privilege: "normal",
            createdAt: new Date().toISOString()
        };

        console.log("Safe object:", JSON.stringify(safeUserObject));

        await client.connect();
        const database = client.db("testDB");
        const users = database.collection("users_safe");

        // 直接插入对象，不进行JSON.parse
        const result = await users.insertOne(safeUserObject);

        res.send(`Safe user created with id: ${result.insertedId}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
    } finally {
        await client.close();
    }
});

// 易受攻击的端点已在安全版本中完全移除
// 如需测试易受攻击的代码，请使用 testcode0.js

app.listen(3000, () => {
    console.log('Server running on port 3000 (Safe Version)');
    console.log('Available endpoints:');
    console.log('  - POST /api/user/create-safe (Safe endpoint with input validation)');
    console.log('  - POST /api/user/create (Disabled in safe version)');
});
