module.exports = {
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  collectCoverageFrom: ['src/*.js'],
  coveragePathIgnorePatterns: ['test/test.utils.js'],
};
