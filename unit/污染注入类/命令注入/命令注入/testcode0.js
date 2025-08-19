const express = require('express')
const app = express()

const cp = require('child_process')

app.get('/ls-remote', (req, res) => {
  // SOURCE
  const remote = req.query.remote
  // SINK
  cp.execFile('git', ['ls-remote', remote])
})
