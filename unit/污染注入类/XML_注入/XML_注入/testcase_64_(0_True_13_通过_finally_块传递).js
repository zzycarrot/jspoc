const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    
    // XML 字符串拼接
    // here
    let bar = 'safe';
    try {
        bar = param; // 赋值后执行 finally
    } finally {
        const vulnerableXML = `
        <userProfile>
            <username>${bar}</username> 
            <accessLevel>user</accessLevel>
        </userProfile>`;
        
        res.type('application/xml');
        res.send(vulnerableXML); // Sink
    }
});

app.listen(3000);