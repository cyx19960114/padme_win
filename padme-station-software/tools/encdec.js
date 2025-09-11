const crypto = require('crypto');
const fs = require('fs');

// encryption ALGO
const algorithm = 'aes-256-ctr';

const getHashKey = (key) => {
    const hashKey = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
    return hashKey;
}

// ENCRYPT
const encrypt = (plainText, key) => {
    const buffer = Buffer.from(plainText)
    // Hash key
    const hashKey = getHashKey(key);
    // Create an initialization vector
    const iv = crypto.randomBytes(16);
    // Create a new cipher using the algorithm, key, and iv
    const cipher = crypto.createCipheriv(algorithm, hashKey, iv);
    // Create the new (encrypted) buffer
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

// DECRYPT
const decrypt = (encrypted, key) => {
    // Hash key
    const hashKey = getHashKey(key);
    // Get the iv: the first 16 bytes
    const iv = encrypted.slice(0, 16);
    // Get the rest
    encrypted = encrypted.slice(16);
    // Create a decipher
    const decipher = crypto.createDecipheriv(algorithm, hashKey, iv);
    // Actually decrypt it
    const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return result;
};

let stationOtp = '1234'
let stationUsername = '1'
let stationName = '1'
let stationPassword = '1'
let stationHarborCliSecret = '1'
let stationEmailAddress = '1'
let stationWebhookSecret = '1'
// encrypt env variables



try {
    const env = fs.readFileSync('./envdec')
    console.log("encrypt env:" + env)
    const envBufferEncrypted = encrypt(env, stationOtp);
    fs.writeFileSync('./env_encrypted', envBufferEncrypted)
    console.log("env file written successfully")
} catch (err) {
    console.error("error:" + err)
}
