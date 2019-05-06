const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))

const utils = require('ethereumjs-utils')
const keys = require('../src/keys')
const wallet = require('../src/wallet')
const randombytes = require('randombytes')
const { getImmutableKey, setImmutableKey, fromJS, Logger, deepEqual, getNetwork,
  toJS, immEqual } = require('demo-utils')
const LOGGER = new Logger('local.spec')

const { Map } = require('immutable')

describe('Local wallet store for accounts', () => {
 
  let account
  let address

  before(() => {
    account = keys.create()
    address = account.get('addressPrefixed')
  })

  it( 'retrieving a key before init fails', async () => {
    expect( wallet.loadEncryptedAccount(account.get('addressPrefixed')) )
      .to.be.rejectedWith(Error)
  })

  it( 'retrieving non-existent key before saving fails', async () => {
    await wallet.init({ autoConfig: false })
    expect( wallet.loadEncryptedAccount(account.get('addressPrefixed')) )
      .to.be.rejectedWith(Error)
  })

  it( 'inputter and outputter are local', async () => {
    assert.equal( wallet.inputter, getImmutableKey, `Inputter is not getImmutableKey` )
    assert.equal( wallet.outputter, setImmutableKey, `Outputter is not setImmutableKey` )
  })

  it( 'retrieving gets back the same key saved', async () => {
    const password = randombytes(32).toString('hex')
    await wallet.saveEncryptedAccount( address,
                                       keys.accountToEncryptedJSON(account, password) )
    LOGGER.debug( 'Encrypted account', wallet.accountsMap[address] )
    const encryptedAccount2 = await wallet.loadEncryptedAccount( address, password )
    const account2 = keys.encryptedJSONToAccount( toJS(encryptedAccount2), password )
    assert( immEqual(account2, account), `Different account retrieved ${account2.toJS()}`)
  })

  after(() => {
    setImmutableKey('keys', null)
  })

})

