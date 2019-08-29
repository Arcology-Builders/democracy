const { assert } = require('chai')
const { Map } = require('immutable')
const { isAccount } = require('demo-keys')
const { Logger } = require('demo-utils')
const LOGGER = new Logger('depart/deploy.spec')
const { deployerMixin, argListMixin, run } = require('..')

describe('Deployer mixin', () => {

  const ADDRESS  = '0x1D708d45195a83b10150a66D9DCEBd514Ea8ccfb'
  const PASSWORD = 'fba1a22146037a37be7b16034f3bebd07f62916336525ef7993bbd9faa0566a9'

  let result

  before(async () => {
    const md = deployerMixin()
    const ma = argListMixin(Map({
      deployerAddress  : ADDRESS,
      deployerPassword : PASSWORD,
      unlockSeconds    : 5,
    }))
    result = await run( async (state) => {}, [ ma, md ] ) 
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
