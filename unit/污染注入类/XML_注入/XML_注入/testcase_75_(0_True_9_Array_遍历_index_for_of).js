const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/vulnerable', (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username;
    // here
    var Arr = [param,'safe'];
    var len = Arr.length;
    for(let index = 0; index < len; index ++){
        bar = Arr[index];
        // XML 字符串拼接
        const vulnerableXML = `
        <userProfile>
            <username>${bar}</username> 
            <accessLevel>user</accessLevel>
        </userProfile>`;
        
        res.type('application/xml');
        res.send(vulnerableXML); // Sink
        break; // 只处理第一个元素以保持漏洞
    }
});

app.listen(3000);