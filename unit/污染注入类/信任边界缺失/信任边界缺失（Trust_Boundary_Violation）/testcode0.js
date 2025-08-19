const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', email: 'admin@example.com' },
  { id: 2, username: 'user1', password: 'pass123', role: 'user', email: 'user1@example.com' }
];

const SECRET_KEY = 'secret_key';
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => 
    u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
  
  res.json({ token });
});
app.post('/update-profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // SOURCE
    const userUpdates = req.body;

    const updatedUser = {
      ...user,        
      ...userUpdates 
    };
    const userIndex = users.findIndex(u => u.id === userId);
    // SINK
    users[userIndex] = updatedUser;
    if (updatedUser.role === 'admin') {
      console.log(`[ADMIN] Granting admin privileges to: ${updatedUser.email}`);
    }
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        email: updatedUser.email
      }
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});