const webpack = require("webpack");

module.exports = function override(config, env) {
  // 添加polyfill
  config.resolve.fallback = {
    ...config.resolve.fallback, // 保留现有的fallbacks
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert/"),
    process: require.resolve("process/browser"),
  };

  // 添加插件配置
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser",
    })
  );

  return config;
};
