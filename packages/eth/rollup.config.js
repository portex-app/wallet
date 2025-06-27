import { createRollupConfig } from '../../rollup.config.shared.js';

// 使用默认的三种输出格式
export default createRollupConfig({
  name: 'PortexETH'
});

// 开发环境示例（启用 source map，禁用压缩）：
// export default createRollupConfig({
//   name: 'PortexETH',
//   outputOptions: {
//     sourcemap: true
//   },
//   pluginOptions: {
//     enable: {
//       terser: false // 禁用压缩
//     }
//   }
// });

// 极简配置示例（只启用必要插件）：
// export default createRollupConfig({
//   name: 'PortexETH',
//   pluginOptions: {
//     enable: {
//       url: false,           // 不处理 URL 资源
//       inject: false,        // 不需要 Buffer 注入
//       nodePolyfills: false  // 不需要 Node.js polyfills
//     }
//   }
// });
