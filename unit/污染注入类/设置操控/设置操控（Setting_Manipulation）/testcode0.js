const http = require('http');
const url = require('url');
const v8 = require('v8');

const server = http.createServer((request, response) => {
  try {
    // SOURCE
    const queryObject = url.parse(request.url, true).query;
    
    // 获取 flags 参数
    const flags = queryObject.flags || '';
    
    // SINK
    v8.setFlagsFromString(flags);
    
    // 响应内容
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(`V8 flags set: ${flags}`);
  } catch (error) {
    response.writeHead(500);
    response.end(`Error: ${error.message}`);
  }
});

server.listen(3000, 'localhost', () => {
  console.log('Server running at http://localhost:3000');
});