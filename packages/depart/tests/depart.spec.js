'use strict'
const fs    = require('fs')
const path  = require('path')
const utils = require('demo-utils')
utils.setFS(fs)
utils.setPath(path)

const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR } = utils
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
      callback: async (compile, link, deploy) => {
        await compile( 'DifferentSender', 'DifferentSender.sol' )
        await link( 'DifferentSender', 'link' )
        await deploy( 'DifferentSender', 'link', 'deploy', new Map({}), true )
      }
    })
  })

  it( 'cleaning happens', async () => {
    assert.notOk(fs.existsSync(path.join(DB_DIR, COMPILES_DIR, 'DifferentSender.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, LINKS_DIR, 'DifferentSender-link.json')))
    assert.notOk(fs.existsSync(path.join(DB_DIR, DEPLOYS_DIR, 'DifferentSender-deploy.json')))
  })

})
