'use strict'

const { Logger } = require('demo-utils')
const LOGGER = new Logger('contract/utils')

const { keccak } = require('ethereumjs-util')
const { Map } = require('immutable')

const utils = {}

/**
 * @return true if the given object is a compile output from a Compiler, otherwise false
 */
utils.isCompile = (_compile) => {
  return (_compile && Map.isMap(_compile) && _compile.count() > 0 &&
          _compile.reduce((prev, val) => {
    return prev && val.get('type') === 'compile'
  }, true))
}

/**
 * @return true if the given object is a compile output retrieved from db, otherwise false
 */
utils.isContract = (_contract) => {
  return (Map.isMap(_contract) && _contract.get('type') === 'compile')
}

/**
 * Filter out which requested inputs are out-of-date by source hash or are new,
 * and need to be recompiled, based on the existing outputs.
 * @param requestedInputs Immutable {Map} of keys and values that are inputs to be built
 * @param existingOutputs Immutable {Map} with matching keys and values that represent
 *        built outputs, including a member `inputHash` that matches a `requestedInput`
 *        value that will deterministically reproduce this output
 * @return a Map of keys and values from {requestedInputs}
 */
utils.getInputsToBuild = (requestedInputs, existingOutputs) => {
  return new Map(requestedInputs.map((val,key) => {
    const isNew = !existingOutputs.has(key)
    // We take the hash of content before it has the field 'inputHash'
    const inputHash = keccak(JSON.stringify(val.toJS())).toString('hex')
    const isUpdated = !isNew && (existingOutputs.get(key).get('inputHash') !== inputHash)
    if (isNew) {
      LOGGER.info(`${key} has not been built before.`)
    }
    if (isUpdated) {
      const oldHash = existingOutputs.get(key).get('inputHash')
      LOGGER.debug(`${key} with inputHash ${inputHash} is not up-to-date with old ${oldHash}`)
    }
    return val.set('isUpdated', isUpdated).set('isNew', isNew)
  })).filter((val, key) => { 
    return val.get('isUpdated') || val.get('isNew')
  })
}

/**
 * @return true if the given object is a link output, otherwise false
 */
utils.isLink = (_link) => {
  return (Map.isMap(_link) && _link.get('type') === 'link')
}

/**
 * @return true if the given object is a deploy output, otherwise false
 */
utils.isDeploy = (_deploy) => {
  return (Map.isMap(_deploy) && _deploy.get('type') === 'deploy')
}

module.exports = utils
