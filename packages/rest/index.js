'use strict'
const server = require('./src/server')
const client = require('./src/client')

module.exports = {
  ...client,
  ...server,
}
