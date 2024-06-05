module.exports = {
  env: {
    node: true,
    es2018: true,
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
      files: ['**/*.spec.js', '**/*.jest.js'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
  ],
};
