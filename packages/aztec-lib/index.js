'use strict'

const mintFunc   = require('./src/mintFunc')
const cxFunc     = require('./src/cxFunc')
const ptFunc     = require('./src/ptFunc')
const eip712     = require('./src/eip712')
//const bsFunc   = require('./src/bsFunc')
const utils      = require('./src/utils')
const transforms = require('./src/transforms')

const all = {
  ...mintFunc,
  ...cxFunc,
  ...ptFunc,
  ...eip712,
  //...bsFunc,
  ...utils,
  ...transforms,
}

module.exports = all
