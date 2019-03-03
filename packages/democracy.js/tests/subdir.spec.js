const demo = require('..')

const chai = require('chai').use(require('chai-as-promised'))
const assert = chai.assert

describe('Using interface in a subdirectory', () => {
  
  const eth = demo.getNetwork('test')
  const departure = require('../departures/library-subdir')
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
    assert(deploys.get('TestLibrary3-deploy'))
    assert(deploys.get('TestUseLibrary3-deploy'))
    assert(links.get('TestLibrary3-link'))
    assert(links.get('TestUseLibrary3-link'))
    assert(compiles.get('TestLibrary3'))
    done()
  })

  it("should find a compiled interface that does not have its own source file", (done) => {
    const contracts = demo.getContracts()
    assert(contracts['contractSources'].indexOf('TestLibrary3') !== -1)
    assert(contracts['contractSources'].indexOf('TestUseLibrary3') !== -1)
    assert(contracts['contractOutputs'].get('TestUseLibrary3'))
    assert(contracts['contractOutputs'].get('TestLibrary3'))
    done()
  })

  it("should call an interface method successfully ", async () => {
    const instance = demo.getInstance(eth, deploys.get('TestUseLibrary3-deploy'))
    const result = await instance.callInterface(123)
    assert(result)
  })

  after( async () => {
    await departure.clean()
  })


})
