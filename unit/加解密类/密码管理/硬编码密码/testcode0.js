var express = require('express');
var router = express.Router();

// Hardcoded password vulnerability
function authenticate(username, password) {
    // SOURCE: password parameter (user input)
    // Hardcoded password
    const ADMIN_PASSWORD = 'SuperSecret123!'; // SINK: Hardcoded sensitive information
    
    if (password === ADMIN_PASSWORD) {
        return { authenticated: true, role: 'admin' };
    }
    return { authenticated: false };
}

router.post('/login', function(req, res) {
    // SOURCE
    const username = req.body.username;
    const password = req.body.password;
    
    const authResult = authenticate(username, password);
    
    if (authResult.authenticated) {
        res.send({ status: 'success', role: authResult.role });
    } else {
        res.status(401).send({ status: 'failed' });
    }
});