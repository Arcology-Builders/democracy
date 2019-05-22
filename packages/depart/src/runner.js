'use strict';

/**
 * Command-line runners and mixins for extracting arguments and configs of all kinds
 */

const assert = require('chai').assert
const { toWei } = require('web3-utils')
const { getConfig, getNetwork, Logger } = require('demo-utils')
const { wallet } = require('demo-keys')
const { Map, List } = require('immutable')
const LOGGER = new Logger('cli/runner')

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
runners.deployerMixin = ({ unlockSeconds, testValueETH, testAccountIndex }) => {
  return async (state) => {
    const configAddress  = getConfig()['DEPLOYER_ADDRESS']
    const configPassword = getConfig()['DEPLOYER_PASSWORD']
    await wallet.init({ autoConfig: true, unlockSeconds: unlockSeconds || 1 })
    const {
      signerEth : deployerEth,
      address   : _deployerAddress,
      password  : _deployerPassword } = await wallet.prepareSignerEth({
        address: configAddress, password: configPassword })
    const chainId = await deployerEth.net_version()
    const deployerAddress = configAddress ? configAddress  : _deployerAddress 
    const deployerPassword = configPassword ? configPassword  : _deployerPassword 

    assert.equal(deployerEth.address, deployerAddress)
    if (process.env['NODE_ENV'] === 'DEVELOPMENT') {
      const eth = getNetwork()
      const testAccounts = await eth.accounts()
      LOGGER.debug('testAccount', testAccounts)
      await wallet.payTest({
        fromAddress : testAccounts[testAccountIndex || 0],
        toAddress   : deployerAddress,
        weiValue    : (testValueETH) ? toWei(testValueETH, 'ether') : toWei('0.01', 'ether'),
      })
    }

    return new Map({
      chainId          : chainId,
      deployerAddress  : deployerAddress,
      deployerPassword : deployerPassword,
      deployerEth      : deployerEth,
    })
  }
}

/**
 * Argument list mixin, takes in a list of names and returns a map of them to
 * positional command-line arguments from index 2 onwards (after `node` and `<scriptName>`.
 *
 * @method argListMixin
 * @memberof module:cli
 * @param argList {Array} of strings, names to give positional arguments.
 * @return {Function} a function taking no input state and returning a map of
 *         the names in `argList` as keys and corresponding positional command-line args
 *         as values.
 */
runners.argListMixin = (argList) => {
  return async (state) => {
    const _argList = argList ? argList : []
    const actualLength = process.argv.length
    const expectedLength = argList.length
    const offset = actualLength - expectedLength
    const argMap = new Map(List(_argList).map((name, i) => [name, process.argv[i+offset] ]))
    LOGGER.debug('argMap', argMap)
    return argMap
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
    return stateProm.then( (state) => {
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
