'use strict'

const common  = require('./src/common')
const mint    = require('./src/mint')
const cx      = require('./src/cx')
const bs      = require('./src/bs')
const pt      = require('./src/pt')
const cheatPt = require('./src/cheatPt')
const viz     = require('./src/viz')
const departs = require('./src/departs')

const all = {
  ...common ,
  ...mint   ,
  ...cx     ,
  ...bs     ,
  ...pt     ,
  ...cheatPt,
  ...viz    ,
  ...departs,
}

module.exports = all
