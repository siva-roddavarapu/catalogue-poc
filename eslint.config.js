import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts', '*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Architecture guard: only the Fake Store adapter may know the upstream exists.
    files: ['**/*.{ts,tsx}'],
    ignores: ['apps/api/src/adapters/products/FakeStoreProductSource.ts', 'apps/api/test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/fakestoreapi\\.com/]',
          message: 'Only FakeStoreProductSource may reference fakestoreapi.com.',
        },
      ],
    },
  },
);
