import { z as rand, g as grp, ac as Box3, V as Vector3, m as mesh, k as tubeOf, n as range, c as cyl, b as box, a as sph, U as circ, r as rbox, x as PlaneGeometry, w as weather, M as MAT, ae as SphereGeometry, t as tor, S as Shape, K as extrude, ag as CylinderGeometry, D as DoubleSide, J as shape, af as BoxGeometry, H as plane, o as lathe, ah as ConeGeometry, Y as memo, N as makeCanvas, Q as toTexture } from './index-CSUFndW_.js';

//  assets/products/deli-tray.js —— デリ・総菜トレー 6 variant
//  salad サラダ（葉の重なり・ドレッシング）・karaage 唐揚げ（衣の凹凸・檸檬・油跡）
//  hamburgu ハンバーグ（ソースの光沢と垂れ）・edamame 枝豆（さや・塩）・sushi-roll 巻寿司（裏巻き）
//  potato ポテサラ（裏ごしの筋・きゅうり・人参花）
//  構成：PP トレイ（フチ・内底）・LAP（ラップ＝透明フィルム＋シーム）・値札シール
//  options: { seed, scale, variant, tint, pack }
//  原点 = 底面中心 / +Y 上 / 正面 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'deli-tray',
  real: [0.15, 0.045, 0.11],
  origin: 'bottom-center',
  variants: ['salad', 'karaage', 'hamburgu', 'edamame', 'sushi-roll', 'potato'],
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };
const coneGeo = (r, h) => new ConeGeometry(r, h, 8);
const TW = 0.134, TD = 0.094;    // トレイ基準（envelope 150×45×110 内）

/* -------------------------------- 局所テクチャ -------------------------------- */
/** ラップフィルムのシワ・高光 */
const wrapTex = () => memo('dt:wrap', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 66; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.32;
    g.strokeStyle = '#ffffff'; g.lineWidth = 1 + rnd() * 5;
    const x = rnd() * w, y = rnd() * h, a = rnd() * 3.14, l = 40 + rnd() * 160;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 34, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});
/** トレイ紙（ドライングペーパー）のレース縁 */
const paperTex = () => memo('dt:paper', () => {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, '#faf5e9');
  g.globalAlpha = 0.5; g.strokeStyle = '#e4d9bf'; g.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const y = (i / 40) * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 4); g.stroke(); }
  g.globalAlpha = 1;
  // 油の滲み
  for (let i = 0; i < 9; i++) {
    const x = rnd() * w, y = rnd() * h, r = 12 + rnd() * 38;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(196,164,104,0.5)'); gr.addColorStop(1, 'rgba(196,164,104,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.284); g.fill();
  }
  return toTexture(cv, { repeat: 1 });
});
function fillCv(g, w, h, c) { g.fillStyle = c; g.fillRect(0, 0, w, h); }
/** 値札シール（総菜棚のプライス＋バーコード） */
const labelTex = (name, price, tone) => memo(`dt:label:${name}${price}`, () => {
  const cv = makeCanvas(256, 160);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  fillCv(g, w, h, '#fffdf4');
  g.fillStyle = tone; g.fillRect(0, 0, w, h * 0.22);
  g.fillStyle = '#fff'; g.font = '800 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('デリカ', w / 2, h * 0.11);
  g.fillStyle = '#2c2a26'; g.font = '800 40px sans-serif'; g.fillText(name, w / 2, h * 0.42);
  g.font = '800 46px sans-serif'; g.fillStyle = '#c0392b'; g.fillText(`${price}円`, w * 0.68, h * 0.72);
  g.font = '700 18px sans-serif'; g.fillStyle = '#6b6a64'; g.textAlign = 'left'; g.fillText('税抜', w * 0.1, h * 0.7);
  g.fillStyle = '#1a1a1a';
  for (let i = 0; i < 26; i++) g.fillRect(w * 0.1 + i * (w * 0.26 / 26), h * 0.84, rnd() > 0.5 ? 3 : 1.4, h * 0.11);
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
  return toTexture(cv, { repeat: 1 });
});

