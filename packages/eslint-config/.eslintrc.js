module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
        semi: true,
      },
    ],
  },
  overrides: [
    {
      env: {
        jest: true,
      },
      files: ['**/*.spec.js'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
  ],
};
