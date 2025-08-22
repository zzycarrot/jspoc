const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

const uri = "mongodb://mongo:27017";
const client = new MongoClient(uri);

async function asyncFlow(param) {
    // here
    //JSON拼接
    const maliciousJSON = `{ 
        "user": "${param}",
        "privilege": "normal",
        "createdAt": "${new Date().toISOString()}"
    }`;

    await client.connect();
    const database = client.db("testDB");
    const users = database.collection("users");

    //SINK
    const result = await users.insertOne(JSON.parse(maliciousJSON));
    return result;
}

app.post('/api/user/create', async (req, res) => {
    //SOURCE
    const userInput = req.body.username;
    
    try {
        const result = await asyncFlow(userInput);
        res.send(`User created with id: ${result.insertedId}`);
    } finally {
        await client.close();
    }
});

app.listen(3000);