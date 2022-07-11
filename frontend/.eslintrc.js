/* eslint-disable */
module.exports = {
  extends: ["react-app", "plugin:prettier/recommended"],
  rules: {
    "prettier/prettier": "warn",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "none",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
      },
    ],
    curly: "warn",
  },
};
