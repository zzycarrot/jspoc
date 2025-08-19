const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    var M = new Map();
    M.set('key1',param);
    M.set('key2','safe');
    bar = M.get('key2');
    
    // XML 字符串拼接
    const vulnerableXML = `
    <userProfile>
        <username>${bar}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>`;
    
    res.type('application/xml');
    res.send(vulnerableXML); // Sink
});

app.listen(3000);