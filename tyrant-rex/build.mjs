import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.dirname(source);
execFileSync(process.execPath, [path.join(workspace, 'teardown/sims/build.mjs'), source], {cwd: source, stdio: 'inherit'});
const bundled = path.join(source, 'teardown-out/dist/tyrant-rex.html');
let html = fs.readFileSync(bundled, 'utf8')
  .replace('<html lang="en">', '<html lang="zh-CN">')
  .replace('<title>tyrant-rex</title>', '<title>TYRANT RX-01 · 机械霸王龙拆解档案</title><meta name="description" content="精细机械霸王龙交互拆解：开窗颅骨、环形动力核心、液压关节与十四节平衡尾。完全离线，一页探索。"><meta name="theme-color" content="#e9edef"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%2317374b%27/%3E%3Cpath d=%27M12 26h22l6 9 14 4-14 2-9-8-5 7v12h-5V38l-7-3V26m3-9h20v8H17z%27 fill=%27%23b8cbd1%27/%3E%3Ccircle cx=%2720%27 cy=%2720%27 r=%272%27 fill=%27%23ed8b49%27/%3E%3C/svg%3E">');
const licenses = [
  ['Teardown / claude-motion', 'teardown/LICENSE'],
  ['Three.js', 'teardown/node_modules/three/LICENSE'],
  ['Inter', 'teardown/node_modules/@fontsource-variable/inter/LICENSE'],
  ['JetBrains Mono', 'teardown/node_modules/@fontsource/jetbrains-mono/LICENSE'],
].map(([label, file]) => `${label}\n${fs.readFileSync(path.join(workspace, file), 'utf8')}`).join('\n\n');
html = html.replace('</head>', `<!--\nThird-party licenses\n${licenses.replace(/--/g, '—')}\n-->\n</head>`);
fs.mkdirSync(path.join(source, 'dist'), {recursive: true});
fs.writeFileSync(path.join(source, 'dist/index.html'), html);
fs.writeFileSync(path.join(source, '机械霸王龙.html'), html);
fs.writeFileSync(bundled, html);
console.log(`Standalone: ${path.join(source, '机械霸王龙.html')}\nSize: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB; all scripts, fonts, geometry and materials are offline.`);
