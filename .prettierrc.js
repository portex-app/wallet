// Prettier 配置文件
// @see: https://www.prettier.cn

/** @type {import('prettier').Config} */
export default {
  // ✅ 代码换行的最大宽度（超过会自动换行）
  printWidth: 150,

  // ✅ 缩进空格数（推荐 2，符合行业标准）
  tabWidth: 2,

  // ✅ 是否使用 **制表符** 进行缩进 (false: 使用空格，true: 使用 tab)
  useTabs: false,

  // ✅ 代码行尾是否添加分号 (true: 有分号，false: 无分号)
  semi: true,

  // ✅ 是否使用单引号（true: 单引号，false: 双引号）
  singleQuote: true,

  // ✅ 是否对对象的 key 使用引号
  // "as-needed": 仅在必要时加引号
  // "consistent": 只要有一个 key 需要引号，就对所有 key 加引号
  // "preserve": 保留原样
  quoteProps: 'as-needed',

  // ✅ 在 JSX 代码中使用单引号 (true: 单引号，false: 双引号)
  jsxSingleQuote: false,

  // ✅ 在多行对象/数组中，最后一项后面是否加逗号
  // "none": 不加（推荐，避免语法错误）
  // "es5": ES5 兼容（对象/数组加逗号，函数参数不加）
  // "all": 全部加逗号（仅 ES6+ 兼容）
  trailingComma: "none",

  // ✅ 在对象 `{ foo: bar }` 和数组 `[ 1, 2, 3 ]` 的括号内加空格 (true: 有，false: 无)
  bracketSpacing: true,

  // ✅ Vue/JSX 代码中，`>` 是否单独放在新行 (true: 换行，false: 不换行)
  bracketSameLine: false,

  // ✅ 箭头函数参数只有一个时，是否加括号
  // "avoid": 省略括号 (推荐，例: `x => x + 1`)
  // "always": 总是加括号 (例: `(x) => x + 1`)
  arrowParens: 'avoid',

  // ✅ 是否在文件头部插入 `@prettier` 标记
  requirePragma: false,

  // ✅ 是否在已格式化的文件顶部插入 `@format` 标记
  insertPragma: false,

  // ✅ Markdown 等文本文件的换行策略
  // "always": 强制换行
  // "never": 不换行
  // "preserve": 遵循原始换行方式（默认）
  proseWrap: "preserve",

  // ✅ HTML 文件中的空格敏感度
  // "css": 遵循 CSS 规则（默认）
  // "strict": 保留所有空格
  // "ignore": 忽略所有空格
  htmlWhitespaceSensitivity: "css",

  // ✅ 是否对 Vue 的 `<script>` 和 `<style>` 内的代码进行缩进
  vueIndentScriptAndStyle: false,

  // ✅ 统一换行符，避免跨平台问题
  // "lf": Unix (Linux/macOS) 换行符 (推荐)
  // "crlf": Windows 换行符
  // "auto": 依据系统自动检测（不推荐，可能导致 Git 换行冲突）
  endOfLine: "lf",

  // ✅ 格式化的范围（从第 0 行到最后）
  rangeStart: 0,
  rangeEnd: Infinity,

  // 🔹 特定文件的额外规则
  overrides: [
    {
      // ✅ 对 JSON 文件的格式化规则
      files: "*.json",
      options: {
        printWidth: 100, // 限制 JSON 行长，增强可读性
        tabWidth: 2 // 强制使用 2 个空格缩进
      }
    },
    {
      // ✅ 对 Markdown 文件的格式化规则
      files: "*.md",
      options: {
        proseWrap: "always" // 强制换行，提升可读性
      }
    },
    {
      // ✅ Vue 文件额外优化
      files: "*.vue",
      options: {
        vueIndentScriptAndStyle: true // Vue `<script>` 和 `<style>` 内代码缩进
      }
    },
    {
      files: '*.ts',
      options: {
        parser: 'typescript'
      }
    }
  ]
};
