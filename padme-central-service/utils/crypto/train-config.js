const crypto = require('crypto');
const vaultUtil = require('../vault');
const base64Util = require('../base64');

const readStationPublickeyFromVault = async (ownerId) => {
    let publicKey = null;
    try {
        const readStationPublicKeyResult = await vaultUtil.readStationPublicKey(ownerId);
        console.log(readStationPublicKeyResult);
        const publicKeyBase64 = readStationPublicKeyResult.data.data[vaultUtil.CONSTANTS.KV_ENGINE.RSA.KEY_NAME.PUBLIC_KEY];
        publicKey = base64Util.decode(publicKeyBase64);
        console.log(publicKey);
    } catch (error) {
        console.error(error);
    }
    finally {
        return publicKey;
    }
};

const readCentralServicePublicKeyFromVault = async (jobId) => {
    let publicKey = null;
    try {
        const readCentralServicePublicKeyResult = await vaultUtil.readCentralServicePublicKey(jobId);
        console.log(readCentralServicePublicKeyResult);
        publicKey = readCentralServicePublicKeyResult.data.keys[readCentralServicePublicKeyResult.data[vaultUtil.CONSTANTS.TRANSIT_ENGINE.RSA.KEY_NAME.LATEST_VERSION]][vaultUtil.CONSTANTS.TRANSIT_ENGINE.RSA.KEY_NAME.PUBLIC_KEY];
        console.log(publicKey);
    } catch (error) {
        console.error(error);
    }
    finally {
        return publicKey;
    }
};

const readCentralServicePrivateKeyFromVault = async (jobId) => {
    let privateKey = null;
    try {

        const readCentralServicePrivateKeyResult = await vaultUtil.readCentralServicePrivateKey(jobId);
        //console.log(readCentralServicePrivateKeyResult);
        privateKey = readCentralServicePrivateKeyResult.data.keys['1'];
        //console.log(privateKey);

        if (!privateKey)
            throw new Error('Private key not found');
    
        return Promise.resolve(privateKey);
        
    } catch (error) {
        console.error(error);
        return Promise.reject(error);
    }
};

const getRsaPublickey = async ({ ownerId, jobId }, { isBase64 } = { isBase64: false }) => {


    let publicKey = null;

    if (ownerId) {
        publicKey = await readStationPublickeyFromVault(ownerId);
    }
    else {
        publicKey = await readCentralServicePublicKeyFromVault(jobId);
    }

    //  ***** TEMP CODE - START ****** if owner is train requester
    if (!publicKey)
        publicKey = await readCentralServicePublicKeyFromVault(jobId);
    //  ***** TEMP CODE - END ******

    if (!publicKey)
        return Promise.reject(new Error('Public key not found'));

    // base64 encoding
    if (isBase64) {
        publicKey = base64Util.encode(publicKey);
    }

    return Promise.resolve(publicKey);
};

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

const decryptWithRsaPrivateKey = async (toDecrypt, jobId) => {
    try {

        const privateKey = await readCentralServicePrivateKeyFromVault(jobId);
        let buffer = Buffer.from(toDecrypt, "base64");
        let decrypted = crypto.privateDecrypt(privateKey, buffer);
        let result = decrypted.toString("utf8");
        return Promise.resolve(result);
        
    } catch (error) {
        return Promise.reject(error);
    }
};

const getVaultSymmetricKeyBackupModel = (name, key, hmacKey, opts = {}) => {

    //opts.isBase64
    const isBase64 = opts.isBase64;

    const currDate = new Date();

    let backupModel = {
        "policy": {
            "name": `${name}`,
            "keys": {
                "1": {
                    "key": `${key}`,
                    "hmac_key": `${hmacKey}`,
                    "time": `${currDate.toISOString()}`,
                    "ec_x": null,
                    "ec_y": null,
                    "ec_d": null,
                    "rsa_key": null,
                    "public_key": "",
                    "convergent_version": 0,
                    "creation_time": currDate.valueOf()
                }
            },
            "derived": false,
            "kdf": 0,
            "convergent_encryption": false,
            "exportable": true,
            "min_decryption_version": 1,
            "min_encryption_version": 0,
            "latest_version": 1,
            "archive_version": 1,
            "archive_min_version": 0,
            "min_available_version": 0,
            "deletion_allowed": false,
            "convergent_version": 0,
            "type": 0,
            "backup_info": {
                "time": `${currDate.toISOString()}`,
                "version": 1
            },
            "restore_info": null,
            "allow_plaintext_backup": true,
            "version_template": "",
            "storage_prefix": ""
        },
        "archived_keys": {
            "keys": [
                {
                    "key": null,
                    "hmac_key": null,
                    "time": "0001-01-01T00:00:00Z",
                    "ec_x": null,
                    "ec_y": null,
                    "ec_d": null,
                    "rsa_key": null,
                    "public_key": "",
                    "convergent_version": 0,
                    "creation_time": 0
                },
                {
                    "key": `${key}`,
                    "hmac_key": `${hmacKey}`,
                    "time": `${currDate.toISOString()}`,
                    "ec_x": null,
                    "ec_y": null,
                    "ec_d": null,
                    "rsa_key": null,
                    "public_key": "",
                    "convergent_version": 0,
                    "creation_time": currDate.valueOf()
                }
            ]
        }
    };

    // base64 encoding
    if (isBase64) {
        let buff = Buffer.from(JSON.stringify(backupModel));
        backupModel = buff.toString('base64');
    }

    return backupModel;
}

const generateCentralServiceKeyPair = async(jobId) => {
    try {

        const writeCentralServiceKeyPairResult = await vaultUtil.writeCentralServiceKeyPair(jobId);
        console.log(writeCentralServiceKeyPairResult);
        return Promise.resolve();
        
    } catch (error) {
        return Promise.reject(error);
    }
};


module.exports = {
    getRsaPublickey,
    encryptWithRsaPublicKey,
    decryptWithRsaPrivateKey,
    generateCentralServiceKeyPair, 
    getVaultSymmetricKeyBackupModel
}