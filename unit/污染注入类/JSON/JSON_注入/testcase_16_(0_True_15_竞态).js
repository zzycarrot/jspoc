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
    let sharedData;
    async function setData() {
      sharedData = param; 
    }

    async function useData() {
      await new Promise(resolve => setTimeout(resolve, 100));
      // JSON拼接
      const maliciousJSON = `{ 
          "user": "${sharedData}",
          "privilege": "normal",
          
          "createdAt": "${new Date().toISOString()}"
      }`;
      try {
          await client.connect();
          const database = client.db("testDB");
          const users = database.collection("users");
          // SINK
          const result = await users.insertOne(JSON.parse(maliciousJSON));
          res.send(`User created with id: ${result.insertedId}`);
      } finally {
          await client.close();
      }
    }

    setData();
    useData();
});

app.listen(3000);