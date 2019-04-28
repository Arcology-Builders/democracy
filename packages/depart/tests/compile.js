'use strict'
const fs    = require('fs')
const path  = require('path')
const utils = require('demo-utils')

const { DB_DIR, COMPILES_DIR, LINKS_DIR, DEPLOYS_DIR } = utils
const { isCompile, isLink, isDeploy } = require('demo-contract')
const { Map } = require('immutable')
const assert = require('chai').assert

const { RESTServer } = require('demo-rest')
const { depart } = require('..')

const main = async() => {
  let eth = utils.getNetwork()
  let chainId
  let accounts
  let cleaner
  const s = new RESTServer(6969, true)

   accounts = await eth.accounts()
   chainId = await eth.net_version()
   s.start()

    const result = await depart({
      name: "simple-departure",
      address: accounts[1],
      sourcePath: "../../node_modules/demo-test-contracts/contracts",
      bmHostName: "localhost",
      bmPort: 6969,
      callback: async ({compile, link, deploy, bm}) => {
        const cout = await compile( 'DifferentSender', 'DifferentSender.sol' )
        isCompile(cout)
        const lout = await link( 'DifferentSender', 'link' )
        isLink(lout)
        const dout = await deploy( 'DifferentSender', 'link', 'deploy', new Map({}), true )
        isDeploy(dout)
        return true
      }
    })
}

main().then((val) => { console.log(val) })
