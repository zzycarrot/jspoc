var express = require('express');
var router = express.Router();

router.get('/search', function(req, res) {
    // SOURCE
    var searchQuery = req.query.q;
    
    // DOM型XSS漏洞 - 直接将用户输入插入到DOM中
    var htmlResponse = `
        <html>
        <body>
            <h1>Search Results</h1>
            <div id="results">
                <script>
                    // SINK
                    document.getElementById("results").innerHTML = "You searched for: ${searchQuery}";
                </script>
            </div>
        </body>
        </html>
    `;
    
    res.send(htmlResponse);
});

module.exports = router;