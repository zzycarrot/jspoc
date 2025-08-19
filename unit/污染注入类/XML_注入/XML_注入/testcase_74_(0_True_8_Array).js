const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    var Arr = [param,'safe'];
    var bar = Arr[0];
    
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