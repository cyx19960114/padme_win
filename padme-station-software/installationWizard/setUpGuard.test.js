

test('test setUpGuard with not existing lockfile in dir', async () => {
    jest.mock('./utils/envFileParser')
    jest.mock('../installationWizard/app')
    jest.mock('./utils/Lock.js')
    jest.mock('../utils/base64')

    // mock lock
    const locks = require('./utils/Lock.js')
    locks.checkLock.mockResolvedValue(false)

    const app = require('../installationWizard/app')

    // mock the configuration manager
    app.get.mockReturnValue({
        configurationEnd: jest.fn().mockImplementation(async () => {
            return Promise.resolve()
        })
    })
    app.listen.mockReturnValue({close: jest.fn()})

    const base64 =require('../utils/base64')

    const port = 90

    const { envFileToTuples } = require('./utils/envFileParser')

    envFileToTuples.mockReturnValue([])

    const setUpGuardFactory = require('./setUpGuard')
    await setUpGuardFactory('')(port)

    // server did start listening once
    expect(app.listen.mock.calls.length).toBe(1)
    // server was closed one
    expect(app.listen.mock.calls.length).toBe(1)
    // server started listening on the correct port
    expect(app.set.mock.calls[0][1]).toEqual(port)
    expect(app.listen.mock.calls[0][0]).toBe(port)


})

test('test setUpGuard with existing lockfile in dir', async () => {
    jest.mock('./utils/envFileParser')
    jest.mock('../installationWizard/app')
    jest.mock('./utils/Lock.js')

    // mock lock
    const locks = require('./utils/Lock.js')
    locks.checkLock.mockResolvedValue(true)
    locks.getContentFromLock.mockResolvedValue("")

    const { envFileToTuples } = require('./utils/envFileParser')

    envFileToTuples.mockReturnValue([])


    const setUpGuardFactory = require('./setUpGuard')
    await setUpGuardFactory('')(0)

    // content from the lockfile was retrieved
    expect(locks.getContentFromLock.mock.calls.length).toBe(1)

})