// Confidential transfer of an amount from a sender to a receiver with change back.
'use strict'
const { Map }   = require('immutable')

const assert    = require('chai').assert

const { run, argListMixin, deployerMixin, departMixin }
                = require('demo-depart')
const { fromJS, Logger, getConfig }
                = require('demo-utils')
const { wallet, isAccount }
                = require('demo-keys')
const { statusFunc } = require('./statusFunc')
const { getAztecPublicKey } = require('./utils')

const LOGGER    = new Logger('status')

const m0 = argListMixin(Map({
  unlockSeconds  : 30,
  noteHash       : '',
  tradeSymbol    : 'III',
  ownerAddress   : '',
  sourcePathList : ['../../node_modules/@aztec/protocol/contracts'],
}))
const m1 = deployerMixin()
const m2 = departMixin()

// Custom mixin to insert state, until demo-depart@0.3.3
const ms = (state) => {
  return async () => {
    return state
  }   
}

const status = async (state) => {
  return await run( statusFunc, [ m0, ms(state), m1, m2 ] ) 
}

module.exports = {
  status
}
