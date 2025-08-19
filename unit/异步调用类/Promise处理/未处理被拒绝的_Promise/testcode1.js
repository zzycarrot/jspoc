const express = require("express")
var router = express.router
router.post('/process',async function(req,res){
    url = req.url
    //SOURCE
    const response = await fetch(url)
    //SINK
    const data = JSON.parse(response)
    res.render("data",data)
});