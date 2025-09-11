
const { checkLock, getContentFromLock, createLock } = require('./Lock')

jest.mock('fs', () => {return { promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn()
}}})

const fs = require('fs')

test('test check lock, lock exists', async () => {
    fs.promises.access.mockResolvedValue(true)
    expect(checkLock('')).resolves.toBe(true)
})

test('test check lock, lock does not exists', async () => {
    fs.promises.access.mockRejectedValue(false)
    expect(checkLock('')).rejects

})

test('test get lock content, lock does  exists', async () => {
    const testVal = "TEST"
    fs.promises.readFile = jest.fn()
    fs.promises.readFile.mockResolvedValue(testVal)
    expect(getContentFromLock('')).resolves.toEqual(testVal)

})

/*test('test get lock content, lock does not exists', async () => {
    fs.promises.readFile.mockRejectedValue("")
    expect(getContentFromLock('')).rejects
})*/

test('check correct path in get lock content with path, lock does exists', async () => {
    const testVal = "TEST"
    fs.promises.readFile = jest.fn()
    fs.promises.readFile.mockResolvedValue(testVal)
    expect(getContentFromLock('/test/test2')).resolves.toEqual(testVal)
    expect(fs.promises.readFile.mock.calls[0][0]).toEqual('/test/test2/stationsetup.lock')

    expect(getContentFromLock('/test/test2/')).resolves.toEqual(testVal)
    expect(fs.promises.readFile.mock.calls[0][0]).toEqual('/test/test2/stationsetup.lock')
})

test('check correct path in check lock with path, lock does exists', async () => {
    const testVal = "TEST"
    fs.promises.access = jest.fn()
    fs.promises.access.mockResolvedValue(true)
    expect(checkLock('/test/test2')).resolves.toBe(true)
    expect(fs.promises.access.mock.calls[0][0]).toEqual('/test/test2/stationsetup.lock')

    expect(checkLock('/test/test2/')).resolves.toBe(true)
    expect(fs.promises.access.mock.calls[0][0]).toEqual('/test/test2/stationsetup.lock')
})
/*
test('check create lock', async () => {
    const testVal = "TEST"
    fs.promises.writeFile = jest.fn()
    fs.promises.writeFile.mockResolvedValue(true)

    fs.promises.access.mockResolvedValue(true)

    await expect(createLock('/test/test2', testVal)).resolves.toEqual(true)
    expect(fs.promises.writeFile.mock.calls[0][0]).toEqual('/test/test2/stationsetup.lock')
    expect(fs.promises.writeFile.mock.calls[0][1]).toEqual(testVal)

})*/
