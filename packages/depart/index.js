const departure = require('./src/departure')
const runner = require('./src/runner')

module.exports = {
  ...departure,
  ...runner,
}
