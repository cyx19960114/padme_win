
const fs = require('fs');
const path = require('path');
const os = require('os');

const getTempDirPath = (dirPath) =>
{
    return path.join(os.tmpdir(), dirPath);
}

const getTempDir = (dirPath, empty) => {

    // empty : if it already exists, remove all old files

    const tempDirPath = getTempDirPath(dirPath);

    try {

        fs.mkdirSync(tempDirPath, { recursive: true });
        return tempDirPath;

    } catch (error) {

        if (error.code === 'EEXIST') {
            console.log(`already exists`);

            if (empty) {

                try {

                    fs.rmdirSync(tempDirPath, { recursive: true });
                    fs.mkdirSync(tempDirPath, { recursive: true });

                } catch (error) {
                    console.log(error);
                    return null
                }
            }
            
            return tempDirPath;
        }
        else {
            console.log(error);
            return null
        }
    }
}


const getEncryptedTarArchiveFileName = () => {

    const encryptedTarArchiveFileName = "file.enc";
    return encryptedTarArchiveFileName;

}

const getEncryptedTarArchiveFilePathInContainer = () => {

    const encryptedTarArchiveFileName = getEncryptedTarArchiveFileName();
    const encryptedTarArchiveFilePathInContainer = path.join("/", encryptedTarArchiveFileName);
    return encryptedTarArchiveFilePathInContainer;
    
}

module.exports = {
    getTempDir, 
    getTempDirPath,
    getEncryptedTarArchiveFileName, 
    getEncryptedTarArchiveFilePathInContainer
};