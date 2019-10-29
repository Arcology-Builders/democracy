 'use strict';

/**
 * Command-line runners and mixins for extracting arguments and configs of all kinds
 */

const path = require('path')
const assert = require('chai').assert
const { toWei } = require('web3-utils')

const { getConfig, getNetwork, Logger } = require('demo-utils')
const LOGGER = new Logger('runner')

const { wallet, isAccount } = require('demo-keys')
//const { Map, List } = require('immutable')
import * as Imm from 'immutable'
const { isValidChecksumAddress } = require('ethereumjs-util')
import { DEMO_TYPES as TYPES } from './types'
import { EthereumAddress } from './utils'
import { ArgCheckerFunc, Args, ArgTypes } from './types'
import { createTransform, Transform, TransformFunc, CallableTransform } from './transform'
import { createPipeline, PipeAppended, PipeHead, Pipeline, CallablePipeline } from './pipeline'

export type AnyObj = { [key: string]: any }

//export type TransformFunc = (args: AnyObj) => Promise<Args>

export const createTransformFromMap = ({
  func,
  inputTypes,
  outputTypes,
}: {
  func: TransformFunc,
  inputTypes: ArgTypes,
  outputTypes: ArgTypes,
}): CallableTransform => {
  assert.typeOf( func, 'function', `Func is not a function, instead ${func}` )
  assert( Imm.Map.isMap(inputTypes), `inputTypes was not a Map, instead ${inputTypes}` )
  assert( Imm.Map.isMap(outputTypes), `outputTypes was not a Map, instead ${outputTypes}` )
  return createTransform(new Transform(func, inputTypes, outputTypes))
}

/**
 * Deployer mixing that extracts the deployer address/password from the config
 * Binds no arguments.
 *
 * @method deployerMixin
 * @memberof module:cli 
 * @return {Function} returns a mixin which takes no input state and returns an
 *   Immutable {Map} of `chainId`, `deployerAddress`, `deployerPassword`, `deployerEth`
 */
export const deployerTransform = createTransformFromMap({
  func: async ({
    testValueETH,
    testAccountIndex,
    unlockSeconds,
    deployerAddress,
    deployerPassword,
  }
  ) => {

    const configAddress  = getConfig()['DEPLOYER_ADDRESS']
    const configPassword = getConfig()['DEPLOYER_PASSWORD']
    await wallet.init({ autoConfig: true, unlockSeconds: unlockSeconds || 1 })
    LOGGER.debug('deployerAddress from state', deployerAddress)
    LOGGER.debug('deployerPassword from state', deployerPassword)
    const deployerComboFromState = isValidChecksumAddress(deployerAddress)
    LOGGER.debug('isValidDeployerComboFromState', deployerComboFromState)
    const _deployerAddress = deployerComboFromState ? deployerAddress : configAddress
    const _deployerPassword = deployerComboFromState ? deployerPassword : configPassword
    LOGGER.debug('_deployerAddress', _deployerAddress)
    LOGGER.debug('_deployerPassword', _deployerPassword)
    const validCombo = await wallet.validatePassword({
      address: _deployerAddress, password: _deployerPassword })
    assert(validCombo, `Invalid address/password combo ${_deployerAddress} ${_deployerPassword}`) 
    const {
      signerEth : deployerEth,
      address   : createdAddress,
      password  : createdPassword } = await wallet.prepareSignerEth({
        address: _deployerAddress, password: _deployerPassword })
    const chainId = await deployerEth.net_version()
    assert.equal( createdAddress, _deployerAddress, `New address created ${createdAddress} instead of ${_deployerAddress}`)

    assert.equal(deployerEth.address, createdAddress)
    if (process.env['NODE_ENV'] === 'DEVELOPMENT' && testValueETH && 
        Number(testValueETH) !== 0) {
      const eth = getNetwork()
      const testAccounts = await eth.accounts()
      LOGGER.debug('testAccount', testAccounts)
      await wallet.payTest({
        fromAddress : testAccounts[testAccountIndex || 0],
        toAddress   : createdAddress,
        weiValue    : toWei(testValueETH, 'ether'),
      })
    }

    LOGGER.debug( `Accounts Map is a map`,
      Imm.Map.isMap(wallet.getAccountSync(createdAddress))
    )
    return Imm.Map({
      chainId          : chainId,
      deployerAddress  : createdAddress,
      deployerPassword : createdPassword,
      deployerEth      : deployerEth,
      wallet           : wallet,
    })
  },
  inputTypes: Imm.Map({
    testValueETH     : TYPES.string,
    testAccountIndex : TYPES.integer,
    unlockSeconds    : TYPES.integer,
    deployerAddress  : TYPES.ethereumAddress.opt,
    deployerPassword : TYPES.string.opt,
  }),
  outputTypes: Imm.Map({
    chainId          : TYPES.string,
    deployerAddress  : TYPES.ethereumAddress,
    deployerPassword : TYPES.string,
    deployerEth      : TYPES.ethereumSigner,
    wallet           : TYPES.wallet,
  })
})

