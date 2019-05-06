const keys = require('./src/keys')
const wallet = require('./src/wallet')

module.exports = {
  ...keys,
  wallet: wallet,
}
