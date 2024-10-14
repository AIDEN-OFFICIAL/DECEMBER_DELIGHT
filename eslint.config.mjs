import globals from 'globals';
import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    languageOptions: { globals: globals.browser },
  },
  pluginJs.configs.recommended,
  // Add Prettier plugin
  {
    plugins: {
      prettier: prettier,
    },
    rules: {
      'prettier/prettier': 'error', // Make prettier issues ESLint errors
    },
  },
  // Disable conflicting ESLint rules from Prettier
  prettierConfig,
];
