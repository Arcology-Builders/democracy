'use strict';

/**
 * Command-line runners and mixins for extracting arguments and configs of all kinds
 */

const path = require('path')
const assert = require('chai').assert
const { toWei } = require('web3-utils')
const { getConfig, getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { Map, List } = require('immutable')
const LOGGER = new Logger('runner.spec')

const runners = {}

/**
 * Deployer mixing that extracts the deployer address/password from the config
 * Binds no arguments.
 *
 * @method deployerMixin
 * @memberof module:cli 
 * @return {Function} returns a mixin which takes no input state and returns an
 *   Immutable {Map} of `chainId`, `deployerAddress`, `deployerPassword`, `deployerEth`
 */
runners.deployerMixin = () => {
  return async (state) => {
    LOGGER.debug('Deployer Input State', state)
    const { testValueETH, testAccountIndex, unlockSeconds,
            deployerAddress, deployerPassword } = state.toJS()

    assert(Number.isInteger(unlockSeconds), `unlockSeconds not found in input state`)

    const configAddress  = getConfig()['DEPLOYER_ADDRESS']
    const configPassword = getConfig()['DEPLOYER_PASSWORD']
    await wallet.init({ autoConfig: true, unlockSeconds: unlockSeconds || 1 })
    const _deployerAddress = deployerAddress ? deployerAddress : configAddress
    const _deployerPassword = deployerPassword ? deployerPassword : configPassword
    const {
      signerEth : deployerEth,
      address   : createdAddress,
      password  : createdPassword } = await wallet.prepareSignerEth({
        address: _deployerAddress, password: _deployerPassword })
    const chainId = await deployerEth.net_version()

    assert.equal(deployerEth.address, createdAddress)
    if (process.env['NODE_ENV'] === 'DEVELOPMENT' && testValueETH && 
        testValueETH !== '0' && Number.isInteger(testAccountIndex)) {
      const eth = getNetwork()
      const testAccounts = await eth.accounts()
      LOGGER.debug('testAccount', testAccounts)
      await wallet.payTest({
        fromAddress : testAccounts[testAccountIndex || 0],
        toAddress   : createdAddress,
        weiValue    : toWei(testValueETH, 'ether'),
      })
    }

    return new Map({
      chainId          : chainId,
      deployerAddress  : createdAddress,
      deployerPassword : createdPassword,
      deployerEth      : deployerEth,
    })
  }
}

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
runners.argListMixin = (argDefaultMap) => {
  return async (state) => {
    assert( !argDefaultMap || Map.isMap(argDefaultMap),
           `Pass in an Immutable Map or nothing for default args` )
    const _argDefaultMap = argDefaultMap ? argDefaultMap : Map({})
    LOGGER.debug('args', process.argv)
    const scriptName = path.basename(module.filename)

    const scriptArgs = List(process.argv).skipUntil(
      (x) => x.startsWith('--')
    ) 
    let found = true
    let args = scriptArgs
    let argMap = new Map({})
    while (args.count() >= 2 && found) {
      if (args.get(0).startsWith('--')) {
        const key = args.get(0).slice(2)
        if (!args.get(1).startsWith('--')) {
          const value = args.get(1)
          const floatVal = parseFloat(value)
          const intVal = parseInt(value)
          const convertedVal = value.startsWith('0x') ? value :
            Number.isFinite(floatVal) ? floatVal :
            Number.isInteger(intVal) ? intVal : value
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
    const defaultArgsFilled = _argDefaultMap.map(
      (defaultVal, name, i) => (argMap.get(name) || defaultVal)
    )
    const finalArgMap = argMap.merge(defaultArgsFilled)
    LOGGER.debug('finalArgMap', finalArgMap)
    return finalArgMap
  }
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
 * @return the return value of `mainFunc`
 */ 
runners.run = async (mainFunc, mixinList) => {
  LOGGER.debug('Running main function')
  
  const penultState = await mixinList.reduce((stateProm, mixin, i) => {
    LOGGER.debug(`Running mixin ${i}`)
    return stateProm
      .then( (state) => {
        LOGGER.debug(`on input state ${state}`) 
        return mixin(state).then((outState) => {
          return state.merge(outState)
        })
      })
   }, Promise.resolve(Map({})))
  const finalState = await mainFunc(penultState)

  return penultState.merge(finalState)
}

module.exports = runners
