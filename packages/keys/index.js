const keys = require('./src/keys')
const Wallet = require('./src/wallet')

module.exports = {
  ...keys,
  Wallet: Wallet
}
