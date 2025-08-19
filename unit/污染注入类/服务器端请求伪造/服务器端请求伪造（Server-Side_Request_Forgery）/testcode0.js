import http from 'http';

const server = http.createServer(function(req, res) {
    //SOURCE
    const target = new URL(req.url, "http://example.com").searchParams.get("target");

    // BAD: `target` is controlled by the attacker
    //SINK
    http.get('https://' + target + ".example.com/data/", res => {
        // process request response ...
    });

});