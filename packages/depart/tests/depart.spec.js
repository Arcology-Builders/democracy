'use strict'
const utils = require('@democracy.js/utils')
utils.setFS(require('fs'))
utils.setPath(require('path'))

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
      sourcePath: "node_modules/@democracy.js/test-contracts/contracts",
      callback: async (compile, link, deploy) => {
        await compile( 'DifferentSender', 'DifferentSender.sol' )
        await link( 'DifferentSender', 'link' )
        await deploy( 'DifferentSender', 'link', 'deploy' )
      }
    })
  })

})