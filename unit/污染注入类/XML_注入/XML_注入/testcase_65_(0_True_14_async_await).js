async function handleRequest(username) {
  const xml = `
    <userProfile>
        <username>${username}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>`; 
  return xml;
}
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', async (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    
    // XML 字符串拼接
    const vulnerableXML = await handleRequest(username); 
    
    res.type('application/xml');
    res.send(vulnerableXML); // Sink
});

app.listen(3000);