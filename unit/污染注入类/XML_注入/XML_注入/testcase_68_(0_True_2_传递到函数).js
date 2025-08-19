const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

function dosomething(bar) {
    return bar;
}

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    var val = dosomething(param);
    
    // XML 字符串拼接
    const vulnerableXML = `
    <userProfile>
        <username>${val}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>`;
    
    res.type('application/xml');
    res.send(vulnerableXML); // Sink
});

app.listen(3000);