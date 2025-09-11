const crypto = require('crypto');
const base64Util = require('../base64');

readStationPublicKey = () => {
    const publicKey = base64Util.isBase64(process.env.PUBLIC_KEY) ? base64Util.decode(process.env.PUBLIC_KEY) : process.env.PUBLIC_KEY ;
    console.log("publicKey");
    console.log(publicKey);
    return publicKey;
},

readStationPrivateKey = () => {
    console.log(process.env);
    const privateKey = base64Util.isBase64(process.env.PRIVATE_KEY) ? base64Util.decode(process.env.PRIVATE_KEY) : process.env.PRIVATE_KEY;
    console.log("privateKey");
    console.log(privateKey);
    return privateKey;
}

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

const decryptWithRsaPrivateKey = async (toDecrypt) => {
    try {
        
        const privateKey = readStationPrivateKey();
        let buffer = Buffer.from(toDecrypt, "base64");
        let decrypted = crypto.privateDecrypt(privateKey, buffer);
        let result = decrypted.toString("utf8");
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject(error);
    }

};


module.exports = {
    encryptWithRsaPublicKey,
    decryptWithRsaPrivateKey,
    getVaultSymmetricKeyBackupModel
}