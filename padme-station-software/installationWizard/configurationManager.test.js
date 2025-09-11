const configurationManager = require('./configurationManager')


test('Test getHarborUserNameAndPassword with valid input', () => {
    c = configurationManager
    c.envconfiguration = `STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_USER=aachenbeeck
HARBOR_PASSWORD=oldpassword
HARBOR_CLI=di1nr5t1307m4yy7q7bf8xclhbp7bogh
OTHER_HARBOR_CLI=6n757ho8teukkz07ewta9t8570sovcbl
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_ADDRESS=menzel.informatik.rwth-aachen.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988`
    let {username, password} = c.getHarborUsernameAndPassword()
    expect(username).toEqual('aachenbeeck')
    expect(password).toEqual('oldpassword')
})

test('Test getHarborUserNameAndPassword with not valid input', () => {
    c = configurationManager
    c.envconfiguration = `STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_CLI=di1nr5t1307m4yy7q7bf8xclhbp7bogh
OTHER_HARBOR_CLI=6n757ho8teukkz07ewta9t8570sovcbl
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_ADDRESS=menzel.informatik.rwth-aachen.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988`
    expect(c.getHarborUsernameAndPassword()).toEqual({
        "password": undefined,
        "username": undefined
    })
})

test('Test updateHarborPassword', () => {
    c = configurationManager
    c.envconfiguration = `STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_USER=aachenbeeck
HARBOR_PASSWORD=oldpassword
HARBOR_CLI=di1nr5t1307m4yy7q7bf8xclhbp7bogh
OTHER_HARBOR_CLI=6n757ho8teukkz07ewta9t8570sovcbl
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_ADDRESS=menzel.informatik.rwth-aachen.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988`
    let {username, password} = c.getHarborUsernameAndPassword()
    expect(password).toEqual("oldpassword")
    c.updateHarborPassword('newpassword')
    password = c.getHarborUsernameAndPassword().password
    expect(password).toEqual("newpassword")
})


const valid_env = `
STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_USER=aachenbeeck
HARBOR_PASSWORD=oldpassword
HARBOR_CLI=di1nr5t1307m4yy7q7bf8xclhbp7bogh
OTHER_HARBOR_CLI=6n757ho8teukkz07ewta9t8570sovcbl
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_ADDRESS=menzel.informatik.rwth-aachen.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988
`

const not_valid_env = `
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988
`

test('Test getstation_iri configured', () => {
    c = configurationManager
    c.envconfiguration = `STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_USER=aachenbeeck
HARBOR_PASSWORD=oldpassword
HARBOR_CLI=di1nr5t1307m4yy7q7bf8xclhbp7bogh
OTHER_HARBOR_CLI=6n757ho8teukkz07ewta9t8570sovcbl
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_ADDRESS=menzel.informatik.rwth-aachen.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault4
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988
STATION_IRI=http://example.org`
    expect(c.get_station_iri()).toEqual("http://example.org")
})

test('Test getstation_iri not configured', () => {
    c = configurationManager
    c.envconfiguration = `STATION_ID=aachenbeeck
MONGO_HOST=pht-mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=pht
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
HARBOR_ADDRESS=menzel.informatik.rwth-aachen.de
HARBOR_PORT=3007
HARBOR_USER=aachenbeeck
HARBOR_PASSWORD=oldpassword
HARBOR_CLI=di1nr5t1307m4yy7q7bf8xclhbp7bogh
OTHER_HARBOR_CLI=6n757ho8teukkz07ewta9t8570sovcbl
HARBOR_EMAIL=aachenbeeck@pht.de
CENTRALSERVICE_ADDRESS=menzel.informatik.rwth-aachen.de
CENTRALSERVICE_PORT=3005
AUTH_SERVER_ADDRESS=menzel.informatik.rwth-aachen.de
AUTH_SERVER_PORT=3006
JWT_SECRET=rwthi5-pht-jwt
SESSION_SECRET=rwthi5-pht-session
VAULT_HOST=pht-vault
VAULT_PORT=8200
METADATAPROVIDER_ENDPOINT=http://metadataservice:9988`
    expect(c.get_station_iri()).toEqual("")
})

test('Test Sanity check, valid env', async () => {
    c = configurationManager
    c.envconfiguration = valid_env
    await expect(c.envconfigurationSanityCheck()).resolves
})

test('Test Sanity check, unvalid env', () => {
    c = configurationManager
    c.envconfiguration = not_valid_env
    return expect(c.envconfigurationSanityCheck()).rejects.toMatch("Key STATION_ID not valid in envfile")
})

test('configuration ends', () => {
    c = configurationManager
    const ce = configurationManager.configurationEnd()
    configurationManager.configurationDidEnd()
    return expect(ce).resolves.toEqual(true)
})