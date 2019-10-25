const { List, Map } = require('immutable')
const assert = require('chai').assert
const utils = require('demo-utils')
const { toJS, fromJS, getConfig, getNetwork } = utils
const { BuildsManager, Linker, isLink, Deployer, isDeploy, isCompile, isContract,
  createBM, Contract }
  = require('demo-contract')
const { Compiler } = require('demo-compile')
const { RemoteDB } = require('demo-client')
const { DEMO_TYPES: TYPES, createTransformFromMap } = require('demo-transform')

const LOGGER = new utils.Logger('departure')

const departs = {}

/**
 * Orchestrate a reproducible, idempotent departure of smart contracts for the blockchain,
 * storing artifacts for later web interfaces.
 * The following runtime state variables are required or optional.
 *
 * Required
 * * chainId {String}
 * * deployerEth signer eth
 * * deployerAddress Ethereum address
 *
 * Optional
 * * departName {String}
 * * sourcePathList {Array}
 * * autoConfig {Boolean}
 *
 * @method depart
 * @memberof @module:depart
 */
departs.departTransform = createTransformFromMap({
  func: async ({ chainId, deployerEth, deployerAddress, departName, autoConfig,
      sourcePathList, compileFlatten, compileOutputFull }) => {
    assert( chainId, `chainId not in input state.` )
    assert( deployerEth, `deployerEth not in input state.` )
    assert( deployerAddress, `deployerAddress not in input state.` )

    const bm = await createBM({
      sourcePathList: sourcePathList,
      chainId,
      autoConfig: !(autoConfig === false),
    })

    const c = new Compiler({
      sourcePathList : sourcePathList,
      bm             : bm,
      flatten        : compileFlatten,
      outputFull     : compileOutputFull,
    })
    const l = new Linker({
      bm: bm
    })
    const d = new Deployer({
      bm, chainId,
      eth: deployerEth, address: deployerAddress,
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

    let links    = new Map()
    const link = async ( contractName, linkId, depMap ) => {
      assert(contractName, 'contractName param not given')
      assert(linkId, 'link name not given')
      const linkName = `${contractName}-${linkId}`
      const output = await l.link( contractName, linkId, depMap )
      assert(isLink(output))
      links = links.set(linkName, output)
      return output
    }

    let deploys  = new Map()
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

    const deployed = async (contractName, opts = {}) => {
      const { ctorArgList, deployID, force, abi } = opts
      await compile( contractName, `${contractName}.sol` )
      await link( contractName, 'link' )
      const _deployID = (deployID) ? deployID : 'deploy'
      const deployedContract =
        await deploy( contractName, 'link', _deployID, ctorArgList, force )
      const replacedContract = (abi) ?
        deployedContract.set( 'abi', fromJS(abi) ) : deployedContract 
      const contract = new Contract({ deployerEth: deployerEth, deploy: replacedContract })
      return await contract.getInstance()
    }

    const minedTx = async ( method, argList, options ) => {
      /*
      return contract.getTxReceipt({
        method: method,
        args: argList,
        options: options || {from: deployerAddress},
      })
     */
      const _options = Map({ from: deployerAddress, gas: getConfig()['GAS_LIMIT'] })
        .merge(options).toJS()
      return await deployerEth.getTransactionReceipt( await method(...argList, _options) )
    }

    const getCompiles = () => {
      return compiles
    }

    const getLinks = () => {
      return links
    }

    const getDeploys = () => {
      return deploys
    }

    const clean = async () => {
      const compileList = List(compiles.map((c, name) => {
        return bm.cleanContract( name )
      }).values()).toJS()
      await Promise.all( compileList ).then((vals) => { LOGGER.debug( 'Clean compiles', vals) })

      const linkList = List(links.map((l, name) => {
        return bm.cleanLink( name )
      }).values()).toJS()
      await Promise.all( linkList ).then((vals) => { LOGGER.debug( 'Clean links', vals) })

      const deployList = List(deploys.map((d, name) => {
        return bm.cleanDeploy( name )
      }).values()).toJS()
      await Promise.all( deployList ).then((vals) => { LOGGER.debug( 'Clean deploys', vals) })
    }

    return new Map({
      departName  : departName ,
      clean       : clean      ,
      deploy      : deploy     ,
      deployed    : deployed   ,
      minedTx     : minedTx    ,
      link        : link       ,
      compile     : compile    ,
      bm          : bm         ,
      getCompiles,
      getLinks   ,
      getDeploys ,
    })

  },
  inputTypes: Map({
    chainId           : TYPES.string         ,
    deployerEth       : TYPES.ethereumSigner ,
    deployerAddress   : TYPES.ethereumAddress,
    departName        : TYPES.string.opt     ,
    autoConfig        : TYPES.boolean.opt    ,
    sourcePathList    : TYPES.array          ,
    compileFlatten    : TYPES.boolean.opt    ,
    compileOutputFull : TYPES.boolean.opt    ,
  }),
  outputTypes: Map({
    clean       : TYPES['function']   ,
    deploy      : TYPES['function']   ,
    deployed    : TYPES['function']   ,
    minedTx     : TYPES['function']   ,
    link        : TYPES['function']   ,
    compile     : TYPES['function']   ,
    bm          : TYPES.bm            ,
    getCompiles    : TYPES['function'],
    getLinks       : TYPES['function'],
    getDeploys     : TYPES['function'],
  })
})

module.exports = departs
