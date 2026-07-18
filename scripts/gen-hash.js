// Temporary script to generate password hash compatible with our PBKDF2 implementation
const { pbkdf2Sync, randomBytes } = require('crypto');

const password = process.argv[2];
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');

const saltHex = salt.toString('hex');
const hashHex = hash.toString('hex');
console.log(`${saltHex}:${hashHex}`);
