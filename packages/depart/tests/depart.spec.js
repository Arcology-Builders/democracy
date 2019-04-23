'use strict'
const utils = require('demo-utils')
utils.setFS(require('fs'))
utils.setPath(require('path'))

const { Map } = require('immutable')
const assert = require('chai').assert

const { depart } = require('..')

describe( 'Departures', () => {
  
  let eth = utils.getNetwork()
  let accounts
 
  before(async () => {
   accounts = await eth.accounts()
  })

  it( 'executing a simple departure', async () => {
    await depart({
      name: "simple-departure",
      cleanAfter: true,
      address: accounts[1],
      sourcePath: "../../node_modules/demo-test-contracts/contracts",
      callback: async (compile, link, deploy, c, l, d) => {
        await compile( 'DifferentSender', 'DifferentSender.sol' )
        await link( 'DifferentSender', 'link' )
        await deploy( 'DifferentSender', 'link', 'deploy', new Map({}), true )
      }
    })
  })

})
