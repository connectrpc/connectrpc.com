module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  root: true,
  ignorePatterns: ["build/**"],
  extends: ["plugin:@docusaurus/recommended"],
  rules: {
    "@docusaurus/no-untranslated-text": [
      "warn",
      { ignoredStrings: ["·", "—", "×"] },
    ],
  },
};
