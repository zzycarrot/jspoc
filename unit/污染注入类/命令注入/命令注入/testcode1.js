var cp = require("child_process"),
    http = require('http'),
    url = require('url');

var server = http.createServer(function(req, res) {
    // SOURCE
    let file = url.parse(req.url, true).query.path;
    // SINK
    cp.execSync(`wc -l ${file}`);
});