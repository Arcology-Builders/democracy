'use strict'

/**
 * demo-compile, a package for compiling and EVM language management.
 * More detailed docs are available in the [demo-compiler README]
 * (https://github.com/invisible-college/democracy/blob/master/packages/compile/README.md)
 *
 * @module compile
 */
const comp = require('./src/compile.js')
const flat = require('./src/flattener.js')

module.exports = {
  ...comp,
  ...flat,
}
