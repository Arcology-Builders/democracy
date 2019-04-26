const assert = require('chai').assert
const BN     = require('bn.js')
const { Map, List }
             = require('immutable')
const demo   = require('..')

describe('Democracy multi-contract departure ', () => {

  let networkId
  let eth
  let links
  let deploys
  let accounts
  let instance
  const departure = require('../departures/multiLib')

  before(async () => {
    const { links: _links, deploys: _deploys } = await departure.depart()
    links     = _links
    deploys   = _deploys
    eth       = demo.getNetwork('test')
    networkId = await eth.net_version()
    accounts  = await demo.getAccounts(eth)
    instance = demo.getInstance(eth, deploys.get('TestUseLibrary2-deploy'))
  })

  it('expected links', async () => {
    assert(demo.isLink( links.get('TestLibrary-link'))     )
    assert(demo.isLink( links.get('TestLibrary2-link'))    )
    assert(demo.isLink( links.get('TestUseLibrary2-link')) )
  })
  
  it('expected deploys', async () => {
    assert(demo.isDeploy( deploys.get('TestLibrary-deploy'))     )
    assert(demo.isDeploy( deploys.get('TestLibrary2-deploy'))    )
    assert(demo.isDeploy( deploys.get('TestUseLibrary2-deploy')) )
  })
  
  it('library function `double` is called', async() => {
    await instance.double(444, {from: accounts[0], gas: 300000})
    const valDef = await instance.getValue()
    assert.ok(new BN(888).eq(new BN(valDef['0'])),
              `Value ${JSON.stringify(valDef)} not doubled to 888`)
  })

  it('library function `triple` is called', async() => {
    await instance.triple(111, {from: accounts[0], gas: 300000})
    const valDef = await instance.getValue()
    assert.ok(new BN(333).eq(valDef['0']),
              `Value ${JSON.stringify(valDef)} not tripled to 333`)
  })

  it('library function `hextuple` is called', async() => {
    await instance.hextuple(1001, {from: accounts[0], gas: 300000})
    const valDef = await instance.getValue()
    assert.ok(new BN(6006).eq(valDef['0']),
              `Value ${JSON.stringify(valDef)} not hextupled to 6006`)
  })

  after(async () => {
    await departure.clean()
  })

})
