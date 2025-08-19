var express = require('express');
const { get } = require('http');
var url = require("url");
var pgp = require('pg-promise')();
var db = pgp("dbConfig");
var router = express.Router();
var app = express();
app.use(express.json());

function merge(target, source) {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');   

router.get('/vul', function(req, res, next) {
    try{
        var url_params = url.parse(req.url, true).query;
        // SOURCE
        var input = url_params.input;
        payload = JSON.parse(input);
        console.log(payload);
        let normalObj = {};
        // SINK
        merge(normalObj, payload);
        const newObj = {}; 
        console.log(newObj.isAdmin); 
        console.log({}.isAdmin); 
    }catch (error) {
        console.error("err:", error);
    } 
});

app.use('/', router);
app.listen(3000, () => {
    console.log('Vulnerable server running on http://localhost:3000');
});