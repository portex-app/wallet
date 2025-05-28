import pluginJs from "@eslint/js"; // ESLint 官方 JS 规则插件
import globals from "globals";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  // 📌 1. 指定要匹配的文件类型，并忽略特定文件
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"] // 适用于 JS / TS 文件
  },

  // 📌 2. 设置全局语言选项
  {
    languageOptions: {
      ecmaVersion: "latest", // 采用最新 ECMAScript 语法
      sourceType: "module", // 采用 ES 模块导入方式
      globals: {
        ...globals.browser, // 浏览器环境变量
        ...globals.node // Node.js 环境变量
      }
    }
  },

 // 📌 3. 加载 ESLint 和 TypeScript 官方推荐规则
 pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // 📌 4. TypeScript 特定配置
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      // TypeScript 规则
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",

      // 导入排序规则
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // 代码质量规则
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error"
    }
  },

  // 📌 5. 配置文件特殊规则
  {
    files: ["*.config.js", "*.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "import/no-commonjs": "off"
    }
  }
]; 