'use strict'
const BN         = require('bn.js')
const { Map, OrderedMap }
                 = require('immutable')
const { parsed } = require('dotenv').config()
const { departTransform }
                 = require('demo-depart')
const {
  deployerTransform, createArgListTransform, runTransforms,
}                = require('demo-transform')
const { getConfig, fromJS } = require('demo-utils')

const { constructMintPipeline, AZTEC_TYPES: TYPES }
                 = require('demo-aztec-lib')

const m0 = createArgListTransform(Map({
  minteeAddress    : TYPES.ethereumAddress,
  minteePublicKey  : TYPES.aztecPublicKey,
  minteeAmount     : TYPES.bn,
  unlockSeconds    : TYPES.integer,
  testValueETH     : TYPES.string,
  testAccountIndex : TYPES.integer,
  tradeSymbol      : TYPES.string,
  mintFromZero     : TYPES.boolean,
  sourcePathList   : TYPES.array,
}))
const m1 = deployerTransform
const m2 = departTransform

const initialState = Map({
  minteeAddress    : parsed['TEST_ADDRESS_1'],
  minteePublicKey  : parsed['TEST_PUBLIC_KEY_1'],
  minteeAmount     : new BN(0),
  unlockSeconds    : 1000,
  testValueETH     : '0.15',
  testAccountIndex : 0,
  tradeSymbol      : 'AAA',
  mintFromZero     : false, // To force minting from a zero total note, for testing
  sourcePathList   : ['../../node_modules/@aztec/protocol/contracts'],
})

const mints = {}

mints.mintPipeline = constructMintPipeline(OrderedMap([
  [ 'mintArgs'   , m0],
  [ 'mintDeploy' , m1],
  [ 'mintDepart' , m2],
]))

mints.mint = async (state) => {
  return await runTransforms( mints.mintPipeline, initialState.merge(state) )
}

module.exports = mints
