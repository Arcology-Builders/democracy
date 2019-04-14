'use strict'

// Utilities
const fs     = require('fs')
const path   = require('path')

const Logger = require('./logger')
const LOGGER = new Logger('@democracy.js/utils/utils.js')
const { Seq, Map, List, fromJS } 
                   = require('immutable')
const assert = require('chai').assert
const ethjs  = require('ethjs')
const util   = require('ethereumjs-util')

const DB_DIR       = 'db'
const SOURCES_DIR  = 'contracts'
const COMPILES_DIR = 'compiles'
const LINKS_DIR    = 'links'
const DEPLOYS_DIR  = 'deploys'
const LIB_PATTERN  = /__(([a-zA-Z0-9])+\/*)+\.sol:[a-zA-Z0-9]+_+/g

const DEMO_SRC_PATH = 'contracts'
const ZEPPELIN_SRC_PATH = 'node_modules/openzeppelin-solidity/contracts'

const getEndpointURL = () => {
  const { getConfig } = require('./config.js')
  const config = getConfig()
  assert(config['ETH_URL'])
  return config['ETH_URL']
}

const getNetwork = () => {
  const Eth = require('ethjs')
  return new Eth(new Eth.HttpProvider(getEndpointURL()))
}

/**
 * Deep version of fromJS https://stackoverflow.com/a/40663730
 */
const fromJSGreedy = (js) => {
  return typeof js !== 'object' || js === null ? js :
    Array.isArray(js) ? 
      Seq(js).map(fromJSGreedy).toList() :
      Seq(js).map(fromJSGreedy).toMap()
}

const toJS = (imm) => {
  return (List.isList(imm)) ? imm.map((val) => {return toJS(val)}).toJS() :
    (Map.isMap(imm)) ? imm.map((val) => {return toJS(val)}).toJS() :
    imm
}
/*
 * Deep JS object equality testing from https://stackoverflow.com/a/10316616
 */
const deepEqual = (a,b) => {
	if (a instanceof Array && b instanceof Array)
		return arraysEqual(a,b);
	if (Object.getPrototypeOf(a)===Object.prototype &&
      Object.getPrototypeOf(b)===Object.prototype) {
	  return objectsEqual(a,b)
  }
	if (a instanceof Map && b instanceof Map) {
	  return mapsEqual(a,b)
  }
	if (a instanceof Set && b instanceof Set) {
	  throw new Error("equality by hashing not implemented.")
  }
  if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) &&
      (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
	  return typedArraysEqual(a,b)
  }
	return a==b;  // see note[1] -- IMPORTANT
}

const arraysEqual = (a,b) => {
  if (a.length!=b.length) { return false }
	for (let i=0; i < a.length; i++) {
		if (!deepEqual(a[i],b[i]))
			return false;
		return true;
	}
}

const objectsEqual = (a,b) => {
	const aKeys = Object.getOwnPropertyNames(a)
  const bKeys = Object.getOwnPropertyNames(b)
  if (aKeys.length != bKeys.length) { return false }
  aKeys.sort()
	bKeys.sort()
	for (let i=0; i < aKeys.length; i++) {
    if (aKeys[i]!=bKeys[i]) { // keys must be strings
			return false
    }
    return deepEqual(aKeys.map(k=>a[k]), aKeys.map(k=>b[k]))
  }
}

const mapsEqual = (a,b) => {
	if (a.size != b.size) { return false }
	const aPairs = Array.from(a);
	const bPairs = Array.from(b);
	aPairs.sort((x,y) => x[0]<y[0]);
	bPairs.sort((x,y) => x[0]<y[0]);
	for (let i=0; i<a.length; i++) {
		if (!deepEqual(aPairs[i][0],bPairs[i][0]) || !deepEqual(aPairs[i][1],bPairs[i][1])) {
			return false
		}
		return true
	}
}

