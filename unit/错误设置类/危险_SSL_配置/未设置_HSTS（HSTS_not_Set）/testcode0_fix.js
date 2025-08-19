const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload' 
  );
  next();
});