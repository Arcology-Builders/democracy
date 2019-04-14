const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))

const utils = require('ethereumjs-utils')
const keys = require('../src/keys')
const randombytes = require('randombytes')
const { getImmutableKey, setImmutableKey, fromJS, Logger, deepEqual }
  = require('@democracy.js/utils')
const LOGGER = new Logger('keys.spec')

const { Map } = require('immutable')

describe('Self-generated keys and signing', () => {
 
  let account

  before(() => {
    account = keys.create()
  })
 
  it('randomly created account is valid', async () => {
    keys.isAccount(account)
  })

  it('generates a valid key randomly from scratch', async () => {
    assert(utils.isValidAddress(account.get('addressPrefixed')))
    assert.equal(40 , account.get('addressString'  ).length)
    assert.equal(42 , account.get('addressPrefixed').length)
    assert.equal(64 , account.get('privateString'  ).length)
    assert.equal(66 , account.get('privatePrefixed').length)
    assert.equal(128, account.get('publicString'   ).length)
    assert.equal(130, account.get('publicPrefixed' ).length)
    assert.equal(32 , account.get('ivString'       ).length)
    assert.equal(64 , account.get('saltString'     ).length)
    const address = utils.publicToAddress(account.get('publicPrefixed')).toString('hex')
    assert.equal(address, account.get('addressString'))
  })

  it( 'dumps a password and recovers it', async () => {
    const password = randombytes(32).toString('hex')
    const password2 = randombytes(32).toString('hex')
    const encryptedJSON = keys.accountToEncryptedJSON(account, password)
    setImmutableKey('keys', fromJS(encryptedJSON))
    const retrieved = getImmutableKey('keys', new Map({}))
    const recovered = keys.encryptedJSONToAccount(retrieved.toJS(), password)
    assert.equal(recovered.get('privateString'), account.get('privateString'))
    let recovered2
    try {
      recovered2 = keys.encryptedJSONToAccount(retrieved.toJS(), password2)
      assert.fail()
    } catch(e) {
    }
  })

  it('generates a valid wallet from private key', async () => {
    const account = keys.createFromPrivateString(
      '4DBE88D79BCACD8C3EE962213A58C67BAD17660AF2CF66F9891CE74CC6FCAC34')
    keys.isAccount(account)
    const account2 = keys.createFromPrivateString(randombytes(32).toString('hex'))
    keys.isAccount(account2)
  })

  after(() => {
    setImmutableKey('keys', null)
  })

})

