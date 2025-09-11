const fs = require('fs').promises

const LOCKFILE='stationsetup.lock'
const dirWithSlash = dir => { return dir === '' || dir.slice(-1) === '/' ? dir : dir + '/' }


async function checkLock(dir='') {
    // check if the lockfile for the wizard exists in the dir
    try {
        await fs.access(dirWithSlash(dir) + LOCKFILE)
        return true
    } catch {
        return false
    }
}

async function createLock(dir='', content) {
    // creates the lock file if it doesnt exist
    // returns true if its exist or if it was created successful
    return checkLock(dir).then(does => {
        if (!does) {
            return fs.writeFile(path=dirWithSlash(dir) + LOCKFILE, data=content)
        }
    }).then(() => {
        return true
    }).catch((err) => {
        console.log(err)
        return false
    })
}

async function getContentFromLock(dir='') {
    return fs.readFile(path=(dirWithSlash(dir) + LOCKFILE))
    .then(content => {
        return Promise.resolve(String(content))
    }).catch( err => {
        return Promise.reject()
    })
}

module.exports = {
    checkLock,
    createLock,
    getContentFromLock
}