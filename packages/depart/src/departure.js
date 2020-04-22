const { List, Map } = require('immutable')
const assert = require('chai').assert
const utils = require('demo-utils')
const { toJS, fromJS, getConfig, getNetwork } = utils
const { BuildsManager, Linker, isLink, Deployer, isDeploy, isContract,
  createBM, Contract }
  = require('demo-contract')
const { untilTxMined } = require('demo-tx')
const { RemoteDB } = require('demo-client')
const { TYPES, createTransformFromMap } = require('demo-transform')

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
    sourcePathList
  }) => {

    const bm = await createBM({
      sourcePathList: sourcePathList,
      chainId,
      autoConfig: !(autoConfig === false),
    })

    const l = new Linker({
      bm: bm
    })
    const d = new Deployer({
      bm, chainId,
      eth: deployerEth, address: deployerAddress,
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

    const getLinks = () => {
      return links
    }

    const getDeploys = () => {
      return deploys
    }

    const clean = async () => {
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
      link        : link       ,
      bm          : bm         ,
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
  }),
  outputTypes: Map({
    clean       : TYPES['function'],
    deploy      : TYPES['function'],
    link        : TYPES['function'],
    bm          : TYPES.bm         ,
    getLinks    : TYPES['function'],
    getDeploys  : TYPES['function'],
  })
})

departs.ixTransform = createTransformFromMap({
  func : async ({ link, compile, deploy, deployerEth, bm }) => {
    const minedTx = async ( method, argList, options ) => {
      const _options = Map({ from: deployerAddress, gas: getConfig()['GAS_LIMIT'] })
        .merge(options).toJS()
      const txHash = await method(...argList, _options)
      const txResult =  await untilTxMined({ txHash, eth: signerEth })
      LOGGER.debug('Tx mined result', txResult)
      return txResult
    }

    const deployed = async (contractName, opts = {}) => {
      const { ctorArgList, deployID, force, abi } = opts
      const retrievedContract = await bm.getContract('contractName')
      if (!contract && compile) {
        await compile( contractName, `${contractName}.sol` )
      } else {
        throw new Error(`Needed a compiler but one wasn't found.`)
      }
      const retrievedLink = await bm.getLink(`${contractName}-link`)
      if (!link && link) {
        await link( contractName, 'link' )
      } else {
        throw new Error(`Needed a link for ${contractName} but one wasn't found.`)
      }
      const _deployID = (deployID) ? deployID : 'deploy'
      const deployedContract =
        await deploy( contractName, 'link', _deployID, ctorArgList, force )
      const replacedContract = (abi) ?
        deployedContract.set( 'abi', fromJS(abi) ) : deployedContract 
      LOGGER.debug('deployed ', contractName) 
      assert(isDeploy(replacedContract), `No deployed/replaced contract for ${contractName}`)
      const contract = new Contract({ deployerEth: deployerEth, deploy: replacedContract })
      return await contract.getInstance()
    }

    return Map({
      deployed    : TYPES['function']   ,
      minedTx     : TYPES['function']   ,
    })
  },
  inputTypes : Map({
    deployerEth : TYPES.ethereumSigner,
    bm          : TYPES.bm,
    compile     : TYPES['function'],
    link        : TYPES['function'],
    deploy      : TYPES['function'],
  }),
  outputTypes: Map()
})

module.exports = departs
