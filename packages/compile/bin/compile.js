#!/usr/bin/env node
'use strict'
const { Logger, fromJS, toJS } = require('demo-utils')
const { RemoteDB } = require('demo-rest')
const { Compiler } = require('demo-compile')
const LOGGER = new Logger('compile.bin')

const main = async(sourceFile, hostname, port) => {
  let inputter
  let outputter
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
  const c = new Compiler({
    startSourcePath: 'contracts',
    inputter       : inputter,
    outputter      : outputter
  })
  const result = await c.compile(sourceFile)
  LOGGER.info(result)
}

if (require.main === module) {
  LOGGER.info(process.argv)
  main(...process.argv.slice(2,5)).then(() => console.log("Compile complete"))
}
