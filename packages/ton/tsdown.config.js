import { defineConfig } from 'tsdown';
import nodePolyfills from '@rolldown/plugin-node-polyfills';

export default defineConfig({
  outputOptions: { name: 'PortexTON' },
  entry: ['./src/index.ts'],
  format: ['esm', 'umd', 'iife'],
  platform: 'node',
  fixedExtension: true,
  minify: true, // Whether to minify the output
  inputOptions: {
    inject: {
      Buffer: ['buffer', 'Buffer']
    },
    plugins: [nodePolyfills()]
  }
});
