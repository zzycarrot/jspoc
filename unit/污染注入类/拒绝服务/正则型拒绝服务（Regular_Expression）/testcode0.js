var express = require('express');
var app = express();

app.get('/findKey', function(req, res) {
  // SOURCE:
  var key = req.param("key"), input = req.param("input");
  
  var re = new RegExp("\\b" + key + "=(.*)\n");
  // SINK:
  re.test(input);
});
app.listen(3000);