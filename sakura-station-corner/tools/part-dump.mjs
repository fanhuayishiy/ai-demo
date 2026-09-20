// 逐个零件解剖：把某个资产里每个 Mesh 的材质/贴图/透明度/alphaTest 打出来。
// 用途：画面上一块「不该存在的矩形」时，光看包围盒没用 —— 要的是它到底是谁、
// 用哪张贴图、alpha 怎么设的。inspect.mjs 只到资产级，这个到零件级。
// node tools/part-dump.mjs [--url=] [--name=sign-speed] [--match=前缀] [--max=40]
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const NAME = arg('name', '');
const MATCH = arg('match', '');
const MAX = Number(arg('max', 40));

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 640, height: 400 } })).newPage();
page.setDefaultTimeout(300000);
await page.goto(arg('url', 'http://127.0.0.1:4173/'), { waitUntil: 'commit' });
await page.waitForFunction('window.__DIORAMA__ && window.__DIORAMA__.built === true', { polling: 300, timeout: 300000 });

const rows = await page.evaluate(({ NAME, MATCH, MAX }) => {
  const out = [];
  const roots = [];
  window.__DIORAMA__.scene.traverse((o) => {
    if (!o.isGroup) return;
    const n = o.name || '';
    if (NAME && n === NAME) roots.push(o);
    else if (MATCH && n.startsWith(MATCH)) roots.push(o);
  });
  if (!roots.length) return { err: '没找到资产：' + (NAME || MATCH), names: [] };
  const THREE = window.__DIORAMA__.THREE;
  const bb = new THREE.Box3();
  for (const root of roots) {
    root.traverse((m) => {
      if (!m.isMesh && !m.isInstancedMesh) return;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      bb.setFromObject(m);
      const s = bb.getSize(new THREE.Vector3());
      const t = mat && mat.map;
      out.push({
        path: (m.name || '?'),
        size: [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)],
        y: [+bb.min.y.toFixed(3), +bb.max.y.toFixed(3)],
        type: mat ? mat.type : '-',
        transparent: mat ? !!mat.transparent : false,
        opacity: mat ? +Number(mat.opacity ?? 1).toFixed(2) : 1,
        alphaTest: mat ? +Number(mat.alphaTest ?? 0).toFixed(3) : 0,
        map: t ? (t.image ? t.image.width + 'x' + t.image.height : 'no-img') : '-',
        mapKey: t && t.userData && t.userData.auditKey ? t.userData.auditKey : '',
        graphic: !!(mat && mat.userData && mat.userData.graphic),
        inst: m.isInstancedMesh ? m.count : 0,
        order: m.renderOrder || 0,
      });
    });
  }
  out.sort((a, b) => b.size[0] * b.size[1] - a.size[0] * a.size[1]);
  return { n: out.length, rows: out.slice(0, MAX) };
}, { NAME, MATCH, MAX });

if (rows.err) console.log(rows.err);
else {
  console.log(`${NAME || MATCH}：${rows.n} 个零件（按正面面积排序，最多 ${MAX}）`);
  for (const r of rows.rows) {
    console.log(
      `  ${(r.path || '-').padEnd(20)} ${JSON.stringify(r.size).padEnd(20)} y${JSON.stringify(r.y).padEnd(16)}` +
      ` ${r.type.padEnd(19)} op=${String(r.opacity).padEnd(4)} aT=${String(r.alphaTest).padEnd(5)} map=${(r.map + (r.inst ? ' x' + r.inst : '')).padEnd(14)}${r.graphic ? 'graphic ' : ''}ord=${r.order}`,
    );
  }
}
await browser.close();