/* ------------------------------ マテリアル ------------------------------ */
function mats(o) {
  const t = { tint: o.tint };
  return {
    tray: MAT.hardPlastic('#2f3339', { repeat: 5, spec: 0.42, specPower: 66, shadowAmt: 0.72, ...t }),
    trayLight: MAT.hardPlastic('#dfe3e2', { repeat: 5, spec: 0.4, specPower: 60, shadowAmt: 0.72, ...t }),
    wrap: MAT.glassLite({ color: '#eef6f7', opacity: 0.19, map: wrapTex(), side: DoubleSide, depthWrite: false }),
    paper: MAT.paper({ color: '#fbf6ea', map: paperTex(), spec: 0.05, shadowAmt: 0.82, ...t }),
    // 食材
    leaf: (c) => MAT.food({ color: c, map: undefined, spec: 0.55, specPower: 40, specCut: 0.2, sheen: 0.14, shadowAmt: 0.6, side: DoubleSide, steps: 4, ...t }),
    leafDeep: (c) => MAT.food({ color: c, spec: 0.45, specPower: 30, sheen: 0.1, shadowAmt: 0.68, side: DoubleSide, ...t }),
    tomato: MAT.food({ color: '#d5472f', spec: 0.92, specPower: 150, specCut: 0.08, sheen: 0.24, shadowAmt: 0.55, ...t }),
    tomatoIn: MAT.food({ color: '#e8735a', spec: 0.8, specPower: 110, shadowAmt: 0.6, ...t }),
    cucumber: MAT.food({ color: '#89bd6c', spec: 0.85, specPower: 130, ...t }),
    cucumberIn: MAT.rice({ color: '#e7f0d8', spec: 0.6, specPower: 60 }),
    eggWhite: MAT.rice({ color: '#faf7ee', spec: 0.62, specPower: 60, shadowAmt: 0.55, ...t }),
    eggYolk: MAT.food({ color: '#eaa93a', spec: 0.6, specPower: 34, shadowAmt: 0.6, ...t }),
    corn: MAT.food({ color: '#f2c74a', spec: 0.8, specPower: 110, ...t }),
    ham: MAT.food({ color: '#dc9a9a', spec: 0.55, specPower: 50, ...t }),
    dressing: MAT.water({ color: '#d8b25c', opacity: 0.68, spec: 1, specPower: 260, scroll: [0.004, 0.003] }),
    batter: (c) => MAT.food({ color: c, spec: 0.5, specPower: 26, specCut: 0.28, sheen: 0.08, shadowAmt: 0.7, steps: 4, ...t }),
    batterDeep: (c) => MAT.food({ color: c, spec: 0.36, specPower: 18, shadowAmt: 0.82, ...t }),
    lemon: MAT.food({ color: '#e8cc4a', spec: 0.75, specPower: 100, ...t }),
    lemonIn: MAT.food({ color: '#f4e9a8', spec: 0.6, specPower: 60 }),
    meat: (c) => MAT.food({ color: c, spec: 0.46, specPower: 24, specCut: 0.34, sheen: 0.08, shadowAmt: 0.72, steps: 4, ...t }),
    grill: MAT.food({ color: '#5b3620', spec: 0.6, specPower: 44, shadowAmt: 0.85, ...t }),
    sauce: MAT.food({ color: '#4a2415', spec: 1.0, specPower: 190, specCut: 0.06, sheen: 0.32, shadowAmt: 0.48, ...t }),
    mash: MAT.rice({ color: '#f2e3b4', spec: 0.42, specPower: 26, shadowAmt: 0.66, ...t }),
    pod: (c) => MAT.food({ color: c, spec: 0.7, specPower: 70, specCut: 0.16, sheen: 0.16, shadowAmt: 0.6, steps: 4, ...t }),
    rice: MAT.rice({ color: '#fbf8f0', spec: 0.58, specPower: 44, specCut: 0.18, sheen: 0.16, shadowAmt: 0.55, ...t }),
    nori: MAT.nori({ color: '#2b3527', spec: 0.62, specPower: 60, specCut: 0.14 }),
    salmon: MAT.food({ color: '#e78a5f', spec: 0.8, specPower: 110, ...t }),
    tuna: MAT.food({ color: '#b03a45', spec: 0.82, specPower: 120, ...t }),
    avocado: MAT.food({ color: '#8ea85a', spec: 0.6, specPower: 60, ...t }),
    wasabi: MAT.food({ color: '#8fbf5f', spec: 0.5, specPower: 30, ...t }),
    ginger: MAT.food({ color: '#f2b7c4', spec: 0.55, specPower: 40, side: DoubleSide, ...t }),
    salt: MAT.paint('#fdfdf6', { spec: 0.5, specPower: 120, steps: 2 }),
    sesame: MAT.paint('#211d18', { spec: 0.5, specPower: 90, steps: 2 }),
    parsely: MAT.food({ color: '#4f8a45', spec: 0.5, specPower: 40, side: DoubleSide, ...t }),
    oil: MAT.water({ color: '#c9a15c', opacity: 0.4, spec: 1, specPower: 240 }),
    potatoSalad: MAT.food({ color: '#f4e7bd', spec: 0.55, specPower: 34, specCut: 0.24, sheen: 0.12, shadowAmt: 0.6, ...t }),
    mayo: MAT.food({ color: '#fbf3dd', spec: 0.9, specPower: 170, specCut: 0.08, transparent: true, opacity: 0.9 }),
    carrot: MAT.food({ color: '#e0813c', spec: 0.7, specPower: 80, ...t }),
  };
}

