const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

const uri = "mongodb://mongo:27017";
const client = new MongoClient(uri);

let sharedData; // here

async function setData(bar) {
  sharedData = 'safe'; // here
}

async function useData() {
  await new Promise(resolve => setTimeout(resolve, 100));
  // SINK
  try {
    await client.connect();
    const database = client.db("testDB");
    const users = database.collection("users");
    const result = await users.insertOne(JSON.parse(sharedData));
    return result;
  } finally {
    await client.close();
  }
}

app.post('/api/user/create', async (req, res) => {
    //SOURCE
    const userInput = req.body.username;
    param = userInput; // here

    //JSON拼接
    const maliciousJSON = `{ 
        "user": "${userInput}",
        "privilege": "normal",
        
        "createdAt": "${new Date().toISOString()}"
    }`;
    sharedData = maliciousJSON; // here

    setData(param); // here
    const result = await useData(); // here
    res.send(`User created with id: ${result.insertedId}`);
});
app.listen(3000);