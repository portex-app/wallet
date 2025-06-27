import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';
import inject from '@rollup/plugin-inject';
import nodePolyfills from 'rollup-plugin-node-polyfills';

/**
 * 创建默认的入口配置
 * @param {string} [input='src/index.ts'] - 入口文件路径
 * @returns {string} 入口文件路径
 */
export function createDefaultInput(input = 'src/index.ts') {
  return input;
}

/**
 * 创建默认的输出配置
 * @param {string} name - 包的全局名称
 * @param {Object} [options={}] - 输出选项
 * @returns {Array} 输出配置数组
 */
export function createDefaultOutput(name, options = {}) {
  const { formats = ['esm', 'umd', 'iife'], sourcemap = false } = options;

  const outputs = [];

  if (formats.includes('esm')) {
    outputs.push({
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap
    });
  }

  if (formats.includes('umd')) {
    outputs.push({
      file: 'dist/index.umd.js',
      format: 'umd',
      name,
      sourcemap,
      exports: 'named'
    });
  }

  if (formats.includes('iife')) {
    outputs.push({
      file: 'dist/index.iife.js',
      format: 'iife',
      name,
      sourcemap,
      exports: 'named'
    });
  }

  return outputs;
}

/**
 * 创建默认的插件配置
 * @param {Object} [options={}] - 插件选项
 * @param {Object} [options.replace] - replace 插件选项
 * @param {Object} [options.typescript] - typescript 插件选项
 * @param {Object} [options.resolve] - resolve 插件选项
 * @param {Object} [options.commonjs] - commonjs 插件选项
 * @param {Object} [options.terser] - terser 插件选项
 * @param {Array} [options.extra] - 额外的插件
 * @param {Object} [options.enable] - 插件启用控制
 * @param {boolean} [options.enable.replace=true] - 是否启用 replace 插件
 * @param {boolean} [options.enable.typescript=true] - 是否启用 typescript 插件
 * @param {boolean} [options.enable.resolve=true] - 是否启用 resolve 插件
 * @param {boolean} [options.enable.commonjs=true] - 是否启用 commonjs 插件
 * @param {boolean} [options.enable.json=true] - 是否启用 json 插件
 * @param {boolean} [options.enable.url=true] - 是否启用 url 插件
 * @param {boolean} [options.enable.terser=true] - 是否启用 terser 插件
 * @param {boolean} [options.enable.inject=true] - 是否启用 inject 插件
 * @param {boolean} [options.enable.nodePolyfills=true] - 是否启用 node polyfills
 * @returns {Array} 插件数组
 */
export function createDefaultPlugins(options = {}) {
  const {
    replace: replaceOptions = {},
    typescript: typescriptOptions = {},
    resolve: resolveOptions = {},
    commonjs: commonjsOptions = {},
    terser: terserOptions = {},
    extra = [],
    enable = {}
  } = options;

  // 默认启用所有插件
  const {
    replace: enableReplace = true,
    typescript: enableTypescript = true,
    resolve: enableResolve = true,
    commonjs: enableCommonjs = true,
    json: enableJson = true,
    url: enableUrl = true,
    terser: enableTerser = true,
    inject: enableInject = true,
    nodePolyfills: enableNodePolyfills = true
  } = enable;

  const plugins = [];

  // Replace 插件 - 环境变量替换
  if (enableReplace) {
    plugins.push(
      replace({
        preventAssignment: true,
        delimiters: ['\\b', '\\b'],
        global: 'globalThis',
        'process.env.NODE_DEBUG': false,
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.platform': JSON.stringify('browser'),
        'process.version': JSON.stringify('v16.0.0'),
        'process.browser': true,
        ...replaceOptions
      })
    );
  }

  // TypeScript 插件
  if (enableTypescript) {
    plugins.push(
      typescript({
        sourceMap: false,
        declaration: true,
        declarationDir: './dist',
        outputToFilesystem: true,
        ...typescriptOptions
      })
    );
  }

  // Resolve 插件 - 模块解析
  if (enableResolve) {
    plugins.push(
      resolve({
        browser: true,
        preferBuiltins: false,
        mainFields: ['browser', 'module', 'main'],
        ...resolveOptions
      })
    );
  }

  // CommonJS 插件 - 处理 CommonJS 模块
  if (enableCommonjs) {
    plugins.push(
      commonjs({
        include: /node_modules/,
        transformMixedEsModules: true,
        ...commonjsOptions
      })
    );
  }

  // JSON 插件 - 处理 JSON 文件导入
  if (enableJson) {
    plugins.push(json());
  }

  // URL 插件 - 处理资源文件
  if (enableUrl) {
    plugins.push(url());
  }

  // Terser 插件 - 代码压缩
  if (enableTerser) {
    plugins.push(
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true,
          ...terserOptions.compress
        },
        ...terserOptions
      })
    );
  }

  // Inject 插件 - 注入全局变量
  if (enableInject) {
    plugins.push(
      inject({
        Buffer: ['buffer', 'Buffer'],
        ...(options.inject || {})
      })
    );
  }

  // Node Polyfills 插件 - 浏览器环境的 Node.js 模块支持
  if (enableNodePolyfills) {
    plugins.push(nodePolyfills());
  }

  // 添加额外的插件
  plugins.push(...extra);

  return plugins;
}

/**
 * 创建默认的 tree shaking 配置
 * @param {Object} [options={}] - tree shaking 选项
 * @returns {Object} tree shaking 配置
 */
export function createDefaultTreeshake(options = {}) {
  return {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
    ...options
  };
}

/**
 * 创建 rollup 配置
 * @param {Object} [options={}] - 配置选项（与rollup原生参数保持一致）
 * @param {string} [options.input] - 入口文件
 * @param {Array} [options.output] - 输出配置
 * @param {Array} [options.plugins] - 插件配置
 * @param {Object} [options.treeshake] - tree shaking 配置
 * @param {string} [options.name] - 包的全局名称（用于默认输出）
 * @param {Object} [options.pluginOptions] - 插件选项（用于默认插件）
 * @param {Object} [options.outputOptions] - 输出选项（用于默认输出）
 * @returns {import('rollup').RollupOptions}
 */
export function createRollupConfig(options = {}) {
  const {
    input,
    output,
    plugins,
    treeshake,
    // 以下是辅助参数，用于生成默认配置
    name,
    pluginOptions = {},
    outputOptions,
    ...otherOptions
  } = options;

  return {
    input: input || createDefaultInput(),
    output: output || (name ? createDefaultOutput(name, outputOptions) : []),
    plugins: plugins || createDefaultPlugins(pluginOptions),
    treeshake: treeshake || createDefaultTreeshake(),
    ...otherOptions
  };
}
