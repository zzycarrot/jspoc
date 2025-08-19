const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

let sharedData;

async function setData(bar) {
  sharedData = 'safe'; 
}

async function useData(res) {
  await new Promise(resolve => setTimeout(resolve, 100));
  // here
  const safeXML = `
    <userProfile>
        <username>${sharedData}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>`;
  res.type('application/xml');
  res.send(safeXML);   
}

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    setData(param);
    useData(res);
});

app.listen(3000);