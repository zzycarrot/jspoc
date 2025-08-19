const express = require('express');
const app = express();
const port = 3000;

app.get('/render/:template', (req, res) => {
    // SINK:
    const templateName = req.params.template;
    
    // SOURCE:
    res.render(templateName, { 
        // 用户数据(可能被利用)
        userData: req.query.data 
    });
});

app.get('/profile', (req, res) => {
    // SINK:
    const username = req.query.user;
    
    // SOURCE:
    res.render('profile', {
        welcomeMessage: `Hello, ${username}` 
    });
});

app.listen(port, () => {
    console.log(`Vulnerable server running at http://localhost:${port}`);
});