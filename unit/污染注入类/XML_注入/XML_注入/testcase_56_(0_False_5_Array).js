const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    // here
    var Arr = [username, 'safe'];
    var bar = Arr[1];  // 使用安全值
    
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