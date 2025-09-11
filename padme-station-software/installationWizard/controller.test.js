
test('Test confupload with valid encrypted values', async () => {
jest.mock('./token_crypt')
const { decrypt } = require('./token_crypt')
const envmock = "decrypted_env_data"
decrypt.mockReturnValue(envmock)

const configurationManagerMock = {
    envconfiguration: "",
    envconfigurationSanityCheck: jest.fn().mockResolvedValue("")
}

const res = {sendStatus: jest.fn()}
const req = {files: {envfile: "mockfile"}}

const controllerFactory = require('./controller')
await controllerFactory(configurationManagerMock).confupload(req, res)
expect(res.sendStatus.mock.calls[0][0]).toEqual(200)
expect(configurationManagerMock.envconfiguration).toEqual(envmock)
})

test('Test confupload with invalid encrypted values', async () => {
    jest.mock('./token_crypt')
    const { decrypt } = require('./token_crypt')
    const envmock = "decrypted_env_data"
    decrypt.mockReturnValue(envmock)
    
    // sanity check rejects now
    const configurationManagerMock = {
        envconfiguration: "",
        envconfigurationSanityCheck: jest.fn().mockImplementation( async (x) => {
            return Promise.reject("")
        })
    }
    
    const res = {sendStatus: jest.fn()}
    const req = {files: {envfile: "mockfile"}}
    
    const controllerFactory = require('./controller')
    await controllerFactory(configurationManagerMock).confupload(req, res)
    expect(res.sendStatus.mock.calls[0][0]).toEqual(400)
    })

test('Test confupload with invalid encryption values', async () => {
    jest.mock('./token_crypt')
    const { decrypt } = require('./token_crypt')
    const envmock = "decrypted_env_data"
    decrypt.mockImplementation((x,z) => {
        throw "Mock exeception for testing purposes"
    })
    
    // sanity check rejects now
    const configurationManagerMock = {
        envconfiguration: "",
        envconfigurationSanityCheck: jest.fn().mockResolvedValue("")
    }
    
    const res = {sendStatus: jest.fn()}
    const req = {files: {envfile: "mockfile"}}
    
    const controllerFactory = require('./controller')

    await controllerFactory(configurationManagerMock).confupload(req, res)

    expect(res.sendStatus.mock.calls[0][0]).toEqual(400)
    expect(configurationManagerMock.envconfiguration).not.toEqual(envmock)
})

