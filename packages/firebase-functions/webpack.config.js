const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: path.resolve(__dirname, './index.js'),
  optimization: {
    minimize: false,
  },
  performance: {
    hints: false,
  },
  devtool: 'nosources-source-map',
  resolve: {
    extensions: ['.js', '.json'],
  },
  externals: [
    /^firebase.+$/,
    /^@google.+$/,
    nodeExternals({
      allowlist: [/^@chopper-report/],
    }),
  ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, './webpack/dist'),
    libraryTarget: 'commonjs',
  },
};
