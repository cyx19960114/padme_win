const crypto = require('crypto');
const fs = require('fs');
const { publicKey, privateKey } = require('./configurationManager');
const algorithm = 'aes-256-ctr';

const encrypt = (buffer, key) => {
    // hash key
    hashKey = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
    // Create an initialization vector
    const iv = crypto.randomBytes(16);
    // Create a new cipher using the algorithm, key, and iv
    const cipher = crypto.createCipheriv(algorithm, hashKey, iv);
    // Create the new (encrypted) buffer
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

const decrypt = (encrypted, key) => {
    // hash key
    hashKey = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
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

// TODO: add test
const encryptWithRsaPublicKey = async (toEncrypt, publicKey) => {
    try {

        let buffer = Buffer.from(toEncrypt);
        let encrypted = crypto.publicEncrypt(publicKey, buffer);
        let result = encrypted.toString("base64");   
        return Promise.resolve(result);
        
    } catch (error) {
        return Promise.reject(error);
    }
};

// TODO: add test
const decryptWithRsaPrivateKey = async (toDecrypt, privateKey) => {
    try {

        let buffer = Buffer.from(toDecrypt, "base64");
        let decrypted = crypto.privateDecrypt(privateKey, buffer);
        let result = decrypted.toString("utf8");
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject(error);
    }

};

// TODO: add test
const validateRsaKeyPair = async (publicKey, privateKey) => {
    try {
        const toEncryptHashKey = crypto.createHash('sha256').update(String(crypto.randomBytes(16))).digest('base64').substr(0, 32);
        const encrypted = await encryptWithRsaPublicKey(toEncryptHashKey, publicKey);
        const decrypted = await decryptWithRsaPrivateKey(encrypted, privateKey);
        console.log(toEncryptHashKey);
        console.log(decrypted);
        if (toEncryptHashKey !== decrypted)
            throw new Error('Keys are not match');
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

module.exports = {
    encrypt,
    decrypt,
    validateRsaKeyPair
}