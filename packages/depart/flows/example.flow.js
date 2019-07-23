const { Map } = require('immutable')
const { wallet } = require('demo-keys')
const { forkDepart } = require('../src/shims')
const assert = require('chai').assert
const { Logger } = require('demo-utils')
const LOGGER = new Logger('example.flow')
const BN = require('bn.js')

describe('Flow example 1', () => {

  let dsState

  before(async () => {
    dsState = await forkDepart('DifferentSender', Map({
      departFileName: 'departDS.js'
    }))
  })

  it('some test', async () => {
    LOGGER.info('Deployer Account', wallet.accountsMap[dsState.get('deployerAddress')])
  })

  it('sends an amount', async () => {
    //LOGGER.info('dsState', dsState)
    assert(dsState.get('result'), `forked departure doesn't return a result.`)
    
    const outState = await (async (state) => {
      const { minedTx, deployed, deployerAddress } = state.toJS()
      const ds = await deployed( 'DifferentSender' )
      
      await minedTx( ds.send, [deployerAddress], {value: new BN(3334)} )
      const lastValue = (await ds.lastValue())['0']
      assert( lastValue.toNumber(), 3334, `Last value was ${lastValue.toNumber()}` )
     
      return Map({
        lastValue: lastValue
      })
    })(dsState)
   
  })

  after(async () => {
    // TODO flowDone()
  })

})
