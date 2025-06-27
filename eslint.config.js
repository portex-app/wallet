import pluginJs from '@eslint/js'; // ESLint 官方 JS 规则插件
import globals from 'globals'; // 预定义全局变量
import tseslint from 'typescript-eslint'; // TypeScript 规则插件
// import simpleImportSort from 'eslint-plugin-simple-import-sort';

// TypeScript 相关的 ESLint 通用配置（plugins 和 rules），供多目录共用
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
    'no-console': 'off', // SDK中允许console输出
    'no-debugger': 'warn',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error'
  }
};

// 配置文件宽松规则
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
  // 📌 1. 指定要匹配的文件类型，并忽略特定文件
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    ignores: [
      'dist', // 根目录 dist 文件夹
      'dist/**', // 根目录 dist 文件夹下的所有内容
      'node_modules', // 根目录 node_modules
      'packages/*/dist', // 子包 dist 文件夹
      'packages/*/node_modules', // 子包 node_modules
      '**/dist/**', // 任意位置的 dist 文件夹
      '**/*.d.ts' // 所有类型定义文件
    ]
  },

  // 📌 2. 设置全局语言选项
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

  // 📌 3. 加载 ESLint 和 TypeScript 官方推荐规则
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 📌 4. SDK 源代码 TypeScript 配置 (packages/*/src/**)
  // ⚠️ 说明：ESLint 的 parserOptions.project 必须指定包含实际文件的 tsconfig
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

  // 📌 5. 所有配置文件 TypeScript 配置
  {
    files: [
      '*.config.ts', // 根目录 TypeScript 配置文件
      '**/*.config.ts', // 任意位置的 TypeScript 配置文件
      '**/rollup*.config.ts', // rollup 相关配置文件
      '**/turbo.config.ts' // turbo 配置文件
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

  // 📌 6. 所有配置文件 JavaScript 配置
  {
    files: [
      '*.config.{js,mjs,cjs}', // 根目录 JavaScript 配置文件
      '**/*.config.{js,mjs,cjs}', // 任意位置的 JavaScript 配置文件
      '**/rollup*.config.{js,mjs,cjs}', // rollup 相关配置文件
      '**/turbo.config.{js,mjs,cjs}', // turbo 配置文件
      'eslint.config.{js,mjs,cjs}' // ESLint 配置文件
    ],
    rules: {
      ...configFileRules,
      // 所有配置文件额外宽松规则
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // 📌 7. 测试文件特殊规则
  {
    files: ['**/*.{test,spec}.{js,ts,tsx}', '**/__tests__/**/*.{js,ts,tsx}', '**/test/**/*.{js,ts}', '**/tests/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },

  // 📌 8. HTML 测试文件忽略规则
  {
    files: ['**/test/**/*.html', '**/tests/**/*.html'],
    rules: {} // HTML文件中的JavaScript不需要严格检查
  }
];

export default config;
