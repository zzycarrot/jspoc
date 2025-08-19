const http = require('http');
const url = require('url');

http.createServer(function (req, res) {
    const queryObject = url.parse(req.url, true).query;
    const userData = queryObject.username; // Source
    res.setHeader("Set-Cookie", "user=" + userData); // Sink

    res.end("Cookie set!");
}).listen(8080);
