const path = require('path');
const webpack = require('webpack');
var debug = process.env.NODE_ENV !== "production";

module.exports = {
  context: path.join(__dirname, "src"),
  devtool: debug ? "inline-source-map" : false, //'sourcemap'
  entry: {
    // Each entry in here would declare a file that needs to be transpiled
    // and included in the extension source.
    // For example, you could add a background script like:
    background: './background.js',
    popup: './popup.js'
  },
  output: {
    // This copies each source entry into the extension dist folder named
    // after its entry config key.
    path: __dirname + '/extension/dist',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: [['es2015', { modules: false }], 'react', 'stage-0'],
          plugins: ['react-html-attrs', 'transform-class-properties', 'transform-decorators-legacy', "transform-object-rest-spread"],
        }
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    // Since some NodeJS modules expect to be running in Node, it is helpful
    // to set this environment var to avoid reference errors.
	new webpack.ProvidePlugin({
	   $: "jquery",
	   jQuery: "jquery",
       jquery: 'jquery',
	   "windows.jQuery": "jquery",
	   "window.$": "jquery"
	}),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    })
  ],
};
