const { generateKeyPair } = require('crypto')


const MODULUS_LENGTH = 4096

// https://nodejs.org/api/crypto.html#crypto_keyobject_export_options
const EXPORT_OPTIONS_PUBLIC = {
  type: 'spki',
  format: 'pem'
}

const EXPORT_OPTIONS_PRIVATE = {
  type: 'pkcs8',
  format: 'pem'
}

const generator = async () => {
  return new Promise((res, rej) => {
    generateKeyPair('rsa', {
      modulusLength: MODULUS_LENGTH
    }, (err, pub, priv) => {
      if (err) {
        rej(err)
        return
      } else {
        res({pub, priv})
      }
    })
  })
  
}

module.exports = { keyGenerator: generator, EXPORT_OPTIONS_PRIVATE, EXPORT_OPTIONS_PUBLIC }