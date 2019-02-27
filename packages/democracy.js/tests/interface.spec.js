const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'))
const assert = chai.assert

describe('Deploying contract using interface.', () => {
  
  const eth = demo.getNetwork('test')
  const departure = require('../departures/interface')
  let deploys
  let links
  let compiles

  before( async () => {
    const { deploys: _deploys, links: _links, compiles: _compiles } =
      await departure.depart()
    deploys  = _deploys
    links    = _links
    compiles = _compiles
  })

  it("should contain the expected compiles, links, deploys", (done) => {
    assert(deploys.get('TestImpl-deploy'))
    assert(deploys.get('TestUseInterface-deploy'))
    assert(links.get('TestImpl-link'))
    assert(links.get('TestUseInterface-link'))
    assert(compiles.get('TestImpl'))
    done()
  })

  it("should find a compiled interface that does not have its own source file", (done) => {
    const contracts = demo.getContracts()
    assert(contracts['contractSources'].indexOf('TestInterface') !== -1)
    assert(contracts['contractSources'].indexOf('TestUseInterface') !== -1)
    assert(contracts['contractOutputs'].get('TestUseInterface'))
    assert(contracts['contractOutputs'].get('TestImpl'))
    assert(contracts['contractOutputs'].get('TestInterface'))
    done()
  })

  it("should call an interface method successfully ", async () => {
    const instance = demo.getInstance(eth, deploys.get('TestUseInterface-deploy'))
    const result = await instance.callInterface(123)
    assert(result)
  })

  after( async () => {
    await departure.clean()
  })


})
