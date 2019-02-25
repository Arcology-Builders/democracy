const demo = require('..')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect
const should = chai.should()
chai.use(require('chai-as-promised'))

const { Map, List } = require('immutable')

describe('Democracy multi-contract departure ', () => {

  let networkId
  let eth
  let links
  let deploys
  const departure = require('../departures/multiLib')

  before(async () => {
    const { links: _links, deploys: _deploys } = await departure.depart()
    links = _links
    deploys = _deploys
    eth = demo.getNetwork('test')
    networkId = await eth.net_version()
  })

  it('expected links', async () => {
    assert(demo.isLink(links.get('TestLibrary-link')))
    assert(demo.isLink(links.get('TestLibrary2-link')))
    assert(demo.isLink(links.get('TestUseLibrary2-link')))
  })
  
  it('expected deploys', async () => {
    assert(demo.isDeploy(deploys.get('TestLibrary-deploy')))
    assert(demo.isDeploy(deploys.get('TestLibrary2-deploy')))
    assert(demo.isDeploy(deploys.get('TestUseLibrary2-deploy')))
  })

  after(async () => {
    await departure.clean()
  })

})
