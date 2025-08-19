const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  //SOURCE
    let q = url.parse(req.url, true);
  //SINK
    console.info(`[INFO] User: ${q.query.username}`); // BAD: User input logged as-is
})

server.listen(3000, '127.0.0.1', () => {});