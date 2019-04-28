const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')

const path = require('path');
const npm_package = require('./package.json')

const toolsConfig = require('../tools/webpack.config')

module.exports = (env, argv) => {
  const baseConfig = toolsConfig(env, argv, 'democracy')

  const min = (argv.mode === 'production') ? '.min' : ''
  const version = npm_package.version.replace('-', '_')
  const bundleName = `democracy.${version}${min}`
  const entry = {}
  
  /*
  entry[bundleName] = [
       './src/index.js',
       path.resolve(__dirname, '../../node_modules/browserfs/dist/browserfs.min.js'),
     ]
    */
  entry[bundleName] = [
       './exports/demo.js',
  ]
  return { module: {
    noParse: /browserfs\.js/,
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
  externals: { demo: "demo" },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'demo',
  },
  target: 'web',
  node: {
    process: false,
    Buffer: false,
  },
	resolve: {
    alias: {
      'fs': 'browserfs/dist/shims/fs.js',
      'buffer': 'browserfs/dist/shims/buffer.js',
      'path': 'browserfs/dist/shims/path.js',
      'processGlobal': 'browserfs/dist/shims/process.js',
      'bufferGlobal': 'browserfs/dist/shims/bufferGlobal.js',
      'bfsGlobal': require.resolve('browserfs'),
    }
  },
  plugins: [ 
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
    new webpack.ProvidePlugin({
      BrowserFS: 'bfsGlobal',
      process: 'processGlobal',
      Buffer: 'bufferGlobal'
    }),
  ]
}
}
