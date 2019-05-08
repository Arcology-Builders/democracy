const path = require('path');
const npm_package = require('./package.json')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const version = npm_package.version
module.exports = (env) => {
  const min = (process.argv.mode === 'production') ? '.min' : ''
  const entry = {}
  entry[`demo-keys-${version}${min}`] = [
    './src/index.js'
  ]
  return {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      }
    ]
  },
  entry: entry,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  externals: {
    "keythereum": "keythereum"
  },
  node: {
    fs: "empty"
  },
  resolve: {
    alias: {
     //'keythereum': require.resolve('keythereum'),
    }
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html",
      inject: "head",
    }),
  ]
}
}
