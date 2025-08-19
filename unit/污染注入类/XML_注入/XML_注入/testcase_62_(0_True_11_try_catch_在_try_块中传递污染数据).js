const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    let bar = 'safe';
    try {
        bar = param;
        // XML 字符串拼接
        const vulnerableXML = `
        <userProfile>
            <username>${bar}</username> 
            <accessLevel>user</accessLevel>
        </userProfile>`;
        
        res.type('application/xml');
        res.send(vulnerableXML); // Sink
    } catch (err) {
        // 忽略错误
    }
});

app.listen(3000);