/**
 * 若缺少 iconfont.ttf，从 remixicon npm 包复制（需先 npm pack remixicon@4.6.0）
 * 用法: node scripts/ensure-iconfont.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = path.join(__dirname, '../assets/iconfont/iconfont.ttf');

if (fs.existsSync(target) && fs.statSync(target).size > 100000) {
  console.log('iconfont.ttf already exists:', target);
  process.exit(0);
}

const tmpDir = path.join(__dirname, '../_tmp_iconfont');
fs.mkdirSync(tmpDir, { recursive: true });

try {
  execSync('npm pack remixicon@4.6.0', { cwd: tmpDir, stdio: 'inherit' });
  execSync('tar -xzf remixicon-4.6.0.tgz', { cwd: tmpDir, stdio: 'inherit' });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(tmpDir, 'package/fonts/remixicon.ttf'), target);
  console.log('iconfont.ttf installed ->', target);
  const b64 = fs.readFileSync(target).toString('base64');
  const b64Out = path.join(__dirname, '../utils/iconfontBase64.js');
  fs.writeFileSync(b64Out, `export const ICONFONT_BASE64 = ${JSON.stringify(b64)};\n`);
  console.log('iconfontBase64.js regenerated ->', b64Out);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
