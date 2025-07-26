import pluginJs from '@eslint/js'; // Official ESLint JS rules plugin
import globals from 'globals'; // Predefined global variables
import tseslint from 'typescript-eslint'; // TypeScript rules plugin
// import simpleImportSort from 'eslint-plugin-simple-import-sort';

// Shared ESLint configuration for TypeScript (plugins and rules) used across multiple directories
const tsEslintShared = {
  plugins: {
    '@typescript-eslint': tseslint.plugin
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'no-console': 'off', // Allow console output in SDK
    'no-debugger': 'warn',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error'
  }
};

// Relaxed rules for configuration files
const configFileRules = {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-var': 'error',
  'prefer-const': 'error'
};

/** @type {import('eslint').Linter.Config[]} */
const config = [
  //  1. Specify matched file types and ignore certain files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    ignores: [
      'dist', // dist folder in root directory
      'dist/**', // all contents under dist folder in root
      'node_modules', // root node_modules
      'packages/*/dist', // dist folders in subpackages
      'packages/*/node_modules', // node_modules in subpackages
      '**/dist/**', // dist folders anywhere
      '**/*.d.ts' // all type definition files
    ]
  },

  // 2. Set global language options
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },

  // 3. Load official ESLint and TypeScript recommended rules
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 4. TypeScript config for SDK source code (packages/*/src/**)
  // Note: ESLint parserOptions.project must specify tsconfig that contains real files
  {
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json'
      }
    },
    ...tsEslintShared
  },

  // 5. TypeScript config for all config files
  {
    files: [
      '*.config.ts', // TypeScript config files in root directory
      '**/*.config.ts', // TypeScript config files anywhere
      '**/rollup*.config.ts', // rollup related config files
      '**/turbo.config.ts' // turbo config files
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.node.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...tsEslintShared.rules,
      ...configFileRules
    }
  },

  // 6. JavaScript config for all config files
  {
    files: [
      '*.config.{js,mjs,cjs}', // JavaScript config files in root directory
      '**/*.config.{js,mjs,cjs}', // JavaScript config files anywhere
      '**/rollup*.config.{js,mjs,cjs}', // rollup related config files
      '**/turbo.config.{js,mjs,cjs}', // turbo config files
      'eslint.config.{js,mjs,cjs}' // ESLint config files
    ],
    rules: {
      ...configFileRules,
      // Additional relaxed rules for all config files
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // 7. Special rules for test files
  {
    files: ['**/*.{test,spec}.{js,ts,tsx}', '**/__tests__/**/*.{js,ts,tsx}', '**/test/**/*.{js,ts}', '**/tests/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },

  // 8. Ignore rules for HTML test files
  {
    files: ['**/test/**/*.html', '**/tests/**/*.html'],
    rules: {} // No strict checking for JavaScript inside HTML files
  }
];

export default config;
