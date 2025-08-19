const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

let sharedData; // here - 添加共享变量

async function setData(param) {
  sharedData = param; // here - 设置数据
}

async function useData(res) {
  await new Promise(resolve => setTimeout(resolve, 100));
  // XML 字符串拼接
  const vulnerableXML = `
  <userProfile>
      <username>${sharedData}</username> 
      <accessLevel>user</accessLevel>
  </userProfile>`; // here - 使用共享数据
  
  res.type('application/xml');
  res.send(vulnerableXML); // Sink
}

app.get('/vulnerable', async (req, res) => {
    // Source
    const username = req.query.username || 'guest';
    param = username; // here
    
    await setData(param); // here
    await useData(res); // here
});

app.listen(3000);