/**
 * Argument list mixin, takes in an Immutable Map of names to default values,
 * and extracts them from the command-line in the form `--argname value`.
 * There are no positional arguments extractd.
 *
 * @method argListMixin
 * @memberof module:cli
 * @param argDefaultMap {Map} an Immutable Map of arg String names to default values.
 *   If there are no default values, pass in nothing to populate a map from CLI args.
 * @return {Function} a function taking no input state and returning a map of
 *         the names in `argList` as keys and corresponding positional command-line args
 *         as values.
 */
export const createArgListTransform = (argTypes: ArgTypes) => createTransformFromMap({
  func: async (defaultArgs: { [key: string]: any }): Promise<Args> => {
    /*
    LOGGER.info('defaultArgs', defaultArgs)
    assert( Imm.Map.isMap(defaultArgs.get('babaloo', Imm.Map({}))),
    JSON.stringify(defaultArgs.get('babaloo') ))
    */
    LOGGER.debug('state', defaultArgs)
    LOGGER.debug('args', process.argv)
    const scriptName = path.basename(module.filename)

    const scriptArgs = Imm.List(process.argv).skipUntil(
      (x: string) => x.startsWith('--')
    ) 
    let found = true
    let args = scriptArgs
    let argMap = Imm.Map({})
    while (args.count() >= 2 && found) {
      const first: string = String(args.get(0))
      if (first.startsWith('--')) {
        const key = first.slice(2)
        const second: string = String(args.get(1))
        if (!second.startsWith('--')) {
          const floatVal: number = parseFloat(second)
          const intVal: number = parseInt(second)
          const convertedVal = second.startsWith('0x') ? second :
            Number.isFinite(floatVal) ? floatVal :
            Number.isInteger(intVal) ? intVal : second
          argMap = argMap.set(key, convertedVal)
          LOGGER.debug(`found arg ${key}=${convertedVal}`)
          args = args.slice(2)
        } else {
          argMap = argMap.set(key, true)
          LOGGER.debug(`found binary arg ${key}`)
          args = args.slice(1)
        }
        found = true
      } else {
        LOGGER.warn(`Ignoring positional args ${args}`)
        found = false
      }
    }
    const finalArgMap = Imm.Map(defaultArgs).map(
      (defaultVal: any, name: string, a: Args) => {
        //const typeName = argTypes.get(name, {typeName: ''}).typeName
        //assert( !typeName.endsWith('MapType') || Imm.Map.isMap(defaultVal),
        //  `typeName ${typeName} is map type but does not match type ${typeof(defaultVal)}` )
        return (argMap.get(name) || defaultVal)
      }
    )
    LOGGER.debug('finalArgMap', finalArgMap)
    return finalArgMap
  },
  inputTypes  : argTypes,
  outputTypes : argTypes,
})

export const makeList = (_list: any) => {
  return Imm.List.isList(_list) ? _list : (Array.isArray(_list) ? Imm.List(_list) : Imm.List([_list]))
}

export const isTransform = (_obj: any) => {
  return (_obj && _obj['transform']) || (Imm.List.isList(_obj) && _obj.reduce((s: boolean, v: any) => Boolean(s || v['transform'])))
}

/**
 * Runner for a main function that takes a list of mixins to extract, process,
 * and return state. Agnostic to whether the main function is async or not.
 *
 * @method run
 * @memberof module:cli
 * @param mainFunc {Function} a callback function which takes in an immutable {Map} of
 *   state from the last mixin.
 * @param mixinList an Immutable {List} of mixin functions that take in an Immutable `Map`
 *   of input state from the previous mixin and return an Immutable `Map` of output state
 *   to the next mixin.
 * @return Immutable {Map} merging all output states of each mixin sequentially and finally
 *   mainFunc.
 */ 
export const runTransforms = async (
  _transformList: Imm.OrderedMap<string,CallableTransform>,
  _initialState: Args = Imm.Map({})
) => {
  LOGGER.debug('Running a pipeline on initial state', _initialState)

  const callablePipeline = assembleCallablePipeline(_transformList)
  assert( callablePipeline.pipeline )
  return await callablePipeline(_initialState)
  /*
  const valuesMap = await callablePipeline(_initialState)
  assert( Map.isMap( callablePipeline.pipeline.mergedOutputTypes ),
         'Pipeline does not have mergedOutputTypes' )
  
  valuesMap.mergedOutputTypes = callablePipeline.pipeline.mergedOutputTypes
  valuesMap.pipeline = callablePipeline.pipeline
  return valuesMap
 */
}

export const assembleCallablePipeline = (_transformOrderedMap: Imm.OrderedMap<string,CallableTransform>): CallablePipeline => {
  const _transformList = Imm.List(_transformOrderedMap.values())
  const _labelsList = Imm.List(_transformOrderedMap.keys())
  const transformList = makeList(_transformList)
  assert( Imm.List.isList(transformList) )
  assert( transformList.count() >= 1 )
  const firstPipe = new PipeHead(makeList(transformList.first()), _labelsList.first())
 
  const finalPipeline: PipeAppended = transformList.slice(1).reduce(
    (pipeSoFar: Pipeline, transform: Transform, i: number) => {
      const transformList = makeList(transform)
      assert( isTransform(transformList), `Item ${i}:${transform} is not a transform`)
      return pipeSoFar.append(transformList, _labelsList.get(i))
    },
    firstPipe
  )

  return createPipeline(finalPipeline)
}