/* -------------------------------- 成形ヘルパー -------------------------------- */
/** 有機 blob（唐揚げ・ミート・さや等）：球頂点変位＋底を平らに */
function blob(rx, ry, rz, amp, seed, flat = 1, ws = 18, hs = 12) {
  const g = new SphereGeometry(1, ws, hs);
  const p = g.attributes.position; const v = new Vector3();
  const rnd = rand(seed);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const k = 1 + (Math.sin(n.x * 8.1 + n.z * 5.3) * 0.42 + Math.sin(n.y * 9.7 - n.x * 4.1) * 0.36 + (rnd() - 0.5) * 0.7) * amp;
    let y = n.y;
    if (flat && y < 0) y = -Math.pow(-y, 0.5);
    p.setXYZ(i, n.x * k * rx, y * k * ry, n.z * k * rz);
  }
  p.needsUpdate = true; g.computeVertexNormals();
  return g;
}
/** 葉（うねった plane） */
function leafGeo(len, wid, crinkle, seed) {
  const g = new PlaneGeometry(len, wid, 9, 7);
  const p = g.attributes.position; const v = new Vector3();
  const rnd = rand(seed);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const tx = v.x / (len / 2), ty = v.y / (wid / 2);
    // 先へ行くほど窄まる葉の輪郭
    const taper = 1 - 0.55 * Math.pow(Math.max(0, tx), 2.1) - 0.2 * Math.pow(Math.abs(ty), 3);
    // 中央脈を軸にカール
    const z = crinkle * (Math.sin(ty * 3.1) * 0.5 + (1 - tx) * 0.5) + Math.sin(ty * 9 + tx * 4) * crinkle * 0.18;
    p.setXYZ(i, v.x, v.y * taper, z + (rnd() - 0.5) * crinkle * 0.08);
  }
  p.needsUpdate = true;
  g.rotateX(-Math.PI / 2);            // 葉を水平（XZ 面）に寝かせる → Mesh の Y 回転でスピン出来る
  g.computeVertexNormals();
  return g;
}
/** PP トレイ（外殻＝押出＋内底・フチのロール） */
function deliTray(parent, M, { w, d, h, mat, floor, y = 0, round = 0.012 }) {
  const T = grp('tray'); parent.add(T);
  const sh = shape((s) => {
    const hw = w / 2, hd = d / 2;
    s.moveTo(-hw + round, -hd);
    s.lineTo(hw - round, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + round);
    s.lineTo(hw, hd - round); s.quadraticCurveTo(hw, hd, hw - round, hd);
    s.lineTo(-hw + round, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - round);
    s.lineTo(-hw, -hd + round); s.quadraticCurveTo(-hw, -hd, -hw + round, -hd);
  });
  // 外側（ややテーパー）＋内側の凹み（bevel 込みで y ∈ [0, h+2bt] に収める）
  const bt = 0.0026;
  const outer = extrude(sh, { depth: h, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.004, bevelSegments: 2, curveSegments: 8, steps: 1 });
  outer.translate(0, 0, bt);
  outer.rotateX(-Math.PI / 2);
  T.add(mesh(outer, mat, { pos: [0, y, 0], name: 'tray-shell' }));
  // 内底（食品が载る面：外周より一段上＝側肉を見せる）
  const inner = extrude(sh, { depth: 0.0024, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.006, bevelSegments: 1, curveSegments: 8, steps: 1 });
  inner.rotateX(-Math.PI / 2);
  T.add(noHull(mesh(inner, floor || mat, { pos: [0, y + h - 0.0022, 0], cast: false, receive: false })));
  // フチのroll（周回 4 本）
  for (const [ox, oz, sx, sz] of [[0, -d / 2, w, 0.0032], [0, d / 2, w, 0.0032], [-w / 2, 0, 0.0032, d], [w / 2, 0, 0.0032, d]]) {
    T.add(noHull(mesh(rbox(sx, 0.0022, sz, 0.001, 2), mat, { pos: [ox, y + h + bt * 2 + 0.0006, oz], cast: false })));
  }
  return T;
}
/** ラップ（フィルム）：上面が僅かにドーム・端はトレイ下へ回す */
function filmCover(parent, M, { w, d, h, y0, seed }) {
  const g = new BoxGeometry(w, h, d, 12, 4, 9);
  const p = g.attributes.position; const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const nx = v.x / (w / 2), nz = v.z / (d / 2);
    if (v.y > 0) {
      // 食品に添って持ち上がる中央ドーム＋シワ
      const dome = (1 - nx * nx) * (1 - nz * nz) * h * 0.22;
      const wrinkle = Math.sin(nx * 11 + nz * 7 + seed) * h * 0.05 + Math.sin(nz * 13 - nx * 5) * h * 0.04;
      p.setY(i, v.y + dome + wrinkle);
    }
    // 端で少し絞る（ラップがトレイ底に回っている）
    p.setX(i, v.x * (1 - 0.02 * Math.abs(v.y / (h / 2))));
    p.setZ(i, v.z * (1 - 0.02 * Math.abs(v.y / (h / 2))));
  }
  p.needsUpdate = true; g.computeVertexNormals();
  const msh = noHull(mesh(g, M.wrap, { pos: [0, y0 + h / 2, 0], cast: false, receive: false, renderOrder: 8, name: 'film' }));
  parent.add(msh);
  // シーム（切りっぱなしの端がめくれた 1 片）
  const peel = noHull(mesh(plane(w * 0.22, d * 0.13), M.wrap, {
    pos: [w * 0.3, y0 + h + h * 0.2 + 0.0016, -d * 0.28], rot: [-Math.PI / 2 + 0.42, 0.2, 0.2], cast: false, receive: false, renderOrder: 9,
  }));
  parent.add(peel);
  return msh;
}
/** 値札シール（ラップ上に貼る） */
function priceLabel(parent, M, { name, price, w = 0.052, h = 0.03, pos, rot = [-Math.PI / 2, 0, 0], tone = '#2f6b52' }) {
  const mm = noHull(mesh(plane(w, h), MAT.decal({ map: labelTex(name, price, tone), opacity: 0.98, order: 3 }), { pos, rot, cast: false, receive: false }));
  parent.add(mm);
  return mm;
}

/* ================================ variants ================================ */

