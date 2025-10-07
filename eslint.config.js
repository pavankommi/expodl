const eslintConfigPrettier = require('eslint-config-prettier/flat');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['node_modules/**', 'lib/**'],
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          quoteProps: 'consistent',
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          useTabs: false,
        },
      ],
    },
  },
  eslintConfigPrettier,
];
