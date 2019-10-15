'use strict'

// Democracy Depart command-line tool: orchestrated deploys to the chain

const { Map }   = require('immutable')
const fs = require('fs')
const path = require('path')
const { wallet } = require('demo-keys')
const { getConfig, Logger } = require('demo-utils')
const { runTransforms, createArgListTransform, deployerTransform, DEMO_TYPES: TYPES } = require('demo-transform')
const { createTransform } = require('demo-state')
const { departTransform } = require('./departure')
const LOGGER = new Logger('depart/top')
const assert = require('chai').assert

let departInputState = null
let departCallback = null
const depart = (inputState, callback) => {
  assert(Map.isMap(inputState), 'Input state should be immutable Map')
  departInputState = inputState 
  departCallback = callback
}

const departs = {}

departs.argListTransform = createArgListTransform(Map({
	unlockSeconds    : TYPES.integer,
	testValueETH     : TYPES.string,
	testAccountIndex : TYPES.integer,
	departName       : TYPES.string.opt,
	autoConfig       : TYPES.boolean.opt,
  departFileName   : TYPES.string,
	sourcePathList   : TYPES.array,
}))

// Insert this custom mixin to read in a departure file and save its name
// and callback
const m1 = createTransform({
  func: async ({ departFileName }) => {
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
  },
  inputTypes: Map({
    departFileName: TYPES.string
	}),
  outputTypes: Map({
    departFile: TYPES.string
  }),
})

const m2 = deployerTransform
const m4 = departTransform

departs.callbackTransform = createTransform({
  func: async ({
    compile, link, deploy, deployed, minedTx, deployerEth, deployerAddress, departFile
  }) => {
		const result = (departCallback) ? (await departCallback({...state.toJS()})) : null
		return new Map({ 'result': result })
	},
  inputTypes: Map({}),
  outputTypes: Map({}),
})

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
departs.begin = async (inputState) => {
  const initialState = Map({
    'departFileName'   : 'depart.js', // can be override on command-line --departFileName
    'testValueETH'     : '0.1'      ,
    'testAccountIndex' : 0          ,
    'unlockSeconds'    : 30,
    'sourcePathList'   : [],
  }).merge(inputState)
  return (await runTransforms(
    [
      departs.argListTransform,
      m1, m2, 
      m4, departs.callbackTransform
    ],
    initialState,
 ))
}

module.exports = departs
