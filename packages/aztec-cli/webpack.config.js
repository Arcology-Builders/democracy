const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')

const path = require('path')
const npm_package = require('./package.json')

module.exports = (env, argv) => {
  const min = (argv.mode === 'production') ? '.min' : ''
  const version = npm_package.version.replace('-', '_')
  const bundleName = `demo-aztec.${version}${min}`
  const entry = {}
  
  /*
  entry[bundleName] = [
       './src/index.js',
       path.resolve(__dirname, '../../node_modules/browserfs/dist/browserfs.min.js'),
     ]
    */
  entry[bundleName] = [
    './src/index.jsx',
  ]
  return { module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
      }
    ]
  },
  entry: entry,
  externals: {
    keythereum: 'keythereum',
    demo: 'demo'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'demoAztec',
  },
  target: 'web',
  node: {
    process: false,
    Buffer: false,
  },
  resolve: {
    alias: {
    }
  },
  plugins: [ 
    new HtmlWebPackPlugin({
      template: './exports/index.html',
      filename: path.join(path.resolve(__dirname, 'dist'), 'index.html'),
      inject: 'head',
    }),
    new webpack.ProvidePlugin({
    }),
  ]
  }
}
