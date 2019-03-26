const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')

const path = require('path');
const npm_package = require('./package.json')

console.log(JSON.stringify(npm_package._moduleAliases));

module.exports = {
  module: {
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
  entry: {
    'bundle.js': [
       './src/index.js',
       path.resolve(__dirname, 'node_modules/browserfs/dist/browserfs.min.js'),
       //path.resolve(__dirname, './node_modules/ethjs/dist/ethjs.min.js'), 
     ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'web',
  node: {
    process: false,
    Buffer: false,
  },
  mode: 'development',
  /*
  externals: {
    'config': require('config'),
    'path': require('path')
  },
 */
	resolve: {
    alias: {
      'fs': 'browserfs/dist/shims/fs.js',
      'buffer': 'browserfs/dist/shims/buffer.js',
      'path': 'browserfs/dist/shims/path.js',
      'processGlobal': 'browserfs/dist/shims/process.js',
      'bufferGlobal': 'browserfs/dist/shims/bufferGlobal.js',
      'bfsGlobal': require.resolve('browserfs'),
      ...npm_package._moduleAliases
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
    /*
    new webpack.ContextReplacementPlugin(
      /\.\*\/,
        (context) => { console.log(JSON.stringify(context)) }
    )*/
  ]
};
