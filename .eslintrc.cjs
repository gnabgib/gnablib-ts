module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:@typescript-eslint/recommended'
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/ts-expect-error': 'allow-with-description' 
  },
  // rules: {
  //   'no-prototype-builtins': 0,
  //   '@typescript-eslint/consistent-type-definitions': ['error', 'type'] 
  // },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  ignorePatterns: ['*.cjs'],
  root: true,
};
