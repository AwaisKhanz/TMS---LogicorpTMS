module.exports = {
  extends: ["../../packages/eslint-config/node.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
