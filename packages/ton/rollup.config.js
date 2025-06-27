import { createRollupConfig } from '../../rollup.config.shared.js';

// TON 包只构建 ESM 和 UMD 格式，自定义插件配置
export default createRollupConfig({
  name: 'PortexTON',
  outputOptions: {
    formats: ['esm', 'umd'] // 不包含 iife
  },
  pluginOptions: {
    terser: {
      compress: {
        drop_console: true, // 生产环境移除 console 日志
        drop_debugger: true
      }
    },
    enable: {
      url: false // TON 包不需要处理 URL 资源
    }
  }
});

// 如果需要特殊的环境变量配置：
// export default createRollupConfig({
//   name: 'PortexTON',
//   outputOptions: {
//     formats: ['esm', 'umd']
//   },
//   pluginOptions: {
//     replace: {
//       'process.env.TON_NETWORK': JSON.stringify('mainnet')
//     },
//     enable: {
//       nodePolyfills: true // TON 包可能需要 crypto 等 Node.js 模块
//     }
//   }
// });
