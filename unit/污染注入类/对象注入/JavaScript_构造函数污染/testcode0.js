// vulnerability.js
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const users = {
  admin: { isAdmin: true },
  user1: { isAdmin: false }
};

function unsafeMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      unsafeMerge(target[key], source[key]);
    } else {
      // SOURCE: 
      target[key] = source[key];
    }
  }
  return target;
}
app.post('/update-profile', (req, res) => {
  const { username, updates } = req.body;
  
  if (!users[username]) {
    return res.status(404).send('User not found');
  }
  
  // SINK:
  unsafeMerge(users[username], updates);
  
  res.send('Profile updated successfully');
});
app.get('/is-admin/:username', (req, res) => {
  const { username } = req.params;
  
  if (!users[username]) {
    return res.status(404).send('User not found');
  }
  res.json({
    isAdmin: users[username].isAdmin
  });
});
app.post('/safe-update', (req, res) => {
  const { username, updates } = req.body;
  
  if (!users[username]) {
    return res.status(404).send('User not found');
  }
  for (const key in updates) {
    if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      users[username][key] = updates[key];
    }
  }
  
  res.send('Profile updated securely');
});

app.listen(port, () => {
  console.log(`Vulnerable server running on http://localhost:${port}`);
  console.log(`Test endpoint: POST /update-profile`);
});