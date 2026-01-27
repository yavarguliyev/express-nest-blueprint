import path from 'path';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    ignores: ['eslint.config.mjs']
  },
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: path.dirname(new URL(import.meta.url).pathname)
      }
    }
  },
  {
    rules: {
      // Enforce strong typing - no any types allowed
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Absolutely no console statements
      'no-console': 'error',

      // No comments allowed - code must be self-documenting
      'spaced-comment': 'off',
      'no-inline-comments': 'error',

      // File and function size limits
      'max-lines': ['error', 450],
      'max-lines-per-function': ['error', 300],
      complexity: ['error', 150],

      // Other quality rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',

      // Code style
      semi: ['error', 'always'],
      'space-before-function-paren': ['error', { anonymous: 'always', named: 'always', asyncArrow: 'always' }],
      'prettier/prettier': 'off',

      // Disable rules that conflict with our standards
      indent: 'off',
      'no-useless-constructor': 'off',
      'no-dupe-class-members': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'no-redeclare': 'off'
    }
  }
);
