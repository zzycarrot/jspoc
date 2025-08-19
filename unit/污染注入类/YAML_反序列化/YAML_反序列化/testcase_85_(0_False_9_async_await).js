const express = require('express')
const yaml = require('js-yaml') // npm install js-yaml@2.0.4
const app = express()
app.use(express.text())

async function fetch(something) {
    return 'safe';
}

app.post('/parse', async (req, res) => {
  // SOURCE
  const userControlledYaml = req.body;
  // here
  try {
    async function asyncFlow() {
      const data = await fetch(userControlledYaml);
      return data;
    }
    const safeData = await asyncFlow();
    // SINK
    const parsedData = yaml.load(safeData)
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