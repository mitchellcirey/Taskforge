const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/renderer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico|mp3|wav|ogg)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: 'public' },
        { from: '../version.json', to: 'version.json' },
        { 
          from: 'src/game/models/compiled', 
          to: 'public/models/compiled',
          noErrorOnMissing: true // Don't fail if directory doesn't exist yet
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.json']
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    hot: true
  }
};


