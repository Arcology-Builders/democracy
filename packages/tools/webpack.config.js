const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')

const path = require('path');
const npm_package = require('./package.json')

module.exports = (env, argv, bundleBase) => {
  const min = (argv.mode === 'production') ? '.min' : ''
  const version = npm_package.version
  const bundleName = `${bundleBase}.${version}${min}`
  const entry = {}
  entry[bundleName] = [
       './src/index.js',
     ]
  return { module: {
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
  target: 'web',
  node: {
    process: false,
    Buffer: false,
  },
	resolve: {
  },
  plugins: [ 
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./dist/index.html"
    }),
    new webpack.ProvidePlugin({
    }),
  ]
}
}
