module.exports = function override(config) {
  config.module = config.module || {};
  config.module.exprContextCritical = false;
  return config;
};
