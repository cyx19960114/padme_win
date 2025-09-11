const dotenv = require('dotenv')

function envFileToTuples(content) {
    if(content === "" || typeof content.split !== 'function') {
        return []
    }

    const config = dotenv.parse(content) // will return an object
    const tuples = Object.entries(config);

    // const tuples = content.split('\n').map(x => x.split('=')).filter((x) => {return x.length == 2 && x[0] !== [] && x[1] !== []})
    
    return tuples
}

function envFileToDictionary(content) {
    const tuples = envFileToTuples(content)
    const dict = {}
    for (tup of tuples) {
        dict[tup[0]] = tup[1]
    }
    return dict
}

module.exports = {
    envFileToTuples,
    envFileToDictionary
}