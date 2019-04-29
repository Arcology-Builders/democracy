#!/usr/bin/env node
'use strict'
const { Logger, fromJS, toJS, getNetwork, getConfig } = require('demo-utils')
const { RemoteDB } = require('demo-rest')
const { Linker } = require('demo-contract')
const LOGGER = new Logger('link.bin')

//const dbURL = getConfig()['DB_URL'].split('://')[1]
//const dbURLParts = dbURL.split(':')

const main = async({contractName, linkId, hostname, port}) => {
  let inputter
  let outputter
  const eth = getNetwork()
  const chainId = await eth.net_version()
  if (hostname && port) {
    const r = new RemoteDB(hostname, port)
    inputter = async (key, def) => {
      return r.getHTTP(`/api/${key}`, def).then((val) => {
        const mapVal = fromJS(JSON.parse(val))
        return mapVal
      }) }
    //  .then((val) => {return fromJS(val)} ) }
    outputter = async (key, val, ow) => {
      LOGGER.info('Outputting ', key, val, ow)
      if (!val) { throw Error(`No cleaning of remote build ${val} allowed.`) }
      return r.postHTTP(`/api/${key}`, toJS(val), ow) }
  }
  const l = new Linker({
    chainId        : chainId,
    inputter       : inputter,
    outputter      : outputter
  })
  const bm = l.getBuildsManager()
  const contracts = await bm.getContracts()
  const contracts2 = await inputter('compiles', {})
  LOGGER.info("Compiles", contracts, contracts2)
  const result = await l.link(contractName, linkId)
  LOGGER.info(result)
}

if (require.main === module) {
  LOGGER.info(process.argv)
  main({
    contractName: process.argv[2],
    linkId: process.argv[3],
    hostname: process.argv[4],
    port: process.argv[5],
  }).then(() => console.log("Link complete"))
}