const typedArraysEqual = (_a, _b) => {
	const a = new Uint8Array(_a);
	const b = new Uint8Array(_b);
	if (a.length != b.length) { return false }
	for (let i=0; i < a.length; i++) {
		if (a[i]!=b[i]) { return false }
		return true
  }
}

/**
 * Use this to perform different actions based on whether we are in browser or not
 */
const isBrowser = () => {
  return (typeof window != 'undefined' && window.document)
}

const print = (data) => {
  console.log(JSON.stringify(data, null, '  '))
}

const ensureDir = (dirName) => {
  if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName, { recursive: true } ) }
}

/**
 * Traverse directories collecting files to perform a callback function on
 * @param startDirs a list of paths to start searching in
 * @param skipFilt a function that returns true for files that need to be skipped
 * @param cb a callback that accepts the source text of a file plus its full path
 * @param dcb a callback for every directory that is encountered
 */
const traverseDirs = (startDirs, skipFilt, cb, dcb) => {
  const queue = startDirs
  while (queue.length > 0) {
    const f = queue.pop()
    const shortList = path.basename(f).split('.')
    if (skipFilt(shortList, f)) { continue }
    if (!fs.existsSync(f)) {
      LOGGER.warn(`Directory ${f} does not exist, skipping.`)
      continue
    }
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
const buildFromDirs = (f, skipFilt) => {
  const shortList = path.basename(f).split('.')
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

const getLinks = (networkId) => {
  linksDir = `${LINKS_DIR}/${networkId}`
  const linkMap = {} 
  /*
  const linkMap = getImmutableKey(linksDir)
  if (!linkMap) {
    LOGGER.info(`Links key '${linksDir}' not found.`); return Map({})
  }
 */
  traverseDirs(
    [linksDir],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Link names will have the form <contractName>-<linkID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { linkMap[path.basename(f).split('.')[0]] = JSON.parse(source) }
  )
  return fromJS(linkMap)
}

const getDeploys = (networkId) => {
  const deploysDir = `${DEPLOYS_DIR}/${networkId}`
  const deployMap = getImmutableKey(deploysDir)
  if (!deployMap) {
    LOGGER.info(`Deploys key '${deploysDir}' not found.`); return Map({})
  }
  /*
  traverseDirs(
    [deploysDir],
    (fnParts) => { return (fnParts.length > 1 && !fnParts[1].startsWith('json')) },
    // Deploy names will have the form <contractName>-<deployID>, do we need to
    // differentiate different deploy IDs for a single contract name?
    (source,f) => { deployMap[path.basename(f).split('.')[0]] = JSON.parse(source) }
  )*/
  return fromJS(deployMap)
}

/**
 * @return true if the given object is an ethjs object, otherwise false
 */
const isNetwork = (_network) => {
  return (_network && _network.net_version)
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

const thenPrint = (promise) => {
  promise.then((value) => {console.log(JSON.stringify(value))})
}

module.exports = {
  isBrowser         : isBrowser,
  traverseDirs      : traverseDirs,
  buildFromDirs     : buildFromDirs,
  thenPrint         : thenPrint,
  print             : print,
  ensureDir         : ensureDir,
  getEndpointURL    : getEndpointURL,
  getNetwork        : getNetwork,
  isNetwork         : isNetwork,
  getInstance       : getInstance,
  LIB_PATTERN       : LIB_PATTERN,
  DB_DIR            : DB_DIR,
  SOURCES_DIR       : SOURCES_DIR,
  COMPILES_DIR      : COMPILES_DIR,
  LINKS_DIR         : LINKS_DIR,
  DEPLOYS_DIR       : DEPLOYS_DIR,
  DEMO_SRC_PATH     : DEMO_SRC_PATH,
  ZEPPELIN_SRC_PATH : ZEPPELIN_SRC_PATH,
  fromJS            : fromJSGreedy,
  toJS              : toJS,
  deepEqual         : deepEqual,
  arraysEqual       : arraysEqual,
  mapsEqual         : mapsEqual,
}
