module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['css-loader', 'style-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader'],
      },
    ],
  },
};
