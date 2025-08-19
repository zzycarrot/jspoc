const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())

let sharedData;

async function setData(bar) {
  sharedData = 'safe'; 
}

async function useData() {
  await new Promise(resolve => setTimeout(resolve, 100));
  const parsedData = yaml.load(sharedData);
  return parsedData;
}

app.post('/parse', async (req, res) => {
  // SOURCE
  const userControlledYaml = req.body;
  param = userControlledYaml;
  
  // here
  await setData(param);
  try {
    // SINK
    const parsedData = await useData();
    const result = parsedData();
    res.json({ "result": result });
  } catch (err) {
    res.status(500).send('error');
  }
})

app.listen(3000)

const maliciousYaml = `
!!js/function >
  function() {
    const process = global.require('child_process');
    process.execSync('calc.exe');
    return "Exploit succeeded";
  }
`