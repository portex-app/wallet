// Prettier configuration file
// @see: https://prettier.io

/** @type {import('prettier').Config} */
export default {
  // Maximum line length before wrapping
  printWidth: 150,

  // Number of spaces per indentation level (recommended 2, industry standard)
  tabWidth: 2,

  // Use tabs for indentation? (false: use spaces, true: use tabs)
  useTabs: false,

  // Add semicolons at the end of statements? (true: add, false: omit)
  semi: true,

  // Use single quotes instead of double quotes? (true: single quotes, false: double quotes)
  singleQuote: true,

  // When to add quotes around object keys:
  // "as-needed": only add quotes when required
  // "consistent": if one key requires quotes, quote all keys
  // "preserve": keep original quoting
  quoteProps: 'as-needed',

  // Use single quotes in JSX? (true: single quotes, false: double quotes)
  jsxSingleQuote: false,

  // Trailing commas in multi-line objects/arrays:
  // "none": no trailing commas (recommended to avoid syntax errors)
  // "es5": trailing commas where valid in ES5 (objects, arrays; not function params)
  // "all": trailing commas everywhere (ES6+ only)
  trailingComma: 'none',

  // Print spaces between brackets in object literals and arrays (true: yes, false: no)
  bracketSpacing: true,

  // Put > of JSX tags on the same line? (true: new line, false: same line)
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter:
  // "avoid": omit parentheses when possible (recommended, e.g. `x => x + 1`)
  // "always": always include parentheses (e.g. `(x) => x + 1`)
  arrowParens: 'avoid',

  // Require pragma at top of files to format
  requirePragma: false,

  // Insert @format pragma at top of formatted files
  insertPragma: false,

  // How to wrap prose in markdown and other text files:
  // "always": wrap prose
  // "never": never wrap prose
  // "preserve": respect original wrapping (default)
  proseWrap: 'preserve',

  // How to handle whitespaces in HTML files:
  // "css": respect CSS display property (default)
  // "strict": preserve all whitespaces
  // "ignore": ignore all whitespaces
  htmlWhitespaceSensitivity: 'css',

  // Indent script and style tags in Vue files?
  vueIndentScriptAndStyle: false,

  // Line endings to use, to avoid cross-platform issues:
  // "lf": Unix/Linux/macOS (recommended)
  // "crlf": Windows
  // "auto": maintain existing (not recommended due to potential Git conflicts)
  endOfLine: 'lf',

  // Range of lines to format (from 0 to end)
  rangeStart: 0,
  rangeEnd: Infinity,

  // Override rules for specific file types
  overrides: [
    {
      // JSON files formatting rules
      files: '*.json',
      options: {
        printWidth: 100, // Limit line length for better readability
        tabWidth: 2 // Force 2 spaces indentation
      }
    },
    {
      // Markdown files formatting rules
      files: '*.md',
      options: {
        proseWrap: 'always' // Force wrapping for better readability
      }
    },
    {
      // Vue files extra optimization
      files: '*.vue',
      options: {
        vueIndentScriptAndStyle: true // Indent code inside Vue <script> and <style> tags
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
