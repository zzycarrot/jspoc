const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    var bar = 'safe';
    switchTarget = 'B'; // force safe path
    switch (switchTarget) {
        case 'A':
            bar = param;
            break;
        case 'B':
            bar = "safe";
            break;
        case 'C':
        case 'D':
            bar = param;
            break;
        default:
            bar = "safe";
            break;
    }
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