const { List, Map } = require('immutable')
const assert = require('chai').assert
const utils = require('demo-utils')
const { toJS, fromJS, getConfig, getNetwork } = utils
const { BuildsManager, Linker, isLink, Deployer, isDeploy, isCompile, isContract, createBM }
  = require('demo-contract')
const { wallet } = require('demo-keys')
const { Compiler } = require('demo-compile')
const { RemoteDB } = require('demo-client')

const LOGGER = new utils.Logger('departure')

const departs = {}

departs.depart = async ({name, cleanAfter, sourcePath, autoConfig,
                         deployerEth, deployerAddress, deployerPassword, callback}) => {
  assert(callback, " `callback` param needed to run departure function.")

  LOGGER.info(`Now departing: ${name}`)
  LOGGER.info(`Deployer Address: ${deployerAddress}`)

  const _deployerAddress = (deployerAddress) ? deployerAddress : getConfig()['DEPLOYER_ADDRESS']
  const _deployerPassword = (deployerPassword) ? deployerPassword : getConfig()['DEPLOYER_PASSWORD']
  let _deployerEth
  if (deployerAddress && deployerPassword) {
    await wallet.init({ autoConfig: autoConfig })
    await wallet.loadEncryptedAccount({ address: deployerAddress })
    await wallet.unlockEncryptedAccount({ address: deployerAddress, password: deployerPassword })
  } else if (!deployerAddress && !deployerPassword) {
    _deployerEth = await wallet.createSpenderEth({
      autoInit: true,
      autoConfig: autoConfig,
      autoCreate: true,
      address: _deployerAddress,
      password: _deployerAddress,
    })
  }

  const eth = (deployerEth) ? deployerEth : (_deployerEth ? _deployerEth : getNetwork() )
  const chainId  = await eth.net_version()

  const bm = await createBM({
    sourcePath: sourcePath,
    chainId   : chainId,
    autoConfig: autoConfig,
  })

  const c = new Compiler({
    startSourcePath: sourcePath, bm: bm
  })
  const l = new Linker({
    bm: bm
  })
  const d = new Deployer({
    bm: bm, chainId: chainId,
    eth: eth, address: _deployerAddress
  })

  let compiles = new Map()
  const compile = async ( contractName, sourceFile ) => {
    assert(sourceFile && sourceFile.endsWith('.sol'),
           'sourceFile param not given or does not end with .sol extension')
    const output = await c.compile( sourceFile )
    assert(isCompile(output))
    assert.equal( output.get(contractName).get('name'), contractName )
    return new Promise((resolve, reject) => {
      setTimeout( async () => {
        const contract = await bm.getContract(contractName)
        assert( isContract(contract), `Contract ${contractName} not found` )
        compiles = compiles.set(contractName, output.get(contractName))
        resolve(output)
      }, 2000)
    })
  }

  let links = new Map()
  const link = async ( contractName, linkId, depMap ) => {
    assert(contractName, 'contractName param not given')
    assert(linkId, 'link name not given')
    const linkName = `${contractName}-${linkId}`
    let output = await bm.getLink( linkName )
    if (!isLink(output)) {
      output = await l.link( contractName, linkId, depMap )
    }
    assert(isLink(output))
    links = links.set(linkName, output)
    return output
  }

  let deploys = new Map()
  const deploy = async ( contractName, linkId, deployId, ctorArgList, force ) => {
    assert(contractName, 'contractName param not given')
    assert(linkId, 'linkId param not given')
    assert(deployId, 'deployId param not given')
    const deployName = `${contractName}-${deployId}`
    const output = await d.deploy( contractName, linkId, deployId, ctorArgList, force )
    assert( isDeploy(output) )
    deploys = deploys.set(deployName, output)
    return output
  }

  const clean = async () => {
    const compileList = List(compiles.map((c, name) => {
      return bm.cleanContract( name )
    }).values()).toJS()
    await Promise.all( compileList ).then((vals) => { LOGGER.info( 'Clean compiles', vals) })

    const linkList = List(links.map((l, name) => {
      return bm.cleanLink( name )
    }).values()).toJS()
    await Promise.all( linkList ).then((vals) => { LOGGER.info( 'Clean links', vals) })

    const deployList = List(deploys.map((d, name) => {
      return bm.cleanDeploy( name )
    }).values()).toJS()
    await Promise.all( deployList ).then((vals) => { LOGGER.info( 'Clean deploys', vals) })
  }

  const result = await callback({ compile: compile, link: link, deploy: deploy, bm: bm })
  
  return {
    name    : name,
    cleaner : clean,
    deploys : deploys,
    links   : links,
    compiles: compiles,
    bm      : bm,
    result  : result,
  }

}

module.exports = departs

if (require.main === module) {
  LOGGER.info(`Reading departure from ${process.argv[2]}`)
  const departure = require(process.argv[2])
  if (process.env['NODE_ENV'] !== 'MAINNET') {
    eval(departure)
    console.log("Departure complete.")
  }
}
