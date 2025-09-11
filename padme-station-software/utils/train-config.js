const path = require('path');
const tarStream = require("tar-stream");
const cryptoUtil = require('./crypto');

const train_config_constant = {
    "rsa_public_key": "rsa_public_key",
    "symmetric_key": "symmetric_key"
}

const getTrainConfigJsonBaseModel = () => {
    const train_config = {};
    return train_config
}

const getTrainConfigFileName = () => {
    const trainConfigFileName = 'train_config.json';
    return trainConfigFileName;
}

const getTrainConfigFileAbsolutePath = () => {
    const trainConfigFileAbsolutePath = '/';
    return trainConfigFileAbsolutePath;
}

const getTrainConfigFilePathInContainer = () => {

    const trainConfigFileName = getTrainConfigFileName();
    const trainConfigFileAbsolutePath = getTrainConfigFileAbsolutePath();
    const trainConfigFilePathInContainer = path.join(trainConfigFileAbsolutePath, trainConfigFileName);
    return trainConfigFilePathInContainer;
}

const streamToString = (stream) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

const unTarTrainConfigJson = (getArchiveResult) => {

    let train_config = {};

    return new Promise((resolve, reject) => {

        let extract = tarStream.extract();
        extract.on('entry', async (header, stream, next) => {

            try {

                if (header.type == "file" && header.name == getTrainConfigFileName()) {
                    train_config = await streamToString(stream);
                    train_config = JSON.parse(train_config);
                    resolve(train_config);
                    return;
                }
                next();

            } catch (error) {
                reject(error);
            }

        });

        extract.on('finish', () => {
            resolve(train_config);
        });

        getArchiveResult.pipe(extract);

    });
}

const tarTrainConfigJson = (train_config) => {

    let pack = tarStream.pack();

    pack.entry({ name: getTrainConfigFileName() }, JSON.stringify(train_config));
    pack.finalize();
    return pack;

}

const decryptSymmetricKey = async (encryptedSymmetricKey) => {
    try {
        const decryptedSymmetricKey = cryptoUtil.decryptWithRsaPrivateKey(encryptedSymmetricKey);
        return Promise.resolve(decryptedSymmetricKey);
    } catch (error) {
        return Promise.reject(error);
    }
}

const updateTrainConfigJson = async (train_config, symmetricKey, opts = {}) => {

    try {
        // get dest repository public key for encryption
        const destPublicKey = train_config[train_config_constant['rsa_public_key']];
        // (re)encrypt symmetric key with the next repo public key
        const encryptedSymmetricKey = await cryptoUtil.encryptWithRsaPublicKey(symmetricKey, destPublicKey);
        // update train_config
        train_config[train_config_constant['symmetric_key']] = encryptedSymmetricKey;

        return Promise.resolve(train_config);

    } catch (error) {
        return Promise.reject(error);
    }

}


module.exports = {
    
    getTrainConfigJsonBaseModel,
    getTrainConfigFileName,
    getTrainConfigFileAbsolutePath,
    getTrainConfigFilePathInContainer,
    unTarTrainConfigJson,
    updateTrainConfigJson,
    tarTrainConfigJson,
    decryptSymmetricKey,
    train_config_constant

}