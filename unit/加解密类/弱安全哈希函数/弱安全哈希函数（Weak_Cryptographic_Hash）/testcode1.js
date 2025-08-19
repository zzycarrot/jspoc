var crypto = require('crypto');
const { Buffer } = require('buffer'); 
var md5    = crypto.createHash('md5'),
    buffer = new Buffer(8 + this.BODY_SIZE);

buffer.writeUInt32BE(this._keyValues[0], 0);
buffer.writeUInt32BE(this._keyValues[1], 4);
new Buffer(this._body).copy(buffer, 8, 0, this.BODY_SIZE);

md5.update(buffer);
return new Buffer(md5.digest('binary'), 'binary');
//bcoin