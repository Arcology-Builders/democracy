#!/usr/bin/env node
const { List, Map } = require('immutable')
const assert = require('chai').assert
const utils = require('demo-utils')
const { toJS, fromJS } = utils
const { BuildsManager, Linker, isLink, Deployer, isDeploy, isCompile, isContract }
  = require('demo-contract')
const { Compiler } = require('demo-compile')
const { RemoteDB } = require('demo-rest')

const LOGGER = new utils.Logger('departure')

const departs = {}

departs.depart = async ({name, cleanAfter, address, sourcePath, bmHostName, bmPort,
                        callback}) => {
  assert(address, " `address` param needed to deploy from.")
  assert(callback, " `callback` param needed to run departure function.")

  LOGGER.info(`Now departing: ${name}`)

  const eth      = utils.getNetwork()
  const accounts = await eth.accounts()
  const chainId  = await eth.net_version()
  let inputter   = null
  let outputter  = null

  if (bmHostName && bmPort) {
    const r = new RemoteDB(bmHostName, bmPort)
    inputter = async (key, def) => { return fromJS(JSON.parse(await r.getHTTP(`/api/${key}`, def))) }
    outputter = async (key, val, ow) => { return r.postHTTP(`/api/${key}`, toJS(val), ow) }
  }

  const bm = new BuildsManager({
      startSourcePath: sourcePath,
      chainId: chainId,
      inputter: inputter,
      outputter: outputter,
    })
  const c = new Compiler({
    startSourcePath: sourcePath, inputter: inputter, outputter: outputter
  })
  const cm = c.getContractsManager()
  const l = new Linker({
    bm: bm, inputter: inputter, outputter: outputter
  })
  const d = new Deployer({
    bm: bm, inputter: inputter, outputter: outputter, chainId: chainId,
    eth: eth, address: address
  })

  let compiles = new Map()
  const compile = async ( contractName, sourceFile ) => {
    assert(sourceFile && sourceFile.endsWith('.sol'),
           'sourceFile param not given or does not end with .sol extension')
    const output = await c.compile( sourceFile )
    assert(isCompile(output))
    assert.equal( output.get(contractName).get('name'), contractName )
    const contract = await cm.getContract(contractName)
    assert(isContract(contract), `Contract ${contractName} not found`)
    compiles = compiles.set(contractName, output.get(contractName))
    return output
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
      return cm.cleanContract( name )
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
