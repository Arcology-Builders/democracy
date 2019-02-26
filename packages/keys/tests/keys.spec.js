const assert = require('chai').assert
const utils = require('ethereumjs-utils')
const keys = require('../src/keys')

describe('Self-generated keys and signing', () => {
 
  let account

  before(() => {
    account = keys.create()
  })
  
  it('generates a valid key randomly from scratch', async () => {
    assert(utils.isValidAddress(account.get('addressPrefixed')))
    assert.equal(40 , account.get('addressString'     ).length)
    assert.equal(42 , account.get('addressPrefixed'   ).length)
    assert.equal(64 , account.get('privateKeyString'  ).length)
    assert.equal(66, account.get('privateKeyPrefixed').length)
    assert.equal(128, account.get('publicKeyString'   ).length)
    assert.equal(130, account.get('publicKeyPrefixed' ).length)
    const address = utils.publicToAddress(account.get('publicKeyPrefixed')).toString('hex')
    assert.equal(address, account.get('addressString'))
  })

})

