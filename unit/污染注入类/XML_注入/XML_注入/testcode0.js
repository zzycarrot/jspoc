const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    
    // XML 字符串拼接
    const vulnerableXML = `
    <userProfile>
        <username>${username}</username> 
        <accessLevel>user</accessLevel>
    </userProfile>`;
    
    res.type('application/xml');
    res.send(vulnerableXML); // Sink
});

app.listen(3000);
//curl -X GET "http://localhost:3000/vulnerable?username=admin</username><accessLevel>admin</accessLevel><username>user"