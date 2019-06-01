const { Compiler } = require('..')
const { Logger } = require('demo-utils')
const LOGGER = new Logger('compiler/scripts')

const c = new Compiler({sourcePathList: ['../test-contracts/contracts'] })

const sourceFile = process.argv[2]
LOGGER.info('Source File', sourceFile)

const main = async () => {
  await c.compile( sourceFile )
}

main().then(() => { console.log("That's all folks") })
