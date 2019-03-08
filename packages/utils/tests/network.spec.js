const { List, Map } 
             = require('immutable')
const chai   = require('chai')
const assert = chai.assert
const { getNetwork, getEndpointURL }
             = require('..')
const Logger = require('../src/logger')

describe('network and tx sending', () => {

  let eth

  before(() => {
    eth = getNetwork('test')
  })

  it('endpoint URL works', () => {
    process.env['NODE_ENV'] = 'DEVELOPMENT'
    assert.equal('http://localhost:8545', getEndpointURL())
  })

  it('network exists for test chains', async () => {
    const chain = await eth.net_version()
    assert(Number(chain) < Date.now())
  })

  it('network exists for rinkeby', async () => {
    process.env['NODE_ENV'] = 'RINKEBY'
    const chain = await getNetwork().net_version()
    assert.equal(4, Number(chain), `Rinkeby chain ID was ${chain}`)
  })

  it('network exists for mainnet', async () => {
    process.env['NODE_ENV'] = 'MAINNET'
    const chain = await getNetwork().net_version()
    assert.equal(1, Number(chain), `Mainnet chain ID was ${chain}`)
  })

})
