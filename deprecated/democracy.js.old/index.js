const { List, Map, Set } = require('immutable')
const lib = require('./src/lib')
const utils = require('@democracy.js/utils')
const assert = require('chai').assert

const libKeys = new Set(Map(lib).keys())
const utilKeys = new Set(Map(utils).keys())
const overlap = libKeys.intersect(utilKeys) 
assert(overlap.isEmpty(), `Overlapping keys ${overlap.toString()}`)

module.exports = {
  ...lib,
  ...utils,
  compile: (...args) => { return lib.TABLE['compile'](List(args)) },
  link: (...args) => { return lib.TABLE['link'](List(args)) },
  deploy: (...args) => { return lib.TABLE['deploy'](List(args)) },
  get: (...args) => { return lib.TABLE['get'](List(args)) },
  set: (...args) => { return lib.TABLE['set'](List(args)) },
}
