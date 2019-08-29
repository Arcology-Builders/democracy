const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
chai.use(require('chai-as-promised'))

const keys = require('../src/keys')
const wallet = require('../src/wallet')
const randombytes = require('randombytes')
const { getImmutableKey, setImmutableKey, Logger,
  toJS, deepEqual } = require('demo-utils')
const LOGGER = new Logger('local.spec')

const common = {}

common.getDescribe = (asyncInitProm) => {
  return () => {
   
    let account
    let address

    before(async () => {
      if (!asyncInitProm) {
        // Local key store
        await wallet.init({ autoConfig: false, unlockSeconds: 1 })
      }

      account = keys.create()
      address = account.get('addressPrefixed')
      if (asyncInitProm) {
        await asyncInitProm
      }
    })

    it( 'retrieving non-existent key before saving fails', async () => {
      if (asyncInitProm) {
        expect( wallet.loadEncryptedAccount({ address: account.get('addressPrefixed') }) )
          .to.be.rejectedWith(Error)
      }
    })

    it( 'inputter and outputter are local', async () => {
      if (!asyncInitProm) {
        assert.equal( wallet.inputter, getImmutableKey, 'Inputter is not getImmutableKey' )
        assert.equal( wallet.outputter, setImmutableKey, 'Outputter is not setImmutableKey' )
      }
    })

    it( 'retrieving gets back the same key saved', async () => {
      const password = randombytes(32).toString('hex')
      const encryptedJSON = keys.accountToEncryptedJSON({ account: account, password: password })
      await wallet.saveEncryptedAccount({
        address: address, encryptedAccount: encryptedJSON })
      LOGGER.debug( 'Encrypted account', wallet.getAccountSync(address) )
      const encryptedAccount2 = await wallet.loadEncryptedAccount({ address: address })
      const account2 = keys.encryptedJSONToAccount({
        encryptedJSON: toJS(encryptedAccount2), password: password })
      assert( deepEqual(account2.toJS(), account.toJS()),
        `Different account retrieved ${account2.toJS()}` )
    })

    after(() => {
      setImmutableKey('keys', null)
    })

  }
}

module.exports = common
