var express = require('express');
var router = express.Router();

function getUserProfile(user) {
    // SINK: Potential null dereference when accessing properties
    return {
        name: user.name,
        email: user.email,
        address: user.address.street // SINK
    };
}

router.get('/profile', function(req, res) {
    // SOURCE: User input from query parameters
    var userId = req.query.id;
    
    // Simulate database lookup that might return null
    var user = getUserFromDatabase(userId);
    
    try {
        var profile = getUserProfile(user); // SINK
        res.json(profile);
    } catch (err) {
        res.status(500).send("Error processing profile");
    }
});

function getUserFromDatabase(id) {
    // Simulate database lookup that might return null/undefined
    var users = {
        '1': { name: 'Alice', email: 'alice@example.com', address: { street: '123 Main St' } },
        '2': { name: 'Bob', email: 'bob@example.com' } // Missing address
    };
    return users[id]; // Could return undefined if id doesn't exist
}