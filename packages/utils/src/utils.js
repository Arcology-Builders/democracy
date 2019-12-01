'use strict'
const fs = require('fs')
const path = require('path')
const { assert } = require('chai')
const { Logger } = require('./logger')
const LOGGER = new Logger('utils/utils')
const { Seq, Map, List } = require('immutable')
const BN = require('bn.js')

const utils = {}

utils.DB_DIR       = 'db'
utils.OUTS_DIR     = 'compileOutputs'
utils.FLATS_DIR    = 'sourcesFlattened'
utils.SOURCES_DIR  = 'contracts'
utils.COMPILES_DIR = 'compiles'
utils.LINKS_DIR    = 'links'
utils.DEPLOYS_DIR  = 'deploys'
utils.LIB_PATTERN  = /__(([a-zA-Z0-9])+\/*)+\.sol:[a-zA-Z0-9]+_+/g

utils.DEMO_SRC_PATH = 'contracts'

utils.getEndpointURL = () => {
  const { getConfig } = require('./config.js')
  const config = getConfig()
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
      Seq(js).map(utils.fromJS).toOrderedMap()
}

utils.toJS = (imm) => {
  return (List.isList(imm)) ? imm.map((val) => {return utils.toJS(val)}).toJS() :
    (Map.isMap(imm)) ? imm.map((val) => {return utils.toJS(val)}).toJS() :
      imm
}

utils.equal = (a,b) => {
  if (Map.isMap(a) && Map.isMap(b)) { return utils.immEqual(a,b) }
  if (List.isList(a) && List.isList(b)) { return utils.immEqual(a,b) }
  return utils.deepEqual(a,b)
}

/**
 * Determines if two newline delimited texts are equal by line.
 *
 * @method textsEqual
 * @memberof module:utils
 * @param a {String} first text to compare
 * @param b {String} first text to compare
 * @return first line number where the two texts differ, or -1 if they are identical
 */
utils.textsEqual = (a,b) => {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  for (let i = 0; i < aLines.length; i += 1) {
    if ( aLines[i] !== bLines[i] ) { return i }
  }
  return -1
}

utils.stringsEqual = (a,b) => {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) { return i }
  }
  return -1
}

/*
 * Deep JS object equality testing from https://stackoverflow.com/a/10316616
 */
utils.deepEqual = (a,b) => {
  if (a instanceof Array && b instanceof Array)
    return utils.arraysEqual(a,b)
  if (Object.getPrototypeOf(a)===Object.prototype &&
      Object.getPrototypeOf(b)===Object.prototype) {
	  return utils.objectsEqual(a,b)
  }
  if (a instanceof Map && b instanceof Map) {
    return utils.mapsEqual(a,b)
  }
  if (a instanceof Set && b instanceof Set) {
    throw new Error('equality by hashing not implemented.')
  }
  if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) &&
      (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
	  return utils.typedArraysEqual(a,b)
  }
  return a==b  // see note[1] -- IMPORTANT
}

utils.arraysEqual = (a,b) => {
  if (a.length!=b.length) { return false }
  for (let i=0; i < a.length; i++) {
    if (!utils.deepEqual(a[i],b[i]))
      return false
    return true
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
    return utils.deepEqual(aKeys.map(k=>a[k]), aKeys.map(k=>b[k]))
  }
}

utils.mapsEqual = (a,b) => {
  if (a.size != b.size) { return false }
  const aPairs = Array.from(a)
  const bPairs = Array.from(b)
  aPairs.sort((x,y) => x[0]<y[0])
  bPairs.sort((x,y) => x[0]<y[0])
  for (let i=0; i<a.length; i++) {
    if (!utils.deepEqual(aPairs[i][0],bPairs[i][0]) ||
        !utils.deepEqual(aPairs[i][1],bPairs[i][1])) {
      return false
    }
    return true
  }
}

utils.typedArraysEqual = (_a, _b) => {
  const a = new Uint8Array(_a)
  const b = new Uint8Array(_b)
  if (a.length != b.length) { return false }
  for (let i=0; i < a.length; i++) {
    if (a[i]!=b[i]) { return false }
    return true
  }
}

/**
 * @param _a {Immutable} first list or map to compare.
 * @param _b {Immutable} second list or map to compare.
 * @return true if the two objects have equal value (JSON strings) false otherwise.
 */
utils.immEqual = (_a, _b) => {
  return JSON.stringify(_a.toJS()) === JSON.stringify(_b.toJS())
}

/**
 * @return true if we are in a browser (tests for present of `window` and `window.document`
 */
utils.isBrowser = () => {
  return (typeof window != 'undefined' && window.document)
}

utils.ensureDir = (dirName) => {
  if (!fs.existsSync(dirName)) { fs.mkdirSync(dirName, { recursive: true } ) }
}

/**
 * Remove a file (not a directory) if it exists
 */
utils.rimRafFileSync = (fn) => {
  if (fs.existsSync(fn)) { fs.unlinkSync(fn) }
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
    const shortList = path.basename(f).split('.')
    if (skipFilt(shortList, f)) { continue }
    if (!fs.existsSync(f)) {
      LOGGER.debug(`Skipping traversal directory ${f} which does not exist.`)
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
utils.buildFromDirs = (f, skipFilt) => {
  const shortList = path.basename(f).split('.')
  if (skipFilt(shortList)) { return null }
  if (fs.lstatSync(f).isDirectory()) {
    return new Map(List(fs.readdirSync(f)).map((f2) => {
      const builtValues = utils.buildFromDirs(path.join(f,f2), skipFilt)
      const baseKey = path.basename(f2)
      const key = (baseKey.endsWith('.json')) ? baseKey.split('.')[0] : baseKey
      return builtValues ? [key, builtValues] : null
    }))
  } else {
    return utils.fromJS(JSON.parse(fs.readFileSync(f)))
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

/**
 * Chain and return a (possibly asynchronous) call after the outputter,
 * also possibly asynchronous. 
 * @param outputCallResult the result of calling outputter method, will have a `then`
 *        property if it's thenable / asynchronous.
 * @param callback method, possibly asynchronous, which accepts as input the
 *        return value of the outputter method call (`outputCallResult`) 
 */
utils.awaitOutputter = (outputCallResult, afterOutput) => {
  if (outputCallResult.then) {
    return outputCallResult.then((val) => {
      return afterOutput(val) }) 
  } else {
    return afterOutput(outputCallResult)
  }
}

/**
 * Chain and return a (possibly asynchronous) call after the inputter,
 * also possibly asynchronous
 * @param inputCallResult the result of calling the inputter method on some args
 *        will have a `then` property if it's thenable / asynchronous
 * @param callback method, possibly asynchronous, which accepts as input the
 *        return value of the inputter method call (`inputCallResult`)
 */
utils.awaitInputter = (inputCallResult, afterInput) => {
  if (inputCallResult.then) {
    return inputCallResult.then((val) => {
      return afterInput(val) })
  } else {
    return afterInput(inputCallResult)
  }
}

/**
 * Convert a unix timestamp to a block number
 * @param timestamp {Number}
 */
utils.timeStampSecondsToBlockNumber = async (timeStampSeconds) => {
  const eth = utils.getNetwork()
  const now = Date.now() / 1000
  const blocksFromNow = Math.round(((Number(timeStampSeconds)) - now) / 15)
  assert( blocksFromNow > 0 )
  const blockNow = await eth.blockNumber()
  const block = blockNow.add(new BN(blocksFromNow))
  return block
}

module.exports = utils
