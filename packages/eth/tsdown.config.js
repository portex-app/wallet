import { defineConfig } from 'tsdown';

export default defineConfig({
  outputOptions: { name: 'PortexETH' },
  entry: ['./src/index.ts'],
  format: ['esm', 'umd', 'iife'],
  platform: 'browser',
  fixedExtension: true,
  minify: true // Whether to minify the output
});
