const { List } = require('immutable')

module.exports = {
  ...require('./js/lib'),
  ...require('./js/utils'),
  compile: (...args) => { demo.TABLE['compile'](List(args)) },
  link: (...args) => { demo.TABLE['link'](List(args)) },
  deploy: (...args) => { demo.TABLE['deploy'](List(args)) },
  do: (...args) => { demo.TABLE['do'](List(args)) },
}
