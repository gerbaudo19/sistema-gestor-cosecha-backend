// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config({
  ignores: ['eslint.config.mjs'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    semi: 'off',
    quotes: 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
  },
});
