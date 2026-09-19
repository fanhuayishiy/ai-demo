// 离线资产 smoke test：node tools/check-assets.mjs [子目录]
// 逐个 import 资产模块并调用 build()，检查语法 / 运行时异常 / 返回类型 / 空组。
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SCAN = process.argv[2] ? [join(ROOT, 'src', process.argv[2])] : [join(ROOT, 'src', 'assets'), join(ROOT, 'src', 'world'), join(ROOT, 'src', 'motion'), join(ROOT, 'src', 'core')];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (f === 'node_modules' || f.startsWith('.')) continue;
      walk(p, out);
    } else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = [];
for (const s of SCAN) walk(s, files);
files.sort();

let ok = 0;
const fails = [];
const warns = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  try {
    const mod = await import(pathToFileURL(f).href);
    if (typeof mod.build === 'function') {
      const g = mod.build(mod.DEFAULT_OPTIONS || {});
      if (!g || !g.isObject3D) {
        fails.push([rel, 'build() 未返回 Object3D']);
        continue;
      }
      let meshes = 0;
      g.traverse((n) => {
        if (n.isMesh) {
          meshes++;
          if (!n.geometry) fails.push([rel, '存在无几何体的网格']);
          if (!n.material) fails.push([rel, '存在无材质的网格']);
        }
      });
      if (meshes === 0) warns.push([rel, 'build() 返回空组（0 网格）']);
      else ok++;
    } else {
      ok++;
    }
  } catch (e) {
    fails.push([rel, (e && e.message ? e.message : String(e)).split('\n')[0]]);
  }
}

console.log(`\n检查文件：${files.length}  ✓ 通过：${ok}  ✗ 失败：${fails.length}  ⚠ 警告：${warns.length}`);
for (const [f, m] of fails) console.log('  ✗', f, '→', m);
for (const [f, m] of warns) console.log('  ⚠', f, '→', m);
process.exit(fails.length ? 1 : 0);
