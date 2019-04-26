require('module-alias/register')
const demo = require('@root')
const { print, getInstance } = require('@democracy.js/utils')

const BN = require('bn.js')
const chai = require('chai').use(require('chai-as-promised'));
const assert = chai.assert
const should = chai.should(); 
const Eth = require('ethjs')

describe('Getting accounts and balances.', () => {

  let eth
  let networkId
  let accounts

  before(async () => {
      eth = demo.getNetwork()
      networkId = await eth.net_version()
      accounts = await demo.getAccounts(eth)
  })

  it("return ten accounts.", async () => {
    assert.equal(accounts.length, 10)
    assert.typeOf(accounts[0], "string")
  })

})
