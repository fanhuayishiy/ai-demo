// 离线资产体检：node tools/asset-boxes.mjs —— 不依赖浏览器，逐资产打印世界无关的局部包围盒与网格数
// 用途：核对原点是否落在底面（minY≈0）、尺寸是否真实、是否为空壳、是否超量。
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';

const ROOT = process.cwd();
const DIR = join(ROOT, 'src', 'assets');

function walk(d, out = []) {
  if (!existsSync(d)) return out;
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(DIR).sort();
const rows = [];
for (const f of files) {
  const rel = relative(join(ROOT, 'src'), f).replace(/\\/g, '/');
  try {
    const m = await import(pathToFileURL(f).href);
    if (typeof m.build !== 'function') continue;
    const g = m.build(m.DEFAULT_OPTIONS || {});
    g.updateMatrixWorld(true);
    let meshes = 0, hulls = 0, tris = 0, nan = 0;
    g.traverse((n) => {
      if (!n.isMesh) return;
      meshes++;
      if (n.userData?.isHull) hulls++;
      const p = n.geometry?.attributes?.position;
      if (p) tris += (n.geometry.index ? n.geometry.index.count : p.count) / 3;
      if (!isFinite(n.position.x + n.position.y + n.position.z)) nan++;
    });
    const bb = new THREE.Box3().setFromObject(g);
    const s = bb.getSize(new THREE.Vector3());
    rows.push({
      file: rel,
      mesh: meshes,
      hull: hulls,
      ktris: +(tris / 1000).toFixed(1),
      w: +s.x.toFixed(2),
      h: +s.y.toFixed(2),
      d: +s.z.toFixed(2),
      minY: +bb.min.y.toFixed(3),
      maxY: +bb.max.y.toFixed(2),
      nan,
      real: m.meta?.real ? m.meta.real.join('/') : '',
    });
  } catch (e) {
    rows.push({ file: rel, error: (e.message || String(e)).split('\n')[0] });
  }
}

const pad = (v, n) => String(v).padEnd(n);
console.log(pad('file', 44) + pad('mesh', 6) + pad('ktri', 6) + pad('W×H×D', 18) + pad('minY', 8) + 'note');
for (const r of rows) {
  if (r.error) {
    console.log(pad(r.file, 44) + 'ERROR: ' + r.error);
    continue;
  }
  const notes = [];
  if (r.mesh < 4) notes.push('过于简陋');
  if (r.nan) notes.push(`NaN×${r.nan}`);
  if (r.minY < -0.08) notes.push('陷入地面');
  if (r.minY > 0.3) notes.push('悬浮(检查是否壁挂件)');
  if (r.w > 20 || r.d > 20 || r.h > 12) notes.push('尺度异常');
  console.log(
    pad(r.file, 44) + pad(r.mesh, 6) + pad(r.ktris, 6) + pad(`${r.w}×${r.h}×${r.d}`, 18) + pad(r.minY, 8) + notes.join(' / '),
  );
}
const ok = rows.filter((r) => !r.error);
console.log(`\n合计 ${rows.length} 个资产，网格 ${ok.reduce((a, r) => a + r.mesh, 0)}，三角面 ${(ok.reduce((a, r) => a + r.ktris, 0)).toFixed(0)}k，问题 ${rows.filter((r) => r.error).length} 个`);
