import tseslint from "typescript-eslint";

export default tseslint.config({
  files: ["**/*.ts", "**/*.js"],
  languageOptions: {
    parserOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
    },
  },
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "single"],
    "no-unused-vars": "warn",
    "no-console": "off",
  },
});
