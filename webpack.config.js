const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
  experiments: {
    topLevelAwait: true,
  },
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/inline",
      },
    ],
  },
  plugins: [new Dotenv()],
};
