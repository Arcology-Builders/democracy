// Utilities
const fs = require('fs')
const path = require('path')

const { Seq, Map, List, fromJS } = require('immutable')
const assert = require('chai').assert

const DB_DIR       = 'db'
const SOURCES_DIR  = 'contracts'
const COMPILES_DIR = 'compiles'
const LINKS_DIR    = 'links'
const DEPLOYS_DIR  = 'deploys'
const LIB_PATTERN  = /__(([a-zA-Z])+\/*)+\.sol:[a-zA-Z]+_+/g

const DEMO_SRC_PATH = 'contracts'
const ZEPPELIN_SRC_PATH = 'node_modules/openzeppelin-solidity/contracts'

/**
 * Deep version of fromJS https://stackoverflow.com/a/40663730
 */
function fromJSGreedy(js) {
  return typeof js !== 'object' || js === null ? js :
    Array.isArray(js) ? 
      Seq(js).map(fromJSGreedy).toList() :
      Seq(js).map(fromJSGreedy).toMap();
}

/**
 * Use this to perform different actions based on whether we are in browser or not
 */
function isBrowser() {
  return (typeof window != 'undefined' && window.document)
}

/**
 * Take the callback action for every level in a hierarchical key space
 */
function getFileKeySpace(key, cb) {
  const keySpaces = List(key.split('/')) // in both localstorage and fs, we use UNIX sep
  const dirSpaces = keySpaces.slice(0,-1)
  dirSpaces.map((dir,i) => { cb(keySpaces.slice(0,i+1)) })
  const keyBase = keySpaces.get(-1)
  const dbDir = path.join(`${DB_DIR}`, ...dirSpaces.toJS())

  // Return the base filename and don't add .json extension
  // b/c the latter is only correct behavior for setImmutableKey
  // and this method is also used by getImmutableKey
  return path.join(dbDir, `${keyBase}`)
}

function setImmutableKey(fullKey, value) {
  assert(typeof(fullKey) === 'string')
  assert(Map.isMap(value) || List.isList(value) || !value)

  if (isBrowser()) {
    localStorage.setItem(fullKey, value)
  } else {
    ensureDir(DB_DIR)
    const dbFile = getFileKeySpace(fullKey, (keyPrefixes) => {
      ensureDir(path.join(DB_DIR, ...keyPrefixes)) })

    if (fs.existsSync(`${dbFile}.json`)) {
      if (!value) {
        // We never delete, only move to the side
        const now = Date.now()
        console.log(`Marking key ${fullKey} deleted at time ${now}`)
        fs.renameSync(`${dbFile}.json`, `${dbFile}.json.${now}`) 
        return true
      } else {
        throw new Error(`Key ${dbFile}.json exists and is read-only.`)
      }
    } else if (fs.existsSync(dbFile)) {
      throw new Error(`Key ${dbFile} exists and is not a JSON file.`)
    } else if (!value) {
      console.log(`Unnecessary deletion of non-existent key ${fullKey}`)
      return true
    }
    const valJS = (Map.isMap(value) || List.isList(value)) ? value.toJS() : value
    console.log(`Setting key ${fullKey} value ${JSON.stringify(valJS)}`)
    fs.writeFileSync(`${dbFile}.json`, JSON.stringify(valJS))
    return true
  }

}

function getImmutableKey(fullKey, defaultValue) {
  assert(typeof(fullKey) === 'string')

  if (isBrowser()) {
    const value = fromJS(JSON.parse(localStorage.getItem(fullKey)))
    if (!value) {
      if (defaultValue) return defaultValue
      else { throw new Error(`Key ${fullKey} does not exist.`) }
    }
    return value
  } else {
    const dbFile = getFileKeySpace(fullKey, () => {})
    if (fs.existsSync(`${dbFile}.json`)) {
      return buildFromDirs(`${dbFile}.json`, () => {return false})
    } else if (fs.existsSync(dbFile)) {
      return buildFromDirs(dbFile,
        (fnParts) => { return ((fnParts.length > 1) && (fnParts[1] !== 'json')) })
    } else {
      if (defaultValue) return defaultValue
      else { throw new Error(`Key ${dbFile} does not exist.`) }
    }
  }
}  

function tryIfNot(eth, checkFunc, tryFunc, args) {
  if (!checkFunc(eth, args.get(0))) { tryFunc(args) }
}

function print(data) {
  console.log(JSON.stringify(data, null, '  '))
}

function ensureDir(dirName) {
  if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName, { recursive: true } ) }
}

