module.exports = {
  extends: ["../../packages/eslint-config/next.js"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
