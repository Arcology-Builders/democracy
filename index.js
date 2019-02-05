const { List } = require('immutable')
const lib = require('./js/lib')
const utils = require('./js/utils')

module.exports = {
  ...lib,
  ...utils,
  compile: (...args) => { lib.TABLE['compile'](List(args)) },
  link: (...args) => { lib.TABLE['link'](List(args)) },
  deploy: (...args) => { lib.TABLE['deploy'](List(args)) },
  do: (...args) => { lib.TABLE['do'](List(args)) },
}