/**
 * Traverse directories collecting files to perform a callback function on
 * @param startDirs a list of paths to start searching in
 * @param skipFilt a function that returns true for files that need to be skipped
 * @param cb a callback that accepts the source text of a file plus its full path
 * @param dcb a callback for every directory that is encountered
 */
function traverseDirs(startDirs, skipFilt, cb, dcb) {
  const queue = startDirs
  while (queue.length > 0) {
    const f = queue.pop()
    const shortList = path.basename(f).split('.')
    if (skipFilt(shortList)) { continue }
    if (fs.lstatSync(f).isDirectory()) {
      fs.readdirSync(f).forEach((f2) => queue.push(path.join(f,f2)))
      if (dcb) { dcb(f) }
    } else {
      const source = fs.readFileSync(f).toString()
      cb(source, f)
    }
  }
}

/**
 * Traverse directories recursively building an Immutable Map with hierarchical keys
 * as directory paths and values as file contents (leaf nodes)
 * @param f the full path to a filename (possibly a directory) to start traversal
 * @param skipFilt a function that returns true for files that need to be skipped
 */
function buildFromDirs(f, skipFilt) {
  shortList = path.basename(f).split('.')
  if (skipFilt(shortList)) { return null }
  if (fs.lstatSync(f).isDirectory()) {
    return new Map(List(fs.readdirSync(f)).map((f2) => {
      const builtValues = buildFromDirs(path.join(f,f2), skipFilt)
      const baseKey = path.basename(f2)
      const key = (baseKey.endsWith('.json')) ? baseKey.split('.')[0] : baseKey
      return builtValues ? [key, builtValues] : null
    }))
  } else {
    return fromJS(JSON.parse(fs.readFileSync(f)))
  }
}


