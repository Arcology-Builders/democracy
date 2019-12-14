const { assert } = require('chai')
const { Map } = require('immutable')
const { isAccount } = require('demo-keys')
const { Logger } = require('demo-utils')
const { TYPES } = require('demo-transform')
const LOGGER = new Logger('depart/deploy.spec')
const { deployerTransform, createArgListTransform, runTransforms } = require('demo-transform')

describe('Deployer mixin', () => {

  const ADDRESS  = '0x1D708d45195a83b10150a66D9DCEBd514Ea8ccfb'
  const PASSWORD = 'fba1a22146037a37be7b16034f3bebd07f62916336525ef7993bbd9faa0566a9'

  let result

  before(async () => {
    const md = deployerTransform
    const ma = await createArgListTransform(Map({
      deployerAddress  : TYPES.ethereumAddress,
      deployerPassword : TYPES.string,
      unlockSeconds    : TYPES.integer,
      testAccountIndex : TYPES.integer,
      testValueETH     : TYPES.string,
    }))
    result = await runTransforms(
      [ ma, md ],
      Map({
				deployerAddress  : ADDRESS,
				deployerPassword : PASSWORD,
				unlockSeconds    : 5,
        testAccountIndex : 0,
        testValueETH     : '0.01',
      })
		) 
  })
  
  it('takes in deployerAddress/Password from state', async () => {
    assert.equal( result.get('deployerAddress'), ADDRESS,
                 `Deployer address ${result.get('deployerAddress')} not set.`)
    assert.equal( result.get('deployerPassword'), PASSWORD,
                 `Deployer password ${result.get('deployerPassword')} not set.`)
  })

  it('valid account unlocked after preparing', async () => {
    const { wallet } = result.toJS()
    LOGGER.debug('accountsMap', wallet.getAccountSync(ADDRESS, true))
    assert( isAccount(wallet.getAccountSync(ADDRESS)), `Invalid account for ${ADDRESS}` )
  })

})
