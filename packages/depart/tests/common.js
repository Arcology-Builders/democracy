'use strict'
const fs        = require('fs')
const path      = require('path')
const { Map }   = require('immutable')
const assert    = require('chai').assert
const { toWei } = require('web3-utils')
const BN        = require('bn.js')

const { Logger, getImmutableKey, setImmutableKey, getConfig } = require('demo-utils')
const LOGGER = new Logger('common.spec')
const { Contract, isContract, isCompile, isLink, isDeploy } = require('demo-contract')

const { wallet } = require('demo-keys')
const { runTransforms, createArgListTransform, deployerTransform, DEMO_TYPES: TYPES } = require('demo-transform')
const { createTransform } = require('demo-state')
const { departTransform } = require('..')

const common = {}

common.runStandardTransforms = async (mainTransform, initialState) => {
  
  const m0 = await createArgListTransform(Map({
    unlockSeconds    : TYPES.integer,
    testValueETH     : TYPES.string,
    testAccountIndex : TYPES.integer,
    departName       : TYPES.string,
    autoConfig       : TYPES.boolean,
    sourcePathList   : TYPES.array,
  }))
  const m1 = deployerTransform
  const m2 = departTransform

  const finalState = (await runTransforms(
    [ m0, m1, m2, mainTransform ], initialState
  )).toJS()
  return finalState
}

module.exports = common
