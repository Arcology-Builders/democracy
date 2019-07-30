const { List, Map } = require('immutable')
const assert = require('chai').assert
const utils = require('demo-utils')
const { toJS, fromJS, getConfig, getNetwork } = utils
const { BuildsManager, Linker, isLink, Deployer, isDeploy, isCompile, isContract,
  createBM, Contract }
  = require('demo-contract')
const { RemoteDB } = require('demo-client')

const LOGGER = new utils.Logger('depart/departure')

const departs = {}

departs.createEmptyCompiler = (state) => {
  const{
    contractOutputs
  } = state.toJS()

  class Compiler {
    constructor() { }
    async compile(filename) {
      LOGGER.debug(`Empty compile request for ${filename}, depends on previous compile.`)
      // Accepting requests to compile, but don't do anything
      // If compiles are missing of out-of-date, will fail a later assertion
      return fromJS( contractOutputs )
    }
  }
  return new Compiler({})
}

departs.bmMixin = () => {
  
  let contracts

  return async (state) => {
    const{
      chainId, autoConfig, sourcePathList
    } = state.toJS()

    const bm = await createBM({
      sourcePathList : sourcePathList,
      chainId        : chainId,
      autoConfig     : !(autoConfig === false),
    })
    if (!contracts) {
      contracts = await bm.getContracts()
    }
    const contractOutputs = contracts.contractOutputs

    assert( isCompile(fromJS( contractOutputs )) )
    return Map({
      bm: bm,
      contractOutputs: contractOutputs,
    })
  }
}

departs.compileMixin = (createCompiler=departs.createEmptyCompiler) => {
  return async (state) => {
    const{
      bm, chainId, autoConfig, sourcePathList
    } = state.toJS()

    const c = await createCompiler(state)
    let compiles = new Map()
    const compile = async ( contractName, sourceFile ) => {
      assert(sourceFile && sourceFile.endsWith('.sol'),
             'sourceFile param not given or does not end with .sol extension')
      const output = await c.compile( sourceFile )
      assert( isCompile(output), `Compile output not found for ${sourceFile}`)
      assert.equal( output.get(contractName).get('name'), contractName )
      // HACK: This appears to be reasonable delay for a compiled output to be returned again
      // remotely.
      return new Promise((resolve, reject) => {
        setTimeout( async () => {
          const contract = await bm.getContract(contractName)
          assert( isContract(contract), `Contract ${contractName} not found` )
          compiles = compiles.set(contractName, output.get(contractName))
          resolve(output)
        }, 2000)
      })
    }

    const cleanCompiles = async () => {
      const compileList = List(compiles.map((c, name) => {
        return bm.cleanContract( name )
      }).values()).toJS()
      await Promise.all( compileList ).then((vals) => {
        LOGGER.debug( 'Clean compiles', vals)
      })
    }

    const getCompiles = () => {
      return compiles
    }

    return new Map({
      compile       : compile,
      bm            : bm,
      getCompiles   : getCompiles,
      cleanCompiles : cleanCompiles,
    })

  }
}

/**
 * Empty mixin for optionally passing through in a pipeline.
 *
 * Required State: none
 *
 * @method emptyMixin
 * @memberof module:depart
 */
departs.emptyMixin = () => {
  return async (state) => {
  }
}

/**
 * Orchestrate a reproducible, idempotent departure of smart contracts for the blockchain,
 * storing artifacts for later web interfaces.
 * The following runtime state variables are required or optional.
 *
 * Required State
 * * chainId {String}
 * * deployerEth signer eth
 * * deployerAddress Ethereum address
 *
 * Optional State
 * * departName {String}
 * * sourcePathList {Array}
 * * autoConfig {Boolean}
 *
 * @method departMixin
 * @memberof module:depart
 */
departs.departMixin = () => {
  return async (state) => {

    const{ bm, chainId, deployerEth, deployerAddress, departName, autoConfig,
      sourcePathList, compile } = state.toJS()
    assert( chainId, `chainId not in input state.` )
    assert( deployerEth, `deployerEth not in input state.` )
    assert( deployerAddress, `deployerAddress not in input state.` )

    let _bm = bm ? bm : await createBM({
      sourcePathList : sourcePathList,
      chainId        : chainId,
      autoConfig     : !(autoConfig === false),
    })

    const l = new Linker({
      bm: _bm
    })
    const d = new Deployer({
      bm: _bm, chainId: state.get('chainId'),
      eth: state.get('deployerEth'), address: state.get('deployerAddress')
    })

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
    const deploy = async ( contractName, linkId, deployId, ctorArgList, fork ) => {
      assert(contractName, 'contractName param not given')
      assert(linkId, 'linkId param not given')
      assert(deployId, 'deployId param not given')
      const deployName = `${contractName}-${deployId}`
      const output = await d.deploy( contractName, linkId, deployId, ctorArgList, fork )
      assert( isDeploy(output) )
      deploys = deploys.set(deployName, output)
      return output
    }

    const deployed = async (contractName, opts = {}) => {
      const { ctorArgList, deployID, force, abi } = opts
      if (!isContract (await bm.getContract(contractName)) ) {
        await compile( contractName, `${contractName}.sol` )
      }
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
      const _options = Map({ from: deployerAddress, gas: getConfig()['GAS_LIMIT'] })
        .merge(options).toJS()
      return await deployerEth.getTransactionReceipt( await method(...argList, _options) )
    }

    const getLinks = () => {
      return links
    }

    const getDeploys = () => {
      return deploys
    }

    const clean = async () => {
      const linkList = List(links.map((l, name) => {
        return _bm.cleanLink( name )
      }).values()).toJS()
      await Promise.all( linkList ).then((vals) => { LOGGER.debug( 'Clean links', vals) })

      const deployList = List(deploys.map((d, name) => {
        return _bm.cleanDeploy( name )
      }).values()).toJS()
      await Promise.all( deployList ).then((vals) => { LOGGER.debug( 'Clean deploys', vals) })
    }

    return new Map({
      departName  : departName,
      clean       : clean,
      deploy      : deploy,
      deployed    : deployed,
      minedTx     : minedTx,
      link        : link,
      bm          : _bm,
      getLinks    : getLinks,
      getDeploys  : getDeploys,
    })

  }

}

module.exports = departs
