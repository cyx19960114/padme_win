const { encrypt, decrypt } = require('./token_crypt')

const testvalues = ["", "test1", "test2", "&%$&)!??????12345"]

test('Test with various values', () => {
    for (testval of testvalues) {
        const crypt = encrypt(testval, "password1234")
        expect(String(decrypt(crypt, "password1234"))).toEqual(testval)
    }
})