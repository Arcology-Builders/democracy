#!/usr/bin/env node
'use strict'
const { getNetwork, Logger, fromJS, toJS } = require('demo-utils')
const { RemoteDB } = require('demo-rest')
const { Compiler } = require('demo-compile')
const { createBM } = require('demo-contract')
const LOGGER = new Logger('compile.bin')

const eth = getNetwork()

const main = async(sourceFile, hostname, port) => {
  const chainId = await eth.net_version()
  let bm
  if (hostname && port) {
    bm = await createBM({
      sourcePath : 'contracts',
      hostname   : hostname,
      port       : port,
      chainId    : chainId,
    }) 
  }
  const c = new Compiler({
    startSourcePath: 'contracts',
    bm             : bm,
  })
  const result = await c.compile(sourceFile)
  LOGGER.info(result)
}

if (require.main === module) {
  LOGGER.info(process.argv)
  main(...process.argv.slice(2,5)).then(() => console.log("Compile complete"))
}
