module.exports = {

  mode: "production",

  // Enable sourcemaps for debugging webpack's output
  devtool: "source-map",

  resolve: {
    // Add '.ts' nd '.tsx' as resolvable extensions
    extensions: [".ts", ".tsx"]
  },

  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader"
          }
        ]
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map'loader'
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      }
    ]
  },

  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
  }

}
