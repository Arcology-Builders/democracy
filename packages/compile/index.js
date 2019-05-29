const comp = require('./src/compile.js')
const flat = require('./src/flattener.js')

module.exports = {
  ...comp,
  ...flat,
}
