const express = require('express');
const app = express();  

app.all('*', (req, res) => {
    // SOURCE
    const headerValue = req.query.header;
    
    // SINK
    if(headerValue) {
        res.set('the-header', headerValue); 
    }
    
    res.send('OK!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Vulnerable server running at http://localhost:${PORT}`);
    console.log(`Test with: curl http://localhost:${PORT}/?header=malicious_value`);
});
//Ratpack