/** サラダ：葉を 9 枚重ね＋具＋ドレッシングの溜まり */
function vSalad(P, M, rnd, o) {
  const B = grp('salad'); P.add(B);
  deliTray(B, M, { w: TW, d: TD, h: 0.012, mat: M.trayLight });
  const base = 0.012;
  // 葉（下→上、色と縮れを変える）
  const greens = ['#7fae5a', '#8fbf68', '#6f9c4c', '#a2c479', '#5f8a44', '#93bd6a'];
  for (let i = 0; i < 11; i++) {
    const len = range(rnd, 0.03, 0.044), wid = len * range(rnd, 0.5, 0.66);
    const lf = mesh(leafGeo(len, wid, range(rnd, 0.003, 0.006), (o.seed ?? 1) + i * 31),
      i % 2 ? M.leaf(greens[i % greens.length]) : M.leafDeep(greens[(i + 2) % greens.length]),
      { pos: [range(rnd, -0.03, 0.03), base - 0.0025 + (i % 4) * 0.0024, range(rnd, -0.015, 0.015)], cast: false, name: `leaf-${i}` });
    lf.rotation.set(range(rnd, -0.26, 0.26), range(rnd, 0, 6.284), range(rnd, -0.2, 0.2));
    B.add(lf);
  }
  // 具：番茄・胡瓜・玉子・コーン・ハム
  const tom = mesh(blob(0.0135, 0.012, 0.0132, 0.05, 11, 0, 16, 12), M.tomato, { pos: [-0.032, base + 0.011, 0.014], name: 'tomato' });
  B.add(tom);
  B.add(noHull(mesh(circ(0.0125, 16), M.tomatoIn, { pos: [-0.032, base + 0.0225, 0.014], rot: [-90 * D2R, 0, 0], cast: false })));
  for (const [x, z, a] of [[0.03, -0.02, 0.4], [0.044, 0.014, -0.7], [-0.01, -0.028, 1.1]]) {
    B.add(noHull(mesh(cyl(0.0108, 0.0108, 0.0026, 16), M.cucumber, { pos: [x, base + 0.0105, z], rot: [a * 0.2, a, 0], cast: false })));
    B.add(noHull(mesh(cyl(0.0084, 0.0084, 0.0028, 14), M.cucumberIn, { pos: [x, base + 0.0105, z], rot: [a * 0.2, a, 0], cast: false })));
  }
  for (const [x, z, ry] of [[0.012, 0.024, 0.3], [-0.022, -6e-3, -0.6]]) {
    // 玉子（1/4 巾切）
    const e = grp('egg'); B.add(e);
    e.position.set(x, base + 0.0095, z); e.rotation.set(0, ry, 0);
    e.add(noHull(mesh(new CylinderGeometry(0.0128, 0.0128, 0.017, 16, 1, false, 0, Math.PI / 2), M.eggWhite, { pos: [0, 0.0085, 0], rot: [90 * D2R, 0, 0], cast: false })));
    e.add(noHull(mesh(new CylinderGeometry(0.0068, 0.0068, 0.0166, 14, 1, false, 0, Math.PI / 2), M.eggYolk, { pos: [0, 0.0085, 0], rot: [90 * D2R, 0, 0], cast: false })));
  }
  for (let i = 0; i < 14; i++) {
    B.add(noHull(mesh(sph(0.0028, 7, 6), M.corn, { pos: [range(rnd, -0.05, 0.05), base + 0.009 + rnd() * 0.011, range(rnd, -0.032, 0.032)], scale: [1.3, 0.85, 1], cast: false })));
  }
  for (let i = 0; i < 4; i++) {
    const hm = noHull(mesh(box(0.016, 0.0016, 0.012), M.ham, { pos: [range(rnd, -0.05, 0.05), base + 0.0115 + i * 0.002, range(rnd, -0.03, 0.03)], rot: [range(rnd, -0.2, 0.2), rnd() * 3, 0], cast: false }));
    B.add(hm);
  }
  // ドレッシング（溜まり＋滴り＋つや）
  B.add(noHull(mesh(circ(0.019, 18), M.dressing, { pos: [0.018, base + 0.0026, -0.012], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  for (let i = 0; i < 9; i++) {
    B.add(noHull(mesh(sph(0.0016 + rnd() * 0.0022, 7, 6), M.dressing, {
      pos: [range(rnd, -0.05, 0.05), base + 0.011 + rnd() * 0.014, range(rnd, -0.032, 0.032)], scale: [1, 0.55, 1], cast: false, receive: false,
    })));
  }
  // パセリ・ defect：葉の端の茶色い劣化
  for (let i = 0; i < 3; i++) B.add(noHull(mesh(leafGeo(0.016, 0.012, 0.002, 77 + i), M.parsely, { pos: [range(rnd, -0.04, 0.04), base + 0.017, range(rnd, -0.026, 0.026)], rot: [0.14, rnd() * 3, 0.1], cast: false })));
  B.add(noHull(mesh(sph(0.006, 8, 6), MAT.food({ color: '#a08a4e', spec: 0.3, shadowAmt: 0.9 }), { pos: [0.052, base + 0.014, 0.03], scale: [1.4, 0.3, 1], cast: false })));
  filmCover(P, M, { w: TW + 0.004, d: TD + 0.004, h: 0.0315, y0: 0.0022, seed: (o.seed ?? 1) % 7 });
  priceLabel(P, M, { name: 'ミックスサラダ', price: 380, pos: [-TW * 0.2, 0.0424, -TD * 0.12], rot: [-Math.PI / 2, 0, 0.06] });
}

/** 唐揚げ：衣の凹凸・檸檬・パセリ・油の滲み */
function vKaraage(P, M, rnd, o) {
  const B = grp('karaage'); P.add(B);
  deliTray(B, M, { w: TW, d: TD, h: 0.012, mat: M.tray });
  B.add(noHull(mesh(rbox(TW - 0.014, 0.0016, TD - 0.014, 0.004, 2), M.paper, { pos: [0, 0.0116, 0], cast: false })));
  const base = 0.0132;
  const n = Math.max(3, Math.min(8, o.pack ?? 5));
  const spot = [[-0.036, 0.011], [-7e-3, 0.021], [0.024, 0.005], [-0.022, -0.013], [0.011, -0.021], [0.04, -0.01], [-0.044, -5e-3], [0.042, 0.017]];
  for (let i = 0; i < n; i++) {
    const [x, z] = spot[i % spot.length];
    const rx = range(rnd, 0.014, 0.019), ry = range(rnd, 0.010, 0.013), rz = rx * range(rnd, 0.82, 0.98);
    const k = grp(`kara-${i}`); B.add(k);
    k.position.set(x + range(rnd, -3e-3, 0.003), base + ry * 0.74, z + range(rnd, -3e-3, 0.003));
    k.rotation.set(range(rnd, -0.25, 0.25), rnd() * 6.284, range(rnd, -0.25, 0.25));
    // 衣（ガリガリ）：二重の blob で凹凸の階層を出す
    k.add(mesh(blob(rx, ry, rz, 0.11, (o.seed ?? 1) + i * 23, 1, 20, 14), M.batter('#b8763c'), { name: 'batter' }));
    k.add(noHull(mesh(blob(rx * 0.86, ry * 0.9, rz * 0.86, 0.16, (o.seed ?? 1) + i * 41, 0, 14, 10), M.batter('#c8874a'), { cast: false })));
    // 衣の破片・揚げカス（表面の粒）
    for (let j = 0; j < 5; j++) {
      const a = rnd() * 6.284, u = rnd() * 0.85;
      k.add(noHull(mesh(sph(0.0018 + rnd() * 0.0022, 6, 5), j % 2 ? M.batter('#a2652f') : M.batter('#d99a5c'), {
        pos: [Math.cos(a) * rx * u, Math.sin(Math.acos(Math.min(1, u))) * ry * 0.8, Math.sin(a) * rz * u], scale: [1.3, 0.6, 1.1], cast: false,
      })));
    }
    // 焦げた端（缺陷＝揚げ過ぎ）
    if (i === 2) k.add(noHull(mesh(sph(0.004, 8, 6), M.batterDeep('#5c3216'), { pos: [rx * 0.5, ry * 0.3, rz * 0.62], scale: [1.2, 0.4, 1], cast: false })));
  }
  // 檸檬（くし形）
  const lm = grp('lemon'); B.add(lm);
  lm.position.set(TW * 0.34, base + 0.006, -TD * 0.3);
  lm.rotation.set(-90 * D2R, 0, 0.4);
  lm.add(mesh(new CylinderGeometry(0.0165, 0.0165, 0.007, 16, 1, false, 0, Math.PI / 3), M.lemon, { pos: [0, 0, 0.0035] }));
  lm.add(noHull(mesh(new CylinderGeometry(0.0142, 0.0142, 0.0076, 14, 1, false, 0, Math.PI / 3), M.lemonIn, { pos: [0, 0, 0.0035], cast: false })));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * (Math.PI / 3) * 0.9 + 0.1;
    lm.add(noHull(mesh(box(0.0008, 0.013, 0.0078), M.eggWhite, { pos: [Math.cos(a) * 0.007, Math.sin(a) * 0.007, 0.0035], rot: [0, 0, a], cast: false })));
  }
  // パセリ・油の滲み（紙に広がる輪）
  for (let i = 0; i < 4; i++) B.add(noHull(mesh(leafGeo(0.016, 0.012, 0.0025, 91 + i), M.parsely, { pos: [range(rnd, -0.05, 0.05), base + 0.0145, range(rnd, -0.03, 0.03)], rot: [0.14, rnd() * 3, 0.1], cast: false })));
  weather(B, { w: 0.034, h: 0.03, pos: [0.02, base + 0.0004, -0.02], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#b99a5e', opacity: 0.42, seed: (o.seed ?? 1) + 13, density: 1.4, spread: 0.001 });
  filmCover(P, M, { w: TW + 0.004, d: TD + 0.004, h: 0.0315, y0: 0.0022, seed: (o.seed ?? 1) % 5 });
  priceLabel(P, M, { name: '若鶏唐揚', price: 420, pos: [-TW * 0.18, 0.0424, TD * 0.1], rot: [-Math.PI / 2, 0, -0.05] });
}

/** ハンバーグ：焼き目・デミグラスの垂れ・マッシュ・人参花 */
function vHamburgu(P, M, rnd, o) {
  const B = grp('hamburgu'); P.add(B);
  deliTray(B, M, { w: TW, d: TD, h: 0.012, mat: M.tray });
  const base = 0.0132;
  // 種肉（上面に焼きの窪み）
  const patty = grp('patty'); B.add(patty);
  patty.position.set(-TW * 0.16, base + 0.0105, 0.004);
  patty.add(mesh(blob(0.034, 0.014, 0.03, 0.05, (o.seed ?? 1) + 3, 1, 22, 14), M.meat('#8a5231'), { name: 'patty-body' }));
  // 焼き筋（グリルの焦げ 3 本）
  for (let i = 0; i < 3; i++) {
    patty.add(noHull(mesh(tubeOf([[-0.028, 0.012, -0.018 + i * 0.014], [0, 0.0158 + rnd() * 0.001, -0.018 + i * 0.014], [0.028, 0.012, -0.018 + i * 0.014]], 0.0018, 12, 5), M.grill, { cast: false })));
  }
  // デミグラスソース（上から掛けて縁を伝う）
  const src = new SphereGeometry(1, 22, 12, 0, 6.284, 0, 0.62);
  const sp = src.attributes.position; const v = new Vector3();
  for (let i = 0; i < sp.count; i++) {
    v.fromBufferAttribute(sp, i);
    const rr2 = Math.hypot(v.x, v.z);
    const drip = rr2 > 0.72 ? -0.5 - 0.7 * Math.pow((rr2 - 0.72) / 0.28, 1.6) * (0.6 + 0.6 * Math.sin(Math.atan2(v.z, v.x) * 3.2 + 1)) : 0;
    sp.setXYZ(i, v.x * 0.026, (v.y + drip) * 0.0126, v.z * 0.023);
  }
  sp.needsUpdate = true; src.computeVertexNormals();
  patty.add(mesh(src, M.sauce, { pos: [0.002, 0.0062, -1e-3], name: 'demi-glace' }));
  // 流れ出たソース（トレイ上の溜まり・垂れ筋）
  B.add(noHull(mesh(circ(0.0128, 18), M.sauce, { pos: [-TW * 0.16 + 0.03, base + 0.0008, 0.024], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  for (let i = 0; i < 3; i++) {
    B.add(noHull(mesh(sph(0.0026 + rnd() * 0.002, 7, 6), M.sauce, { pos: [-TW * 0.16 + range(rnd, -0.03, 0.04), base + 0.0012, range(rnd, -0.03, 0.03)], scale: [1.6, 0.34, 1.2], cast: false })));
  }
  // 青ネブ（輪切 4 枚）
  for (let i = 0; i < 4; i++) {
    B.add(noHull(mesh(tor(0.0028, 0.0011, 5, 12), M.pod('#7fae5a'), { pos: [-TW * 0.16 + range(rnd, -0.02, 0.02), base + 0.0185 + i * 0.0004, range(rnd, -0.016, 0.02)], rot: [-90 * D2R, 0, 0], cast: false })));
  }
  // マッシュポテト（スプーンで置いた跡）
  const msh = grp('mash'); B.add(msh);
  msh.position.set(TW * 0.27, base + 0.0045, -TD * 0.2);
  msh.add(mesh(blob(0.021, 0.011, 0.019, 0.06, 21, 1, 18, 12), M.mash, { name: 'mash' }));
  msh.add(noHull(mesh(tubeOf([[-0.012, 0.0115, 0.004], [0, 0.014, -2e-3], [0.013, 0.011, 0.003]], 0.0016, 10, 5), MAT.food({ color: '#e6d3a0', spec: 0.4 }), { cast: false })));
  // 人参（花形）・ブロッコリー 1 房
  const fl = new Shape();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * 6.284, r = 0.0075 + Math.cos(a * 5) * 0.0022;
    i ? fl.lineTo(Math.cos(a) * r, Math.sin(a) * r) : fl.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const car = extrude(fl, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1, curveSegments: 4 });
  car.rotateX(-Math.PI / 2);
  B.add(mesh(car, M.carrot, { pos: [TW * 0.24, base + 0.0115, TD * 0.22], rot: [0, 0.5, 0], name: 'carrot' }));
  const brk = grp('broccoli'); B.add(brk);
  brk.position.set(TW * 0.1, base + 0.006, TD * 0.26);
  brk.add(noHull(mesh(cyl(0.0026, 0.0032, 0.011, 8), MAT.food({ color: '#cfd8a8', spec: 0.3 }), { pos: [0, 0.002, 0], cast: false })));
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.284, u = rnd() * 0.011;
    brk.add(noHull(mesh(sph(0.0036 + rnd() * 0.0024, 7, 6), M.leafDeep('#4d7a3e'), { pos: [Math.cos(a) * u, 0.0105 + rnd() * 0.005, Math.sin(a) * u], cast: false })));
  }
  filmCover(P, M, { w: TW + 0.004, d: TD + 0.004, h: 0.0315, y0: 0.0022, seed: 3 });
  priceLabel(P, M, { name: 'ハンバーグ', price: 498, pos: [TW * 0.16, 0.0424, -TD * 0.14], rot: [-Math.PI / 2, 0, 0.08], tone: '#8a3b2c' });
}

/** 枝豆：さやの山・塩・苞の産毛 */
function vEdamame(P, M, rnd, o) {
  const B = grp('edamame'); P.add(B);
  deliTray(B, M, { w: TW, d: TD, h: 0.011, mat: M.tray });
  const base = 0.012;
  const n = Math.max(6, Math.min(20, o.pack ?? 14));
  const podGeo = (len, r, beans, seed) => {
    const pts = [];
    const N = 16;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const bulge = 1 + (beans ? Math.sin(t * Math.PI * beans) * 0.24 : 0);
      const taper = Math.sin(Math.PI * Math.min(1, Math.max(0, t)) * 0.92 + 0.16);
      pts.push([Math.max(0.0004, r * taper * bulge), t * len]);
    }
    return lathe(pts, 12);
  };
  for (let i = 0; i < n; i++) {
    const len = range(rnd, 0.032, 0.042), r = range(rnd, 0.0042, 0.0054);
    const pod = grp(`pod-${i}`); B.add(pod);
    const layer = (i / n);
    pod.position.set(range(rnd, -0.04, 0.04), base + 0.002 + (i % 3) * 0.005 + layer * 0.007, range(rnd, -0.02, 0.02));
    pod.rotation.set(Math.PI / 2 + range(rnd, -0.26, 0.26), range(rnd, -0.34, 0.34), range(rnd, -3, 3));
    const g = podGeo(len, r, 2 + ((i % 2) ? 1 : 0));
    pod.add(mesh(g, i % 4 === 3 ? M.pod('#7f9a4a') : M.pod('#8fae56'), { pos: [0, -len / 2, 0], name: 'pod' }));
    // 筋（腹縫合線）と両端の茎・苞先
    pod.add(noHull(mesh(tubeOf([[0, -len * 0.44, r * 0.96], [0, 0, r * 1.05], [0, len * 0.44, r * 0.9]], 0.0005, 10, 4), M.pod('#6b8a3e'), { pos: [0, -len / 2, 0], cast: false })));
    pod.add(noHull(mesh(cyl(0.0009, 0.0014, 0.006, 6), M.pod('#5f7a3c'), { pos: [0, -len / 2 - 0.0028, 0], rot: [0.2, 0, 0], cast: false })));
    pod.add(noHull(mesh(coneGeo(0.0016, 0.004), M.pod('#6b8a3e'), { pos: [0, len / 2 - 0.001, 0], rot: [Math.PI, 0, 0], cast: false })));
    // 産毛（3 本）
    for (let k = 0; k < 3; k++) {
      const a = rnd() * 6.284;
      pod.add(noHull(mesh(tubeOf([[Math.cos(a) * r, -len * 0.2 + k * len * 0.24, Math.sin(a) * r], [Math.cos(a) * (r + 0.0026), -len * 0.2 + k * len * 0.24 + 0.001, Math.sin(a) * (r + 0.0026)]], 0.00018, 4, 3), MAT.paper({ color: '#e8e6d0' }), { cast: false, receive: false })));
    }
  }
  // 塩の結晶
  for (let i = 0; i < 22; i++) {
    B.add(noHull(mesh(sph(0.0008 + rnd() * 0.0009, 5, 4), M.salt, { pos: [range(rnd, -0.058, 0.058), base + 0.006 + rnd() * 0.024, range(rnd, -0.038, 0.038)], cast: false, receive: false })));
  }
  // 缺陷：さやの破れ（豆が覗く）・色褪せた 1 本
  B.add(noHull(mesh(sph(0.0044, 8, 6), M.pod('#c9cf7a'), { pos: [0.03, base + 0.014, -0.02], scale: [1.2, 0.9, 1.2], cast: false })));
  weather(B, { w: 0.03, h: 0.02, pos: [-0.03, base + 0.0006, 0.02], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#8b8f6a', opacity: 0.3, seed: (o.seed ?? 1) + 17, spread: 0.001 });
  filmCover(P, M, { w: TW + 0.004, d: TD + 0.004, h: 0.0315, y0: 0.0022, seed: 5 });
  priceLabel(P, M, { name: '枝豆（たれ付）', price: 280, pos: [-TW * 0.19, 0.0424, -TD * 0.12], rot: [-Math.PI / 2, 0, -0.04], tone: '#4a7f5a' });
}

/** 巻寿司：裏巻き 6 貫＋生姜・わさび・黒胡麻 */
function vSushiRoll(P, M, rnd, o) {
  const B = grp('sushi-roll'); P.add(B);
  deliTray(B, M, { w: TW, d: TD, h: 0.011, mat: M.tray });
  const base = 0.012;
  const n = Math.max(3, Math.min(8, o.pack ?? 6));
  for (let i = 0; i < n; i++) {
    const col = i % 3, row = (i / 3) | 0;
    const x = (col - 1) * 0.04, z = row ? 0.026 : -0.024;
    const r = grp(`roll-${i}`); B.add(r);
    const R = 0.0152, hgt = 0.0205;
    r.position.set(x + range(rnd, -2e-3, 0.002), base + hgt / 2 + (row ? 0.001 : 0), z);
    r.rotation.set(range(rnd, -0.09, 0.09), rnd() * 0.6, range(rnd, -0.07, 0.07));
    // シャリ（外側）：上下に断面
    r.add(mesh(cyl(R, R * 0.97, hgt, 22), M.rice, { name: 'rice' }));
    // 天面の具（鮪・鮭・アボカド）＋のりの層
    const fillMat = [M.tuna, M.salmon, M.avocado][i % 3];
    r.add(noHull(mesh(circ(R * 0.96, 22), M.rice, { pos: [0, hgt / 2 + 0.0004, 0], rot: [-90 * D2R, 0, 0], cast: false })));
    r.add(noHull(mesh(circ(R * 0.6, 18), M.nori, { pos: [0, hgt / 2 + 0.0009, 0], rot: [-90 * D2R, 0, 0], cast: false })));
    r.add(noHull(mesh(circ(R * 0.5, 16), fillMat, { pos: [0, hgt / 2 + 0.0014, 0], rot: [-90 * D2R, 0, 0], cast: false })));
    // 具の角（中身が立方体＝切った具）
    r.add(noHull(mesh(rbox(R * 0.62, hgt * 0.8, R * 0.62, 0.0016, 2), fillMat, { pos: [0, hgt / 2 - 0.001, 0], cast: false })));
    // 黄瓜の芯・玉子片
    r.add(noHull(mesh(box(0.0034, hgt * 0.86, 0.0034), M.cucumber, { pos: [R * 0.34, 0, R * 0.1], cast: false })));
    // 底（のりの当布跡）
    r.add(noHull(mesh(circ(R * 0.98, 20), M.nori, { pos: [0, -hgt / 2 + 0.0004, 0], rot: [90 * D2R, 0, 0], cast: false, receive: false })));
    // 胡麻（上面に数粒）
    for (let k = 0; k < 4; k++) {
      const a = rnd() * 6.284, u = rnd() * R * 0.85;
      r.add(noHull(mesh(sph(0.0009, 5, 4), i % 2 ? M.sesame : M.salt, { pos: [Math.cos(a) * u, hgt / 2 + 0.0016, Math.sin(a) * u], scale: [1.5, 0.4, 1], rot: [0, a, 0], cast: false, receive: false })));
    }
  }
  // 甘酢生姜（ちぎった 3 片）・わさび・薬味の仕切り
  const ging = grp('ginger'); B.add(ging);
  ging.position.set(TW * 0.35, base + 0.0028, -TD * 0.21);
  for (let i = 0; i < 3; i++) {
    const gp = new PlaneGeometry(0.018, 0.012, 5, 4);
    const pp = gp.attributes.position; const vv = new Vector3();
    for (let k = 0; k < pp.count; k++) { vv.fromBufferAttribute(pp, k); pp.setZ(k, Math.sin(vv.x * 220) * 0.0016 + Math.cos(vv.y * 180) * 0.0012); }
    pp.needsUpdate = true; gp.computeVertexNormals();
    ging.add(noHull(mesh(gp, M.ginger, { pos: [i * 0.004 - 0.004, 0.002 + i * 0.0018, i * 0.003], rot: [0.16 + i * 0.06, 0.3 * i, 0.2 * i], cast: false })));
  }
  B.add(noHull(mesh(blob(0.0062, 0.0044, 0.0058, 0.14, 5, 1, 12, 8), M.wasabi, { pos: [TW * 0.35, base + 0.0045, TD * 0.21], cast: false })));
  // 缺陷：シャリが崩れた 1 貫・鮪の赤身が出ている
  B.add(noHull(mesh(sph(0.0054, 8, 6), M.rice, { pos: [-0.042, base + 0.0215, -0.024], scale: [1.3, 0.5, 1.2], cast: false })));
  weather(B, { w: 0.02, h: 0.014, pos: [0.01, base + 0.0006, 0.03], rot: [-90 * D2R, 0, 0], kind: 'dirt', color: '#9a8f6a', opacity: 0.24, seed: (o.seed ?? 1) + 19, spread: 0.001 });
  filmCover(P, M, { w: TW + 0.004, d: TD + 0.004, h: 0.0315, y0: 0.0022, seed: 2 });
  priceLabel(P, M, { name: '巻寿司 6 貫', price: 350, pos: [-TW * 0.16, 0.0424, TD * 0.12], rot: [-Math.PI / 2, 0, 0.05], tone: '#2f4a6b' });
}

/** ポテサラ：裏ごしの筋・具・マヨのつや */
function vPotato(P, M, rnd, o) {
  const B = grp('potato'); P.add(B);
  deliTray(B, M, { w: TW, d: TD, h: 0.012, mat: M.trayLight });
  const base = 0.0128;
  // 山（スプーンで押した平らな天面＋筋）
  const mound = blob(TW * 0.36, 0.019, TD * 0.34, 0.05, (o.seed ?? 1) + 7, 1, 26, 16);
  const mp = mound.attributes.position; const v = new Vector3();
  for (let i = 0; i < mp.count; i++) {
    v.fromBufferAttribute(mp, i);
    if (v.y > 0.0115) mp.setY(i, 0.0118 + Math.sin(v.x * 22) * 0.0011 + (rnd() - 0.5) * 0.0008);
  }
  mp.needsUpdate = true; mound.computeVertexNormals();
  B.add(mesh(mound, M.potatoSalad, { pos: [0, base + 0.0108, 0], name: 'mound' }));
  // 和え痕迹（裏ごしを押した筋 5 本）
  for (let i = 0; i < 5; i++) {
    const z = -TD * 0.24 + i * (TD * 0.12);
    B.add(noHull(mesh(tubeOf([[-TW * 0.3, base + 0.0235, z], [-TW * 0.05, base + 0.026 + Math.sin(i) * 0.001, z + 0.004], [TW * 0.3, base + 0.023, z - 0.002]], 0.002, 14, 6), M.mayo, { cast: false })));
  }
  // 具：胡瓜の輪切・ハム短冊・人参（細切り）・パセリ・コーン
  for (let i = 0; i < 4; i++) {
    const x = range(rnd, -TW * 0.3, TW * 0.3), z = range(rnd, -TD * 0.26, TD * 0.26);
    B.add(noHull(mesh(cyl(0.0088, 0.0088, 0.0024, 14), M.cucumber, { pos: [x, base + 0.0235, z], rot: [range(rnd, -0.3, 0.3), rnd() * 3, range(rnd, -0.3, 0.3)], cast: false })));
    B.add(noHull(mesh(cyl(0.0068, 0.0068, 0.0026, 12), M.cucumberIn, { pos: [x, base + 0.0235, z], rot: [0, 0, 0], cast: false })));
  }
  for (let i = 0; i < 6; i++) {
    B.add(noHull(mesh(box(0.012, 0.0018, 0.0048), M.ham, { pos: [range(rnd, -0.05, 0.05), base + 0.0245 + rnd() * 0.002, range(rnd, -0.032, 0.032)], rot: [0, rnd() * 3, 0], cast: false })));
  }
  for (let i = 0; i < 7; i++) {
    B.add(noHull(mesh(box(0.014, 0.0016, 0.0018), M.carrot, { pos: [range(rnd, -0.055, 0.055), base + 0.0255 + rnd() * 0.002, range(rnd, -0.034, 0.034)], rot: [0, rnd() * 3, range(rnd, -0.2, 0.2)], cast: false })));
  }
  for (let i = 0; i < 8; i++) {
    B.add(noHull(mesh(sph(0.0026, 6, 5), M.corn, { pos: [range(rnd, -0.05, 0.05), base + 0.0255, range(rnd, -0.03, 0.03)], scale: [1.2, 0.8, 1], cast: false })));
  }
  for (let i = 0; i < 3; i++) B.add(noHull(mesh(leafGeo(0.014, 0.01, 0.002, 131 + i), M.parsely, { pos: [range(rnd, -0.04, 0.04), base + 0.0235, range(rnd, -0.024, 0.024)], rot: [0.1, rnd() * 3, 0.08], cast: false })));
  // 缺陷：底に回った水分（マヨが分離した輪）・ポテルの欠け
  B.add(noHull(mesh(circ(0.016, 16), M.oil, { pos: [TW * 0.28, base + 0.0006, TD * 0.28], rot: [-90 * D2R, 0, 0], cast: false, receive: false })));
  B.add(noHull(mesh(sph(0.007, 8, 6), M.potatoSalad, { pos: [-TW * 0.32, base + 0.005, -TD * 0.18], scale: [1.2, 0.5, 1], cast: false })));
  filmCover(P, M, { w: TW + 0.004, d: TD + 0.004, h: 0.0315, y0: 0.0022, seed: 4 });
  priceLabel(P, M, { name: 'ポテトサラダ', price: 260, pos: [TW * 0.16, 0.0424, TD * 0.1], rot: [-Math.PI / 2, 0, -0.07], tone: '#6b5a2a' });
}

const VARIANTS = { salad: vSalad, karaage: vKaraage, hamburgu: vHamburgu, edamame: vEdamame, 'sushi-roll': vSushiRoll, potato: vPotato };
const VARIANT_LIST = Object.keys(VARIANTS);

function build(options = {}) {
  const variant = VARIANTS[options.variant] ? options.variant : 'salad';
  const seed = options.seed ?? 1;
  const rnd = rand(seed + variant.length * 19);
  const g = grp(`deli-tray:${variant}`);
  const inner = grp('body');
  g.userData.variant = variant;
  g.userData.real = meta.real;
  VARIANTS[variant](inner, mats(options), rnd, { seed, pack: options.pack, tint: options.tint });
  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

const P_DELI = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  VARIANT_LIST,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_DELI as P };
