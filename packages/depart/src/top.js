'use strict'

// Democracy Depart command-line tool: orchestrated deploys to the chain

const { Map }   = require('immutable')
const fs = require('fs')
const path = require('path')
const { wallet } = require('demo-keys')
const { getConfig, Logger } = require('demo-utils')
const { run, argListMixin, deployerMixin } = require('./runner')
const { departMixin, compileMixin, bmMixin } = require('./departure')
const LOGGER = new Logger('depart/top')
const assert = require('chai').assert

let departInputState = null
let departCallback = null
const depart = (inputState, callback) => {
  assert(Map.isMap(inputState), 'Input state should be immutable Map')
  departInputState = inputState 
  departCallback = callback
}

// Insert this custom mixin to read in a departure file and save its name
// and callback
const m1 = async (state) => {
  const { departFileName } = state.toJS()
  LOGGER.info(`Depart filename ${departFileName}`)
  const departFilePath = path.join(process.cwd(), departFileName)
  const departFile = fs.existsSync(departFilePath) ?
    fs.readFileSync(departFilePath).toString() : ''

  // TODO If it's ever useful to save output state of eval, like console line,
  // save the return value here and add it to the returned state below
  eval(departFile)

  return Map({
    departFile : departFile,
  }).merge(departInputState)
}

const m2 = deployerMixin()
const m3 = bmMixin()
const m4 = departMixin()

const departs = {}

departs.departFunc = async (state) => {
  const { compile, link, deploy, deployed, minedTx, deployerEth, deployerAddress,
          departFile } = state.toJS() 

  const result = (departCallback) ? (await departCallback({...state.toJS()})) : null
  return new Map({ 'result': result })
}

departs.end = async (state) => {
  LOGGER.info('departs.end')
  wallet.shutdownSync()
}

/**
 * Top-level departure command that also finalizes state.
 * Suitable for command-line tools or non-appendable UI calls.
 * @memberof module:depart
 * @method top
 *
 * Includes the standard
 * list of mixins from departs.begin and in addition shuts down any state
 * after the departure-from-file mixin
 * @param inputState {Object} Immutable Map of incoming state
 * @param compile {Boolean} whether to include compile mixin
 *
 * Optional State:
 * departFileName - path to departure file
 */
departs.top = async (inputState, createCompiler) => {
  const outState = await departs.begin(inputState, createCompiler)
  return await departs.end(outState)
}

/**
 * Top-level departure command that includes the following standard mixins
 * but does not finalize state. Suitable for appendable UI calls, such as a console or
 * web.
 * - a custom mixin for reading from departure files
 * - a deployer mixin for reading from .env files and supplying builds manager
 * - a departure mixin for supplying linking, deploying, cleaning methods
 *
 * @method begin
 * @memberof module:departs
 * @param inputState {Object} Immutable Map of incoming state
 * @param createCompiler {Function} a function to create a new language-specific compiler
 *   in a departure. If empty, defaults to departs.createEmptyCompiler
 */
departs.begin = async (inputState, createCompiler) => {
  const m0 = argListMixin(Map({
    'departFileName'   : 'depart.js', // can be override on command-line --departFileName
    'testValueEth'     : '0.1'      ,
    'testAccountIndex' : 0          ,
    'unlockSeconds'    : 30,
  }).merge(inputState))
  return (await run( m0, m1, m2, m3, compileMixin(createCompiler), m4, departs.departFunc ))
}

module.exports = departs
