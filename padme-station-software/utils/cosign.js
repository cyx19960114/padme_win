const { execSync } = require('child_process');
const axios = require('axios').default;
const fs = require('fs');
const { getCSTargetURL } = require('../utils/utility');

const SIGNATURE_PUBLIC_KEY_LOCATION = '/usr/src/app/utils/cosign.pub';
let signaturePublicKeyAPI = `${getCSTargetURL()}/api/stations/signaturepublickey`;

const COSIGN_VERIFIED = 'COSIGN_VERIFIED';
const COSIGN_DISABLED = 'COSIGN_DISABLED';
const COSIGN_UNVERIFIED = 'COSIGN_UNVERIFIED'

const verifyImage = (image) => {
    if (process.env.COSIGN_ENABLED === 'true') {
        try {
            execSync(`cosign verify --key ${SIGNATURE_PUBLIC_KEY_LOCATION}  ${image}`).toString();
            console.log(`Image verified`);
            return COSIGN_VERIFIED;
        } catch (error) {
            console.log(`Error verifying image. Status: ${error.status} - ${error.stderr}`);
            return COSIGN_UNVERIFIED;
        }
    } else {
        console.log(`Cosign Image Verification Not Enabled`);
        return COSIGN_DISABLED;
    }
}

const loginToRegistry = () => {
    try {
        execSync(`cosign login ${process.env.HARBOR_ADDRESS} -u ${process.env.HARBOR_USER} -p ${process.env.HARBOR_CLI}`).toString();
        console.log('Cosign Logged Into Registry')
    } catch (error) {
        console.log(`Cosign login to registry failed. Status: ${error.status} - ${error.stderr}`);
    }
}

const downloadSignaturePublicKey = async () => {
    try {
        if (process.env.SIGNATURE_PUBLIC_KEY_ENDPOINT) {
            signaturePublicKeyAPI = process.env.SIGNATURE_PUBLIC_KEY_ENDPOINT;
        }
        const response = await axios.get(signaturePublicKeyAPI);
        if (response.status === 200) {
            await fs.writeFile(SIGNATURE_PUBLIC_KEY_LOCATION, response.data.value, err => {
                if (err) {
                    console.error(`Error writing signature public key to storage: ${err}`);
                } else {
                    console.log(`Signautre public key written to storage`);
                }
            });
        } else {
            console.log(`Unable to get signature public key, status: ${response.status}, ${response}`);
        }
    } catch (error) {
        console.log(`Error while getting signature public key: ${error}`);
    }
}

module.exports = { verifyImage, loginToRegistry, downloadSignaturePublicKey }