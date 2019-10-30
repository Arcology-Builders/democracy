'use strict'
const { Map } = require('immutable')
const { assert } = require('chai')

const { isAccount } = require('demo-keys')
const { Logger } = require('demo-utils')
const { createTransformFromMap, makeMapType } = require('demo-transform')
const { getAztecPublicKey, AZTEC_TYPES: TYPES } = require('./utils')

const LOGGER = new Logger('transforms')

const transforms = {}

transforms.createSignerTransform = (subStateLabel='unlabeled') => createTransformFromMap({
  func: async ({
    wallet,
    [subStateLabel] : {
      senderAddress,
      senderPassword,
    }
  }) => {
    const validCombo = await wallet.validatePassword({
      address: senderAddress, password: senderPassword
    })
    assert(validCombo, `Invalid password for address ${senderAddress} ${senderPassword}`)
    await wallet.prepareSignerEth({ address: senderAddress, password: senderPassword })
    LOGGER.debug('start', Date.now())
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        LOGGER.debug('checkAccount', Date.now())
        // This will fail if the account has not been unlocked yet
        wallet.getAccountSync(senderAddress, true)
        resolve(Map({}))
      }, 1000)
    })
  },
  inputTypes: Map({
    wallet : TYPES.wallet,
    [subStateLabel] : makeMapType(Map({
      senderAddress : TYPES.ethereumAddress,
      senderPassword : TYPES.string,
    }), 'signerInputsMapType'),
  }),
  outputTypes: Map({}),
})

transforms.createPublicKeyTransform = (subStateLabel='unlabeled') => createTransformFromMap({
  func: async ({
    wallet,
    [subStateLabel]: {
      senderAddress,
      senderPublicKey,
    },
  }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const recoveredPublicKey = getAztecPublicKey({ address: senderAddress, wallet })
        assert.equal(recoveredPublicKey, senderPublicKey)
        resolve(Map({ senderPublicKey: recoveredPublicKey }))
      }, 1000)
    })
  },
  inputTypes: Map({
    wallet : TYPES.wallet,
    [subStateLabel] : makeMapType(Map({
      senderAddress : TYPES.ethereumAddress,
      senderPassword : TYPES.string,
    }), 'signerInputsMapType'),
  }),
  outputTypes: Map({
    senderPublicKey : TYPES.aztecPublicKey,
  }),
})

module.exports = transforms
