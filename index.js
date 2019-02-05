const { List } = require('immutable')
const lib = require('./js/lib')
const utils = require('./js/utils')

module.exports = {
  ...lib,
  ...utils,
  compile: (...args) => { return lib.TABLE['compile'](List(args)) },
  link: (...args) => { return lib.TABLE['link'](List(args)) },
  deploy: (...args) => { return lib.TABLE['deploy'](List(args)) },
  do: (...args) => { return lib.TABLE['do'](List(args)) },
}
