#!/usr/bin/env node
'use strict'
const { Logger, fromJS, toJS, getNetwork, getConfig } = require('demo-utils')
const { Linker } = require('demo-contract')
const LOGGER = new Logger('link.bin')

const main = async({contractName, linkId}) => {
  const eth = getNetwork()
  const chainId = await eth.net_version()
  const l = new Linker({
    chainId        : chainId,
  })
  const bm         = l.getBuildsManager()
  const contracts  = await bm.getContracts()
  LOGGER.info("Compiles", contracts)
  const result = await l.link(contractName, linkId)
  LOGGER.info(result)
}

if (require.main === module) {
  LOGGER.info(process.argv)
  main({
    contractName : process.argv[2],
    linkId       : process.argv[3],
  })
  .then(() => console.log("Link complete"))
  .catch((e) => {
    LOGGER.error(JSON.stringify(e, Object.getOwnPropertyNames(e)))
    process.exit(1)
  })
}
