const webpack = require('webpack')
const path = require('path');
const npm_package = require('./package.json')

console.log(JSON.stringify(npm_package._moduleAliases));

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  entry: './dist/src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'web',
  node: {
    fs: "empty"
  },
  mode: 'development',
  /*
  externals: {
    'config': require('config'),
    'path': require('path')
  },
 */
	resolve: {
    alias: npm_package._moduleAliases || {}
  },
/*
  plugins: [ 
    new webpack.ContextReplacementPlugin(
      /\.\*\/,
        (context) => { console.log(JSON.stringify(context)) }
    )
  ]
  */
};
