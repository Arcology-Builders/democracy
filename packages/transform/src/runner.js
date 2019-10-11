 'usestrict';

/**
 * Command-line runners and mixins for extracting arguments and configs of all kinds
 */

const path = require('path')
const assert = require('chai').assert
const { toWei } = require('web3-utils')
const { getConfig, getNetwork, Logger } = require('demo-utils')
const { wallet, isAccount } = require('demo-keys')
const { Map, List } = require('immutable')
const { isValidChecksumAddress } = require('ethereumjs-util')
const { DEMO_TYPES } = require('./types')
const { TYPES, createTransform, createPipeline, PipeHead } = require('demo-state')
const LOGGER = new Logger('runner')

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
runners.deployerTransform = createTransform({
  func: async ({
    testValueETH, testAccountIndex, unlockSeconds, deployerAddress, deployerPassword
  }) => {

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

    LOGGER.debug( `Accounts Map is a map`, Map.isMap(wallet.getAccountSync(createdAddress)) )
    return new Map({
      chainId          : chainId,
      deployerAddress  : createdAddress,
      deployerPassword : createdPassword,
      deployerEth      : deployerEth,
      wallet           : wallet,
    })
  },
  inputTypes: Map({
    testValueETH     : TYPES.string,
    testAccountIndex : DEMO_TYPES.integer,
    unlockSeconds    : DEMO_TYPES.integer,
    deployerAddress  : DEMO_TYPES.ethereumAddress.opt,
    deployerPassword : TYPES.string.opt,
  }),
  outputTypes: Map({
    chainId          : TYPES.string,
    deployerAddress  : DEMO_TYPES.ethereumAddress,
    deployerPassword : TYPES.string,
    deployerEth      : DEMO_TYPES.ethSigner,
    wallet           : DEMO_TYPES.wallet,
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
runners.createArgListTransform = (argTypes) => createTransform({
  func: async ({ ...stateArgs }) => {
    const _argDefaultMap = Map({...stateArgs})
    LOGGER.debug('state', _argDefaultMap)
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
  },
  inputTypes: argTypes,
  outputTypes: argTypes,
})

runners.makeList = (_list) => {
  return List.isList(_list) ? _list : (Array.isArray(_list) ? List(_list) : List([_list]))
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
runners.runTransforms = async (_transformList, _initialState=Map({})) => {
  LOGGER.debug('Running a pipeline on initial state', _initialState)

  const transformList = runners.makeList(_transformList)
  assert( List.isList(transformList) )
  assert( transformList.count() >= 1 )
  const firstPipe = new PipeHead(runners.makeList(transformList.first()))
 
  const finalPipeline = transformList.slice(1).reduce(
    (pipeSoFar, transform, i) =>
      pipeSoFar.append(runners.makeList(transform)),
    firstPipe
  )

  const pipe = createPipeline(finalPipeline)
  return await pipe(_initialState)
}

module.exports = runners
