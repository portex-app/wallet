import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

async function copyDists() {
  const distDirs = glob.sync('packages/*/dist', { absolute: true });

  if (distDirs.length === 0) {
    console.log('No dist directories found.');
    return;
  }

  for (const distDir of distDirs) {
    // 获取包名（即 distDir 的上一级目录名）
    const packageDir = path.basename(path.dirname(distDir));

    // 目标目录 dist/packageName
    const targetDir = path.resolve('dist', packageDir);

    await fs.ensureDir(targetDir);

    // 读取 dist 目录下所有文件和文件夹（直接内容，不包含dist自身）
    const items = await fs.readdir(distDir);

    for (const item of items) {
      const srcPath = path.join(distDir, item);
      const destPath = path.join(targetDir, item);

      // 删除目标已有文件，确保干净复制
      await fs.remove(destPath);

      // 复制文件或文件夹
      await fs.copy(srcPath, destPath);
    }

    // console.log(`Copied contents of ${distDir} to ${targetDir}`);
  }
}

copyDists().catch(err => {
  console.error('Error copying dist folders:', err);
  process.exit(1);
});
