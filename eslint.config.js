import lomray from '@lomray/eslint-config';
import lomrayReact from '@lomray/eslint-config-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/.next/**',
      '**/.output/**',
      '**/.nitro/**',
      '**/.react-router/**',
      '**/.tanstack/**',
      '**/routeTree.gen.ts',
      '**/next-env.d.ts',
      '.bench/**',
      'results/**',
    ],
  },
  ...lomray.config({
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: ['tsconfig.json', 'apps/*/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
        node: true,
      },
    },
    rules: {
      // Framework file conventions and required named exports differ from library modules.
      'unicorn/filename-case': 'off',
      'folders/match-regex': 'off',
      'import-x/prefer-default-export': 'off',
      'import-x/no-named-as-default': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'import-x/extensions': [
        'error',
        'ignorePackages',
        { mjs: 'always', cjs: 'always', json: 'always', ts: 'never', tsx: 'never' },
      ],
    },
  }),
  ...lomrayReact.react.map((config) => ({ ...config, files: ['**/*.tsx'] })),
  { ...tseslint.configs.disableTypeChecked, files: ['**/*.{js,mjs,cjs}'] },
  // Node --require preloads are CommonJS, without a transpilation step.
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-var-requires': 'off' } },
  {
    files: ['runtimes/*-bun/*.mjs', 'runtimes/bun-serve/*.mjs'],
    languageOptions: { globals: { Bun: 'readonly' } },
  },
];
