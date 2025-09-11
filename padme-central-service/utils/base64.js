module.exports = {
    
    encode: (plaintextString) => {
        
        const buff = Buffer.from(plaintextString, 'utf-8');
        const base64EncodedString = buff.toString('base64');
        return base64EncodedString;
    },

    decode: (base64EncodedString) => {
        
        const buff = Buffer.from(base64EncodedString, 'base64');
        const plaintextString = buff.toString('utf-8');
        return plaintextString;
    },

    isBase64: (base64EncodedString) => {
        const regex = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$');
        return regex.test(base64EncodedString);
    }

};