import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';
import inject from '@rollup/plugin-inject';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'PortexETH',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/index.iife.js',
      format: 'iife',
      name: 'PortexETH',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    replace({
      preventAssignment: true,
      delimiters: ['\\b', '\\b'],
      global: 'globalThis',
      'process.env.NODE_DEBUG': false,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.platform': JSON.stringify('browser'),
      'process.version': JSON.stringify('v16.0.0'),
      'process.browser': true
    }),
    typescript({
      sourceMap: true,
      declaration: true,
      declarationDir: './dist',
      outputToFilesystem: true
    }),
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    json(),
    url(),
    terser({
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    nodePolyfills()
  ]
};
