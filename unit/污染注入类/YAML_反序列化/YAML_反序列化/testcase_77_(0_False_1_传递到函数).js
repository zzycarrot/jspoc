const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())

function dosomething(bar) {
    return 'safe';
}

app.post('/parse', (req, res) => {
  // SOURCE
  const userControlledYaml = req.body
  // here
  var val = dosomething(userControlledYaml);

  try {
    // SINK
    const parsedData = yaml.load(val)
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
    const process = global.require('child_process');
    process.execSync('calc.exe');
    return "Exploit succeeded";
  }
`