const { Map } = require('immutable')
const BN      = require('bn.js')
const path    = require('path')
const { AZTEC_TYPES: TYPES } = require('demo-aztec-lib')

const that             = require(path.join(process.cwd(), 'src', 'departs'))
const { departZkFunc } = that

depart(Map({
  tradeSymbol      : Map({
    type: TYPES.string,
    value: process.argv[4] || 'AAA',
  }),
  departName       : Map({
    type : TYPES.string,
    value: 'ZK Asset',
  }),
  testValueETH     : Map({
    type: TYPES.string,
    value: '0.1',
  }),
  testAccountIndex : Map({
    type: TYPES.integer,
    value: 6,
  }),
  sourcePathList   : Map({
    type: TYPES.array,
    value: ['../../node_modules/@aztec/protocol/contracts/', 'contracts'],
  }),
  unlockSeconds    : Map({
    type: TYPES.integer,
    value: 50,
  }),
  canConvert       : Map({
    type: TYPES.boolean,
    value: false,
  }),
}), departZkFunc)
