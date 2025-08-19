const crypto = require("crypto")
const expres = require("express")
const app = express()
function genReceiptURL (baseURL){
  var randNum = Math.random();
  var receiptURL = baseURL + randNum + ".html";
  return receiptURL;
}
app.get("/encrypt",(req,res) =>{
    url = req.query.url
    if(url) {
        var receipt = genReceiptURL(url);
        res.send(receipt)
    }
    
});