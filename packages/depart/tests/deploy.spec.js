const { assert } = require('chai')
const { Map } = require('immutable')
const { deployerMixin, argListMixin, run } = require('..')

describe('Deployer mixin', () => {

  const ADDRESS  = '0x1D708d45195a83b10150a66D9DCEBd514Ea8ccfb'
  const PASSWORD = 'fba1a22146037a37be7b16034f3bebd07f62916336525ef7993bbd9faa0566a9'
  
  it('takes in deployerAddress/Password from state', async () => {
    const md = deployerMixin()
    const ma = argListMixin(Map({
      deployerAddress  : ADDRESS,
      deployerPassword : PASSWORD,
      unlockSeconds    : 3,
    }))
    const result = await run( async (state) => {}, [ ma, md ] ) 
    assert.equal( result.get('deployerAddress'), ADDRESS,
                 `Deployer address ${result.get('deployerAddress')} not set.`)
    assert.equal( result.get('deployerPassword'), PASSWORD,
                 `Deployer password ${result.get('deployerPassword')} not set.`)
  })

})
