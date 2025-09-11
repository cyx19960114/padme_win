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

const updateTrainConfigJson = async (train_config, { dest, jobId } = {}) => {

    try {

        // central serivce public key
        train_config[train_config_constant.rsa_public_key] = await cryptoUtil.trainConfig.getRsaPublickey({ jobId: jobId });

        if (train_config[train_config_constant.symmetric_key]) {

            console.log("encryptedSymmetricKey_before", train_config[train_config_constant.symmetric_key]);

            // decrypt symmetric key with center private key
            const decryptedSymmetricKey = await cryptoUtil.trainConfig.decryptWithRsaPrivateKey(train_config[train_config_constant.symmetric_key], jobId);

            console.log("decryptedSymmetricKey", decryptedSymmetricKey);

            // get dest repository public key for encryption
            const destPublicKey = await cryptoUtil.trainConfig.getRsaPublickey({ ownerId: dest, jobId: jobId });

            console.log("dest", dest);
            console.log("destPublicKey", destPublicKey);

            // (re)encrypt symmetric key with the next station public key
            const encryptedSymmetricKey = await cryptoUtil.trainConfig.encryptWithRsaPublicKey(decryptedSymmetricKey, destPublicKey);

            console.log("encryptedSymmetricKey", encryptedSymmetricKey);

            // update train_config
            train_config[train_config_constant.symmetric_key] = encryptedSymmetricKey;
        }

        return Promise.resolve(train_config);
    } catch (error) {
        return Promise.reject(error);
    }
}

const decryptSymmetricKey = async (encryptedSymmetricKey, jobId) => {
    try {
        const decryptedSymmetricKey = cryptoUtil.trainConfig.decryptWithRsaPrivateKey(encryptedSymmetricKey, jobId);
        return Promise.resolve(decryptedSymmetricKey);
    } catch (error) {
        return Promise.reject(error);
    }
}


module.exports = {
    train_config_constant,
    getTrainConfigJsonBaseModel,
    getTrainConfigFileName,
    getTrainConfigFileAbsolutePath,
    getTrainConfigFilePathInContainer,
    unTarTrainConfigJson,
    updateTrainConfigJson,
    tarTrainConfigJson, 
    decryptSymmetricKey
}