function getLinks(networkId) {
  const linkMap = {}
  ensureDir(`${LINKS_DIR}/${networkId}`)
  traverseDirs(
    [`${LINKS_DIR}/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Link names will have the form <contractName>-<linkID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { linkMap[path.basename(f).split('.')[0]] = JSON.parse(source) }
  )
  return fromJS(linkMap)
}

function getDeploys(networkId) {
  const deployMap = {}
  ensureDir(`${DEPLOYS_DIR}/${networkId}`)
  traverseDirs(
    [`${DEPLOYS_DIR}/${networkId}`],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f).split('.')[0]] = JSON.parse(source) }
  )
  return fromJS(deployMap)
}

const getContracts = (shouldPrint) => {
  const contractSources = []
  const contractOutputs = {}
  traverseDirs(
    [SOURCES_DIR], // start out by finding all contracts rooted in current directory
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('sol')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      contractSources.push(fb)
      shouldPrint && console.log(`Source ${fb}`)
    }
  )
  traverseDirs(
    [COMPILES_DIR], // start out by finding all contracts rooted in current directory
    (fnParts) => { return ((fnParts.length > 1) &&
      (fnParts[1] !== 'json')) },
    function(source, f) {
      fb = path.basename(f.split('.')[0])
      if (contractSources.indexOf(fb) == -1) { return }
      contractOutputs[fb] = fromJSGreedy(JSON.parse(source))
      shouldPrint && console.log(`Compiled ${fb}`)
    }
  )
  return {
    contractSources: Seq(contractSources),
    contractOutputs: Map(contractOutputs)
  }
}

/**
 * Return a contract read from a file in the `outputs/${networkId}` directory.
 * @param contractName name of the compiled contract
 */
const getContract = (contractName) => {
  ensureDir(`${COMPILES_DIR}`)
  const { contractOutputs } = getContracts()
  return contractOutputs.get(contractName)
}

/**
 * Return a link object read from a file in the `links/${networkId}` directory.
 * @param networkId name of the chain / network deployed onto
 * @param linkName the name of the contract and link ID of the form `ContractName-linkId`
 */
const getLink = (networkId, linkName) => {
  const linkMap = getLinks(networkId)
  return linkMap.get(linkName)
}

/**
 * Return a deploy object read from a file
 * @param networkId name of the chain / network deployed onto
 * @param deployName the name of the contract and deploy of the form `ContractName-deployId`
 */
const getDeploy = (networkId, deployName) => {
  const deployMap = getDeploys(networkId)
  return deployMap.get(deployName)
}

/**
 * @return true if the given object is an ethjs object, otherwise false
 */
const isNetwork = (network) => {
  return (network && network.net_version)
}

/**
 * @return true if the given object is a deploy output, otherwise false
 */
const isDeploy = (deploy) => {
  return (deploy && deploy.get('type') === 'deploy')
}

/**
 * Return an instance from a previously deployed contract
 * @param deploy of previous
 * @return an ethjs instance that can be used to call methods on the deployed contract
 */
const getInstance = (eth, deploy) => {
  assert(isNetwork(eth), 'First parameter is not an Ethereum network.')
  assert(isDeploy(deploy), 'Second parameter is not a deploy output.')
  const Contract = eth.contract(deploy.get('abi').toJS(), deploy.get('code'))
  return Contract.at(deploy.get('deployAddress'))
} 

const cleanCompileSync = (compileName) => {
  const fn = `${COMPILES_DIR}/${compileName}.json`
  if (fs.existsSync(fn)) { fs.unlinkSync(fn) }
}

const cleanLinkSync = (networkId, linkName) => {
  assert.typeOf(networkId, "string")
  const fn = `${LINKS_DIR}/${networkId}/${linkName}.json`
  if (fs.existsSync(fn)) { fs.unlinkSync(fn) }
}

const cleanDeploySync = (networkId, deployName) => {
  assert.typeOf(networkId, "string")
  const fn = `${DEPLOYS_DIR}/${networkId}/${deployName}.json`
  if (fs.existsSync(fn)) { fs.unlinkSync(fn) }
}

const cleanSync = (networkId) => {
  //const networkId = await eth.net_version()
  fs.rmdirSync(`${COMPILES_DIR}`)
  // TODO Re-enable when you're written a recursive remove directory function
  //fs.rmdirSync(`${LINKS_DIR}/${networkId}/${linkName}`)
  //fs.rmdirSync(`${DEPLOYS_DIR}/${networkId}/${deployName}`)
}

const thenPrint = (promise) => {
  promise.then((value) => {console.log(JSON.stringify(value))})
}

module.exports = {
  tryIfNot          : tryIfNot,
  traverseDirs      : traverseDirs,
  buildFromDirs     : buildFromDirs,
  thenPrint         : thenPrint,
  print             : print,
  ensureDir         : ensureDir,
  getDeploys        : getDeploys,
  getDeploy         : getDeploy,
  getLinks          : getLinks,
  getLink           : getLink,
  getContracts      : getContracts,
  getContract       : getContract,
  isDeploy          : isDeploy,
  getInstance       : getInstance,
  cleanCompileSync  : cleanCompileSync,
  cleanLinkSync     : cleanLinkSync,
  cleanDeploySync   : cleanDeploySync,
  cleanSync         : cleanSync,
  getFileKeySpace   : getFileKeySpace,
  getImmutableKey   : getImmutableKey,
  setImmutableKey   : setImmutableKey,
  LIB_PATTERN       : LIB_PATTERN,
  DB_DIR            : DB_DIR,
  SOURCES_DIR       : SOURCES_DIR,
  COMPILES_DIR      : COMPILES_DIR,
  LINKS_DIR         : LINKS_DIR,
  DEPLOYS_DIR       : DEPLOYS_DIR,
  DEMO_SRC_PATH     : DEMO_SRC_PATH,
  ZEPPELIN_SRC_PATH : ZEPPELIN_SRC_PATH,
}
