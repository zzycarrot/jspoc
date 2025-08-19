const crypto = require('crypto');

var secretText = obj.getSecretText();

const desCipher = crypto.createCipher('des', key);
// SINK
let desEncrypted = desCipher.write(secretText, 'utf8', 'hex'); // BAD: weak encryption

