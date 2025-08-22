const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

const uri = "mongodb://mongo:27017";
const client = new MongoClient(uri);

app.post('/api/user/create', async (req, res) => {
    //SOURCE
    const userInput = req.body.username;
    param = userInput;
    // here
    if(true) {
        bar = param;
    }
    
    //JSON拼接
    const maliciousJSON = `{ 
        "user": "${bar}",
        "privilege": "normal",
        "createdAt": "${new Date().toISOString()}"
    }`;

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

app.listen(3000);