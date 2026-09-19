// 装配成本离线测量：逐资产计时 + 统计 build 后的对象数（含描边壳）
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const s = await import('node:fs').then((fs) => fs.readFileSync(join(ROOT, 'src/world/placement.js'), 'utf8'));
const want = [...new Set([...s.matchAll(/\['((?:flora|store|street|bike|station|interior|products|buildings)\/[a-z0-9-]+)'/g)].map((m) => m[1]))];

let total = 0;
const rows = [];
for (const f of want) {
  const p = join(ROOT, 'src/assets', f + '.js');
  if (!existsSync(p)) continue;
  const t0 = performance.now();
  let n = 0;
  try {
    const m = await import(pathToFileURL(p).href);
    if (typeof m.build !== 'function') continue;
    const g = m.build(m.DEFAULT_OPTIONS || {});
    const { pruneHulls, autoInstance } = await import(pathToFileURL(join(ROOT, 'src/core/kit.js')).href);
    g.position.set(1, 0.1, 2); g.rotation.y = 0.4;
    pruneHulls(g, 0.16);
    autoInstance(g, { min: 4 });
    g.traverse(() => n++);
  } catch (e) {
    rows.push([f, 0, 0, 'ERR ' + e.message.slice(0, 40)]);
    continue;
  }
  const ms = performance.now() - t0;
  total += n;
  rows.push([f, ms, n, '']);
}
rows.sort((a, b) => b[2] - a[2]);
console.log('asset'.padEnd(38) + 'objects'.padStart(9) + '  ms');
for (const [f, ms, n, err] of rows.slice(0, 22)) console.log(f.padEnd(38) + String(n).padStart(9) + String(ms.toFixed(0)).padStart(8) + ' ' + err);
console.log('\n单实例合计对象数:', total);
console.log('按清单重复实例估算(×1.35):', Math.round(total * 1.35));
