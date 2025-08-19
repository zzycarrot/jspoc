const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

async function fetch(something) {
    return 'safe'; // here
}

async function asyncFlow(param) {
  const data = await fetch(param); // here
  return data; // here
}

app.get('/vulnerable', async (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    const safeUsername = await asyncFlow(param);
    
    // XML 字符串拼接
    const vulnerableXML = `
    <userProfile>
        <username>${safeUsername}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>`;
    
    res.type('application/xml');
    res.send(vulnerableXML); // Sink
});

app.listen(3000);