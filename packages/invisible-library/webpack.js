const webpack = require('webpack')

const demo = require('@democracy.js/utils')
const eth = demo.getNetwork()

eth.net_version().then((chainId) => {
  return webpackConfig = require('./webpack.config')(chainId)
}).then(webpack)
