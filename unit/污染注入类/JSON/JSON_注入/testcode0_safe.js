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

// 原有的易受攻击的端点保持不变
app.post('/api/user/create', async (req, res) => {
    //SOURCE
    const userInput = req.body.username;

    //JSON拼接
    const maliciousJSON = `{ 
        "user": "${userInput}",
        "privilege": "normal",
        
        "createdAt": "${new Date().toISOString()}"
    }`;

    // 打印生成的JSON用于调试
    console.log("Generated JSON:", maliciousJSON);

    try {

        await client.connect();
        const database = client.db("testDB");
        const users = database.collection("users");

        //SINK
        const result = await users.insertOne(JSON.parse(maliciousJSON));

        res.send(`User created with id: ${result.insertedId}`);
    } finally {
        await client.close();
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Vulnerable endpoint: POST /api/user/create');
    console.log('Safe endpoint: POST /api/user/create-safe');
});
