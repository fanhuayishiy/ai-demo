import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const name = path.basename(directory);
const teardown = path.resolve(directory, process.env.TEARDOWN_DIR || '.teardown');
const dependencies = process.env.TEARDOWN_DEPS
  ? path.resolve(directory, process.env.TEARDOWN_DEPS)
  : path.join(teardown, 'node_modules');
const output = path.join(directory, 'teardown-out');
execFileSync(process.execPath, [path.join(teardown, 'sims', 'build.mjs'), directory], {
  cwd: directory, env: {...process.env, TEARDOWN_DEPS: dependencies, TEARDOWN_OUT: output}, stdio: 'inherit',
});

const bundled = path.join(output, 'dist', `${name}.html`);
const licenses = [
  ['Teardown', path.join(teardown, 'LICENSE')],
  ['Three.js', path.join(dependencies, 'three/LICENSE')],
  ['Inter', path.join(dependencies, '@fontsource-variable/inter/LICENSE')],
  ['JetBrains Mono', path.join(dependencies, '@fontsource/jetbrains-mono/LICENSE')],
].map(([label, file]) => label + '\n' + fs.readFileSync(file, 'utf8')).join('\n\n');

const html = fs.readFileSync(bundled, 'utf8')
  .replace('<html lang="en">', '<html lang="zh-CN">')
  .replace(`<title>${name}</title>`, [
    '<title>DJI AGRAS T50 · 农业无人机 3D 拆解与飞行</title>',
    '<meta name="description" content="从左侧索引拆解大疆 T50 农业无人机，观看起飞、前进、喷洒和降落的 3D 动画。">',
    '<meta name="theme-color" content="#f3f6f6">',
    '<link rel="icon" href="data:,">',
  ].join('\n'))
  .replace('</head>', '<!-- Third-party licenses\n' + licenses.replaceAll('--', '—') + '\n-->\n</head>');
fs.mkdirSync(path.join(directory, 'dist'), {recursive: true});
fs.writeFileSync(path.join(directory, 'dist', 'index.html'), html);
console.log('dist/index.html · ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB · 离线单文件');
