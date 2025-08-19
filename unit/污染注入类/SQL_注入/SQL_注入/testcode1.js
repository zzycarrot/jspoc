const mongoose = require('mongoose');
const TokenModel  = require('./utils/Tokenmodel.js');

var express = require('express');
var url = require("url");
var router = express.Router();


function getInst(m, ...args) {
  if (!insts.get(m)) {
    insts.set(m, new m(args));
  }
  return insts.get(m);
}
class baseController {
    constructor() {
      mongoose.connect('mongodb://localhost/yapitest', { 
        useNewUrlParser: true,
        useUnifiedTopology: true 
      });
        this.tokenModel = new TokenModel.tokenModel();
        this.roles = {
          admin: 'Admin',
          member: '网站会员'
        };
      }
    async init(ctx) {
        let params = Object.assign({}, ctx.query, ctx.request.body);
        let token = params.token;
        let checkId = await this.getProjectIdByToken(token); //here
      }
    async getProjectIdByToken(token) {
        let projectId = await this.tokenModel.findId(token);
        
        if (projectId) {
          return projectId.toObject().project_id;
        }
      }
    async insertTokenWithProject(token, projectId) {
        try {
          const result = await this.tokenModel.insertTokenWithProject(token, projectId);
          return result;
        } catch (error) {
          console.error("插入错误:", error);
        }
      }
}

const maliciousToken = { $regex: "^i.*" };

router.get('/products/detail', function(req, res, next) {
  check_logged(req, res);
  var url_params = url.parse(req.url, true).query;
  var token = url_params.token;
  const findresult = controller.getProjectIdByToken(token);
});

    


