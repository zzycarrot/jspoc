const crypto = require('crypto');

var secretText = obj.getSecretText();

const aesCipher = crypto.createCipher('aes-128', key);
let aesEncrypted = aesCipher.update(secretText, 'utf8', 'hex'); // GOOD: strong encryption
