#!/usr/bin/env node
const { Logger } = require('demo-utils')
const { Compiler } = require('demo-compile')
const LOGGER = new Logger('compile.bin')

const c = new Compiler({startSourcePath: 'contracts'})

const main = async(sourceFile) => {
  const result = await c.compile(sourceFile)
  LOGGER.info(result)
}

if (require.main === module) {
  main(process.argv[2]).then(() => console.log("Compile complete"))
}
