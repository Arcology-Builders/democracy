require('module-alias/register')
const demo = require('@root')
const { print, getInstance } = require('@democracy.js/utils')

const BN = require('bn.js')
const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const should = chai.should(); 
const Eth = require('ethjs')

const config = require('config')

describe('Getting and setting vars.', () => {

  let eth
  let networkId
  let instance
  let accounts

  before(async () => {
      eth = demo.getNetwork('test')
      networkId = await eth.net_version()
      accounts = await demo.getAccounts(eth)
      demo.cleanDeploySync(networkId, 'GetSet-deploy')
      demo.cleanLinkSync(networkId, 'GetSet-link')
      demo.cleanCompileSync('GetSet')
      await demo.compile('contracts', 'GetSet.sol')
      const link  = await demo.link('GetSet', 'test', 'account0', 'link')
      const deploy = await demo.deploy('GetSet', 'test', 'link', 'deploy', '')
      instance = getInstance(eth, deploy)
  })

  it("should get a default value.", async () => {
    const valA = await instance.getA() 
    assert.equal(valA['0'], '0')
  })

  it("should get the set value.", async () => {
    const a = await instance.setA(111, {from: accounts[0], gas: 300000})
    const valB = await instance.getA()
    assert.ok(new BN(111).eq(valB['0']))
    assert.notOk(new BN(123).eq(valB['0']))
  })

  it("should get a different set value.", async () => {
    const a = await instance.setA(245, {from: accounts[0], gas: 300000})
    const valB = await instance.getA()
    assert.ok(new BN(245).eq(valB['0']))
  })

  after( async() => {
    demo.cleanDeploySync(networkId, 'GetSet-deploy')
    demo.cleanLinkSync(networkId, 'GetSet-link')
    demo.cleanCompileSync('GetSet')
  })


})
