const { envFileToTuples, envFileToDictionary } = require('./envFileParser')

test('check envFileToTuples with empty input', () => {
    expect(envFileToTuples("")).toEqual([])
})
const valid_env = `STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
`
const valid_return = [
    ["STATION_ID", "aachenbeeck"],
    ["MONGO_HOST", "pht-mongo"],
    ["MONGO_PORT", "27017"],
    ["MONGO_USER", "admin"],
    ["MONGO_PASSWORD", "admin"],
    ["MONGO_DB","pht"]
]

test('check envFileToTuples with valid input', () => {
    expect(envFileToTuples(valid_env)).toEqual(valid_return)
})

const not_valid_env = `STATION_ID
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD
MONGO_DB=pht
`

const not_valid_return = [
    ["MONGO_HOST", "pht-mongo"],
    ["MONGO_PORT", "27017"],
    ["MONGO_USER", "admin"],
    ["MONGO_DB","pht"]
]

test('check envFileToTuples with not valid input', () => {
    // add spaces into the env
    expect(envFileToTuples(not_valid_env)).toEqual(not_valid_return)
})

const valid_dict_return = {
    "STATION_ID": "aachenbeeck",
    "MONGO_HOST": "pht-mongo",
    "MONGO_PORT": "27017",
    "MONGO_USER": "admin",
    "MONGO_PASSWORD": "admin",
    "MONGO_DB": "pht"
}

test('check envFileToDict with valid input', () => {
    expect(envFileToDictionary(valid_env)).toEqual(valid_dict_return)
})