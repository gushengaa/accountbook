const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../assets/iconfont/iconfont.css');
const outPath = path.join(__dirname, '../utils/iconUnicode.js');
const css = fs.readFileSync(cssPath, 'utf8');
const map = {};
const re = /\.(ri-[\w-]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)"/g;
let match;
while ((match = re.exec(css))) {
  map[match[1]] = String.fromCharCode(parseInt(match[2], 16));
}
fs.writeFileSync(
  outPath,
  `// Auto-generated from assets/iconfont/iconfont.css\nexport const ICON_UNICODE = ${JSON.stringify(map)};\n`
);
console.log(`Generated ${Object.keys(map).length} icons -> ${outPath}`);

const ttfPath = path.join(__dirname, '../assets/iconfont/iconfont.ttf');
const b64Out = path.join(__dirname, '../utils/iconfontBase64.js');
if (fs.existsSync(ttfPath)) {
  const b64 = fs.readFileSync(ttfPath).toString('base64');
  fs.writeFileSync(b64Out, `export const ICONFONT_BASE64 = ${JSON.stringify(b64)};\n`);
  console.log(`Generated iconfont base64 -> ${b64Out}`);
}
