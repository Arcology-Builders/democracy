'use strict'

const { Logger } = require('./logger')
const LOGGER = new Logger('utils/utils')
const { Seq, Map, List, fromJS } 
                   = require('immutable')
const assert = require('chai').assert
const ethjs  = require('ethjs')

const utils = {}

utils.DB_DIR       = 'db'
utils.SOURCES_DIR  = 'contracts'
utils.COMPILES_DIR = 'compiles'
utils.LINKS_DIR    = 'links'
utils.DEPLOYS_DIR  = 'deploys'
utils.LIB_PATTERN  = /__(([a-zA-Z0-9])+\/*)+\.sol:[a-zA-Z0-9]+_+/g

utils.DEMO_SRC_PATH = 'contracts'
utils.ZEPPELIN_SRC_PATH = 'node_modules/openzeppelin-solidity/contracts'

utils.setUtilsFS = (_fs) => {
  utils.fs = _fs
}

utils.setUtilsPath = (_path) => {
  utils.path = _path
}

utils.getEndpointURL = () => {
  const { getConfig } = require('./config.js')
  const config = getConfig()
  assert(config['ETH_URL'])
  return config['ETH_URL']
}

utils.getNetwork = () => {
  const Eth = require('ethjs')
  return new Eth(new Eth.HttpProvider(utils.getEndpointURL()))
}

/**
 * Deep version of fromJS https://stackoverflow.com/a/40663730
 */
utils.fromJS = (js) => {
  return typeof js !== 'object' || js === null ? js :
    Array.isArray(js) ? 
      Seq(js).map(utils.fromJS).toList() :
      Seq(js).map(utils.fromJS).toMap()
}

utils.toJS = (imm) => {
  return (List.isList(imm)) ? imm.map((val) => {return utils.toJS(val)}).toJS() :
    (Map.isMap(imm)) ? imm.map((val) => {return utils.toJS(val)}).toJS() :
    imm
}
/*
 * Deep JS object equality testing from https://stackoverflow.com/a/10316616
 */
utils.deepEqual = (a,b) => {
	if (a instanceof Array && b instanceof Array)
		return utils.arraysEqual(a,b);
	if (Object.getPrototypeOf(a)===Object.prototype &&
      Object.getPrototypeOf(b)===Object.prototype) {
	  return utils.objectsEqual(a,b)
  }
	if (a instanceof Map && b instanceof Map) {
	  return utils.mapsEqual(a,b)
  }
	if (a instanceof Set && b instanceof Set) {
	  throw new Error("equality by hashing not implemented.")
  }
  if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) &&
      (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
	  return utils.typedArraysEqual(a,b)
  }
	return a==b;  // see note[1] -- IMPORTANT
}

utils.arraysEqual = (a,b) => {
  if (a.length!=b.length) { return false }
	for (let i=0; i < a.length; i++) {
		if (!utils.deepEqual(a[i],b[i]))
			return false;
		return true;
	}
}

utils.objectsEqual = (a,b) => {
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

utils.mapsEqual = (a,b) => {
	if (a.size != b.size) { return false }
	const aPairs = Array.from(a);
	const bPairs = Array.from(b);
	aPairs.sort((x,y) => x[0]<y[0]);
	bPairs.sort((x,y) => x[0]<y[0]);
	for (let i=0; i<a.length; i++) {
		if (!utils.deepEqual(aPairs[i][0],bPairs[i][0]) ||
        !utils.deepEqual(aPairs[i][1],bPairs[i][1])) {
			return false
		}
		return true
	}
}

utils.typedArraysEqual = (_a, _b) => {
	const a = new Uint8Array(_a);
	const b = new Uint8Array(_b);
	if (a.length != b.length) { return false }
	for (let i=0; i < a.length; i++) {
		if (a[i]!=b[i]) { return false }
		return true
  }
}

/**
 * @return true if we are in a browser (tests for present of `window` and `window.document`
 */
utils.isBrowser = () => {
  return (typeof window != 'undefined' && window.document)
}

utils.ensureDir = (dirName) => {
  if (!utils.fs.existsSync(dirName)) { utils.fs.mkdirSync(dirName, { recursive: true } ) }
}

/**
 * Remove a file (not a directory) if it exists
 */
utils.rimRafFileSync = (fn) => {
  if (utils.fs.existsSync(fn)) { utils.fs.unlinkSync(fn) }
}

/**
 * Traverse directories collecting files to perform a callback function on
 * @param startDirs a list of paths to start searching in
 * @param skipFilt a function that returns true for files that need to be skipped
 * @param cb a callback that accepts the source text of a file plus its full path
 * @param dcb a callback for every directory that is encountered
 */
utils.traverseDirs = (startDirs, skipFilt, cb, dcb) => {
  const queue = startDirs
  while (queue.length > 0) {
    const f = queue.pop()
    const shortList = utils.path.basename(f).split('.')
    if (skipFilt(shortList, f)) { continue }
    if (!utils.fs.existsSync(f)) {
      LOGGER.warn(`Directory ${f} does not exist, skipping.`)
      continue
    }
    if (utils.fs.lstatSync(f).isDirectory()) {
      utils.fs.readdirSync(f).forEach((f2) => queue.push(utils.path.join(f,f2)))
      if (dcb) { dcb(f) }
    } else {
      const source = utils.fs.readFileSync(f).toString()
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
utils.buildFromDirs = (f, skipFilt) => {
  const shortList = utils.path.basename(f).split('.')
  if (skipFilt(shortList)) { return null }
  if (utils.fs.lstatSync(f).isDirectory()) {
    return new Map(List(utils.fs.readdirSync(f)).map((f2) => {
      const builtValues = utils.buildFromDirs(utils.path.join(f,f2), skipFilt)
      const baseKey = utils.path.basename(f2)
      const key = (baseKey.endsWith('.json')) ? baseKey.split('.')[0] : baseKey
      return builtValues ? [key, builtValues] : null
    }))
  } else {
    return utils.fromJS(JSON.parse(utils.fs.readFileSync(f)))
  }
}

/**
 * @return true if the given object is an ethjs object, otherwise false
 */
utils.isNetwork = (_network) => {
  return (_network && _network.net_version)
}

utils.thenPrint = (promise) => {
  promise.then((value) => {console.log(JSON.stringify(value))})
}

module.exports = utils
