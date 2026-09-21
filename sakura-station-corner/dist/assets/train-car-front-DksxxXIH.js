import { g as grp, M as MAT, P as PAL, s as shade, T as TEX, m as mesh, b as box, h as decal, w as weather, r as rbox, H as plane, c as cyl, y as TorusGeometry, o as lathe, n as range, am as hoop, k as tubeOf, a as sph, d as coil, q as finish, J as shape, ab as Path, R as ExtrudeGeometry, N as makeCanvas, Q as toTexture, O as jpText, a6 as rr, z as rand } from './index-Dv-C_8Uh.js';

//  assets/station/train-car-front.js —— 通勤形気動車 先頭車（前面・東向き・2 両編成の 1 号車）
//  ---------------------------------------------------------------------------
//  座標系（train-car-rear.js と共通の約束）
//   ・ローカル +X = 進行方向。先頭車は東向きなので rotY 無しで +X を向く。
//   ・原点 = 車体中心。y=0 は **レール頂面（RE）基準**（=装配層で group.y = RAIL.railTop = -0.30）。
//     車輪転がり面は y = 0.045（レール頭上面 -0.258 + 3mm の遊び）。資産内に y<0 の部品は無い。
//   ・meta.real = [車体長(X), 高さ(Y), 幅(Z)] = [16.0, 3.85, 2.65]（max 幅は雨樋、max 高はクーラー）。
//   ・2 両: 先頭車中心 x = 編成中心 + (L+隙間)/2、後述車は 中心 = 編成中心 - (L+隙間)/2 かつ rotY=180。
//  ---------------------------------------------------------------------------
//  塗装は架空の社区線：クリーム車体 + テールレッド帯 + 青帯（実在社名の表記なし）

const meta = {
  id: 'train-car-front',
  real: [16.0, 3.85, 2.65],
  origin: 'car-center, y0 = rail top, forward = +X',
};
const DEFAULT_OPTIONS = { seed: 4101 };

const D2R = Math.PI / 180;
/** 凍結寸法（装配層が参照してもよい） */
const SPEC = {
  len: 16.0, width: 2.65, height: 3.85, floor: 1.13, bogiePitch: 12.1,
  gap: 0.55, wheelR: 0.14, gauge: 1.067, treadY: 0.045,
};

/* ─────────────────────────────────────────────── 形状ヘルパ（資産内自备） */
function roundPath(p, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  p.moveTo(x + rad, y);
  p.lineTo(x + w - rad, y); p.quadraticCurveTo(x + w, y, x + w, y + rad);
  p.lineTo(x + w, y + h - rad); p.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  p.lineTo(x + rad, y + h); p.quadraticCurveTo(x, y + h, x, y + h - rad);
  p.lineTo(x, y + rad); p.quadraticCurveTo(x, y, x + rad, y);
  return p;
}
/** 穴あき平板：XY 面に w×h、+Z へ th 押し出し。UV はメートル単位（ExtrudeGeometry 仕様） */
function plateGeo(w, h, holes = [], th = 0.1) {
  const s = shape((k) => {
    k.moveTo(-w / 2, -h / 2); k.lineTo(w / 2, -h / 2); k.lineTo(w / 2, h / 2); k.lineTo(-w / 2, h / 2); k.closePath();
  });
  for (const [hx, hy, hw, hh, r = 0.02] of holes) {
    const p = new Path();
    roundPath(p, hx - hw / 2, hy - hh / 2, hw, hh, r);
    s.holes.push(p);
  }
  const g = new ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 8, steps: 1 });
  g.translate(0, 0, -th / 2);
  return g;
}
/** 台形ガラス（国鉄風の 2 枚窓：上辺が短い） */
function trapGeo(w, h, taper, th, holes = []) {
  const s = shape((k) => {
    k.moveTo(-w / 2, -h / 2); k.lineTo(w / 2, -h / 2);
    k.lineTo(w / 2 - taper, h / 2); k.lineTo(-w / 2 + taper, h / 2); k.closePath();
  });
  for (const [hx, hy, hw, hh, r = 0.015] of holes) {
    const p = new Path();
    roundPath(p, hx - hw / 2, hy - hh / 2, hw, hh, r);
    s.holes.push(p);
  }
  const g = new ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 8, steps: 1 });
  g.translate(0, 0, -th / 2);
  return g;
}
/** 銘板（車番・所属線） */
function plateTex(lines) {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#4a453c'; g.lineWidth = 7; g.strokeRect(16, 16, w - 32, h - 32);
  lines.forEach((t, i) => jpText(g, t, {
    x: w / 2, y: h * (0.34 + i * 0.225), size: h * (i === 0 ? 0.21 : 0.13),
    color: i === 0 ? '#3c3830' : '#7b7364', weight: i === 0 ? 800 : 600, spacing: 3,
  }));
  for (let i = 0; i < 1100; i++) {
    g.globalAlpha = 0.03 + rnd() * 0.1;
    g.fillStyle = rnd() > 0.5 ? '#fff' : '#4a4438';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  return toTexture(cv, { repeat: 1 });
}
/** 車椅子マーク（青地・白） */
function wheelchairTex() {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h } = cv;
  g.fillStyle = PAL.trainStripe; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f4f2e8'; g.fillStyle = '#f4f2e8'; g.lineWidth = 14; g.lineCap = 'round';
  g.beginPath(); g.arc(w * 0.45, h * 0.66, h * 0.2, 0.5, 6.1); g.stroke();
  g.beginPath(); g.arc(w * 0.44, h * 0.25, h * 0.075, 0, 7); g.fill();
  g.beginPath(); g.moveTo(w * 0.44, h * 0.34); g.lineTo(w * 0.45, h * 0.55); g.lineTo(w * 0.67, h * 0.55); g.stroke();
  g.beginPath(); g.moveTo(w * 0.45, h * 0.55); g.lineTo(w * 0.62, h * 0.74); g.stroke();
  return toTexture(cv, { repeat: 1 });
}
/** LED 表示（行先・種別）：文字をドット格子に分解して点灯ムラを作る */
function ledTex(text, { cell = 52, tone = [255, 216, 152] } = {}) {
  const cv = makeCanvas(1024, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  jpText(g, text, { x: w / 2, y: h / 2, size: h * 0.54, color: '#fff', weight: 800, spacing: 12 });
  const px = g.getImageData(0, 0, w, h);
  g.fillStyle = '#0e1013'; g.fillRect(0, 0, w, h);
  for (let cy = 0; cy < h; cy += cell) {
    for (let cx = 0; cx < w; cx += cell) {
      const i = ((((cy + cell / 2) | 0) * w) + ((cx + cell / 2) | 0)) * 4;
      const lum = (px.data[i] * 0.32 + px.data[i + 1] * 0.5 + px.data[i + 2] * 0.18) / 255;
      if (lum < 0.2) continue;
      const k = Math.min(1, lum * 1.3) * (0.78 + rnd() * 0.22);
      g.fillStyle = `rgba(${tone[0]},${(tone[1] * k) | 0},${(tone[2] * k) | 0},${(0.4 + k * 0.6).toFixed(3)})`;
      rr(g, cx + 3, cy + 3, cell - 6, cell - 6, 5); g.fill();
    }
  }
  return toTexture(cv, { repeat: 1 });
}

/* ─────────────────────────────────────────────────────────────────── build */
function build(options = {}) {
  const seed = options.seed ?? 4101;
  const rnd = rand(seed);
  const S = Object.assign({}, SPEC, options.spec || {});

  /* ---------- 基本割付 ---------- */
  const HALF = S.len / 2;                 // 8.00
  const xN = HALF;            // 先端（東）/ 尾灯端（西）
  const LEN = S.len;
  const K16 = LEN / 16;                     // 寸法スケーリング（len 変更で室内・機器ピッチも連動）
  const xS0 = -(HALF - 0.15), xS1 = HALF - 0.12;   // 側板の前後端（len 16 → -7.85 / 7.88）
  const SO = 1.24;                        // 側 Plateau 外面
  const HW = S.width / 2;                 // 1.325（雨樋外側 = 車幅一杯）
  const FLOOR = S.floor;                  // 1.13
  const SKIRT = FLOOR - 0.30;             // 0.83 裾下端
  const ROOF = 3.56;                      // 屋根板頂面
  const WLO = 2.06, WHI = 2.96;           // 側窓上下
  const bandY = [1.44, 1.62];             // 青帯

  const g = grp('train-car-front');
  const xC = (xS0 + xS1) / 2, LNS = xS1 - xS0;

  /* ---------- 側面レイアウト（扉 2 箇所 + 固定窓列） ---------- */
  const doors = [{ c: xS1 - 2.62 * K16, w: 1.30 }, { c: -3.3 * K16, w: 1.30 }].sort((a, b) => a.c - b.c);
  const bays = [];
  {
    let cur = xS0;
    for (const d of doors) { bays.push([cur, d.c - d.w / 2]); cur = d.c + d.w / 2; }
    bays.push([cur, xS1]);
  }
  const winCols = bays.map(([a, b]) => {
    const span = b - a;
    const n = Math.max(1, Math.round((span - 0.2) / 1.55));
    const ww = Math.min(1.42, (span - 0.16 - (n - 1) * 0.11) / n);
    const pitch = n > 1 ? (span - ww - 0.16) / (n - 1) : 0;
    const out = [];
    for (let i = 0; i < n; i++) out.push(a + 0.08 + ww / 2 + i * (pitch || 0));
    return { xs: out, ww };
  });
  const WIN_H = WHI - WLO;

  /* ---------- 材質 ---------- */
  const mBody = MAT.metalPaint(PAL.trainBody, { worn: 0.55, uv: { repeat: [0.2, 0.2] }, spec: 0.34, specPower: 76, shadowAmt: 0.78 });
  const mBodyUp = MAT.metalPaint(shade(PAL.trainBody, 0.972), { worn: 0.85, uv: { repeat: [0.18, 0.18] }, shadowAmt: 0.84 });
  const mNose = MAT.metalPaint(shade(PAL.trainBody, 0.985), { worn: 0.62, uv: { repeat: [0.32, 0.32] } });
  const mRed = MAT.metalPaint(PAL.trainAccent, { worn: 0.85, uv: { repeat: [0.22, 0.9] }, shadowAmt: 0.86 });
  const mBlue = MAT.metalPaint(PAL.trainStripe, { worn: 0.75, uv: { repeat: [0.3, 2.2] } });
  const mSkirt = MAT.metalPaint(PAL.trainSkirt, { worn: 1.1, uv: { repeat: [0.3, 1.1] }, spec: 0.22, shadowAmt: 0.92 });
  const mRoof = MAT.metalPaint('#b6bab7', { worn: 1.3, uv: { repeat: [0.1, 0.34] }, spec: 0.26, shadowAmt: 0.9 });
  const mSash = MAT.metal('#8f9497', { worn: 0.75, dir: 'h', uv: { repeat: [0.5, 0.5] } });
  const mGutter = MAT.galvanized({ uv: { repeat: [0.12, 1.4] }, spec: 0.36 });
  const mSteel = MAT.metal('#9aa0a3', { worn: 0.8, uv: { repeat: [0.6, 0.6] } });
  const mDark = MAT.darkIron({ uv: { repeat: [0.6, 0.6] } });
  const mWheel = MAT.darkIron({ spec: 0.44, worn: 1.15, uv: { repeat: [0.35, 0.35] } });
  const mTread = MAT.metal('#c4c8ca', { worn: 0.2, spec: 0.88, specPower: 200, uv: { repeat: [0.3, 0.3] } });
  const mRubber = MAT.rubber('#26282c', { steps: 2 });
  const mRubberOld = MAT.rubber('#423d36', { steps: 2 });
  const mGlass = MAT.glass({ color: PAL.glassTint, transmission: 0.9, thickness: 0.018, roughness: 0.05 });
  const mGreen = MAT.glass({ color: '#a6c9c3', transmission: 0.82, thickness: 0.024, roughness: 0.06, attenuation: '#77ada4', attenuationDistance: 1.2 });
  const mLite = MAT.glassLite({ color: '#7fa8a0', opacity: 0.5 });
  const mInner = MAT.paint('#cfc8b6', { map: TEX.paper({ base: '#cfc8b6' }).map, spec: 0.05, shadowAmt: 0.95, steps: 2 });
  const mSeat = MAT.fabric({ color: '#5d6c7a', repeat: 6 });
  const mSeat2 = MAT.fabric({ color: '#6d5f6e', repeat: 6 });

  /* ══════════════════════════════════════════ 床組（下から見上げる部分） */
  const ufr = grp('underframe');
  g.add(ufr);
  ufr.add(mesh(box(LNS, 0.09, 2.30), mSkirt, { pos: [xC, FLOOR - 0.055, 0], name: 'floor-plate' }));
  for (const sz of [-1, 1]) ufr.add(mesh(box(LNS, 0.17, 0.08), mSkirt, { pos: [xC, FLOOR - 0.16, sz * (SO - 0.14)], name: 'side-sill' }));
  for (let i = 0; i < 8; i++) {
    const x = xS0 + 0.5 + i * (LNS - 0.9) / 7;
    ufr.add(mesh(box(0.1, 0.15, 2.26), mSkirt, { pos: [x, FLOOR - 0.17, 0], name: 'cross-bearer' }));
  }

  /* ══════════════════════════════════════════ 側板（窓帯で分割） */
  const side = grp('side-skin');
  g.add(side);
  for (const sz of [-1, 1]) {
    const z = sz * (SO - 0.025);
    for (const [a, b] of bays) {
      const w = b - a;
      if (w < 0.15) continue;
      side.add(mesh(box(w, WLO - 1.06, 0.05), mBody, { pos: [(a + b) / 2, (1.06 + WLO) / 2, z], name: 'plate-below-window' }));
      side.add(mesh(box(w, 3.32 - WHI, 0.05), mBodyUp, { pos: [(a + b) / 2, (WHI + 3.32) / 2, z], name: 'plate-above-window' }));
    }
    // 窓下・窓上の通しリブ（一枚板に見せない）
    for (const y of [WLO - 0.045, WHI + 0.05]) side.add(mesh(box(LNS - 0.05, 0.05, 0.022), mSash, { pos: [xC, y, z + sz * 0.036] }));
  }

  /* ══════════════════════════════════════════ 窓（サッシ・ガラス・緑辺り） */
  const win = grp('side-windows');
  g.add(win);
  for (const sz of [-1, 1]) {
    const z = sz * (SO - 0.025);
    bays.forEach(([a, b], bi) => {
      const { xs, ww } = winCols[bi];
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const w = grp('window', { pos: [x, (WLO + WHI) / 2, z] });
        w.add(mesh(plateGeo(ww, WIN_H, [[0, 0, ww - 0.08, WIN_H - 0.08, 0.028]], 0.055), mSash, { pos: [0, 0, sz * 0.008], rot: [0, sz > 0 ? 0 : Math.PI, 0], name: 'window-frame' }));
        w.add(mesh(box(ww - 0.09, WIN_H - 0.09, 0.014), mGlass, { pos: [0, 0, -sz * 0.004], name: 'glass-side', cast: false }));
        // 上昇窓の留め（下枠）+ 緑辺り（frit）
        w.add(mesh(box(ww - 0.09, 0.026, 0.03), mSash, { pos: [0, -WIN_H / 2 + 0.075, sz * 0.03] }));
        w.add(mesh(box(ww - 0.09, 0.045, 0.016), MAT.paint('#2f3d3a', { steps: 2, spec: 0.08, shadowAmt: 0.95 }), { pos: [0, WIN_H / 2 - 0.045, sz * 0.016], cast: false }));
        win.add(w);
        // 窓柱
        if (i < xs.length - 1) {
          win.add(mesh(box(0.1, WIN_H + 0.05, 0.055), mSash, { pos: [(x + xs[i + 1]) / 2, (WLO + WHI) / 2, z + sz * 0.01] }));
        }
      }
      win.add(mesh(box(0.075, WIN_H + 0.06, 0.05), mSash, { pos: [a + 0.035, (WLO + WHI) / 2, z + sz * 0.012] }));
      win.add(mesh(box(0.075, WIN_H + 0.06, 0.05), mSash, { pos: [b - 0.035, (WLO + WHI) / 2, z + sz * 0.012] }));
    });
  }
  // 車体広告帯（窓下、6mm 張り出し）
  {
    const adW = 3.5, adH = 0.30;
    for (const sz of [-1, 1]) {
      const p = grp('ad-panel', { pos: [0.9 * K16, 1.86, sz * (SO + 0.006)] });
      p.add(mesh(box(adW, adH, 0.012), mBody, { name: 'ad-base' }));
      decal(p, {
        map: TEX.adStrip({ text: '春の桜まつり 4/5', sub: '桜ヶ丘駅 徒歩3分', bg: '#f2efe2', fg: '#4a4033', seed: seed + 3 }),
        w: adW - 0.05, h: adH - 0.04, pos: [0, 0, sz * 0.009], rot: [0, sz > 0 ? 0 : Math.PI, 0], order: 1,
      });
      weather(p, { w: adW * 0.5, h: adH * 0.8, pos: [-0.95, 0, sz * 0.01], kind: 'chip', color: '#e8e3d2', opacity: 0.55, seed: seed + 41, density: 1.6, spread: 0.004 });
      g.add(p);
    }
  }
  // 車椅子マーク標札（前扉寄り）
  {
    const t = wheelchairTex();
    for (const sz of [-1, 1]) {
      const c = grp('wheelchair-mark', { pos: [doors[0].c - 0.98, 1.24, sz * (SO + 0.005)] });
      c.add(mesh(rbox(0.19, 0.19, 0.012, 0.006, 2), mBody, { name: 'wc-plate' }));
      decal(c, { map: t, w: 0.155, h: 0.155, pos: [0, 0, sz * 0.009], rot: [0, sz > 0 ? 0 : Math.PI, 0], order: 1 });
      g.add(c);
    }
  }

  /* ══════════════════════════════════════════ 扉（片側 2 箇所・2 枚引戸） */
  for (const sz of [-1, 1]) {
    for (const d of doors) {
      const z = sz * (SO + 0.03);
      const dr = grp('door', { pos: [d.c, 0, z] });
      g.add(dr);
      dr.add(mesh(box(d.w + 0.14, 1.94, 0.028), mSash, { pos: [0, 2.0, -sz * 0.055], name: 'door-opening' }));   // 開口まわり（奥）
      const leaf = d.w / 2 - 0.014;
      for (const s of [-1, 1]) {
        dr.add(mesh(rbox(leaf, 1.9, 0.05, 0.012, 2), mBody, { pos: [s * (leaf / 2 + 0.007), 2.0, 0], name: 'door-leaf' }));
        dr.add(mesh(box(leaf - 0.05, 0.018, 0.014), mSash, { pos: [s * (leaf / 2 + 0.007), 1.28, sz * 0.03] }));
        dr.add(mesh(box(0.03, 0.02, 0.05), mSteel, { pos: [s * (leaf / 2 + 0.007), 2.93, sz * 0.006] }));
      }
      // 扉窓
      dr.add(mesh(plateGeo(d.w - 0.14, 0.84, [[0, 0, d.w - 0.26, 0.68, 0.028]], 0.022), mSash, { pos: [0, 2.44, sz * 0.03], rot: [0, sz > 0 ? 0 : Math.PI, 0] }));
      dr.add(mesh(box(d.w - 0.27, 0.69, 0.014), mGlass, { pos: [0, 2.44, sz * 0.014], name: 'glass-door', cast: false }));
      dr.add(mesh(box(d.w - 0.28, 0.13, 0.01), mLite, { pos: [0, 2.12, sz * 0.026], cast: false }));
      // 戸当たりゴム・帯・ステップ・点検蓋
      for (const s of [-1, 1]) dr.add(mesh(box(0.024, 1.9, 0.03), mRubber, { pos: [s * (d.w / 2 + 0.022), 2.0, -sz * 0.02] }));
      dr.add(mesh(box(d.w - 0.02, bandY[1] - bandY[0], 0.018), mBlue, { pos: [0, (bandY[0] + bandY[1]) / 2, sz * 0.036] }));
      // 側面方向幕（前扉のみ・LED）
      if (d === doors[1]) {
        const sd = grp('side-destination', { pos: [0, 3.06, sz * 0.03] });
        sd.add(mesh(rbox(d.w - 0.24, 0.14, 0.03, 0.008, 2), mDark, { name: 'side-box' }));
        sd.add(mesh(plane(d.w - 0.3, 0.1), MAT.lampShade({ map: ledTex('桜ヶ丘', { cell: 62 }), color: '#ffe2b6', emissive: '#ffbb62', emissiveIntensity: 0.9 }), { pos: [0, 0, sz * 0.018], rot: [0, sz > 0 ? 0 : Math.PI, 0], name: 'side-dest-face', cast: false }));
        dr.add(sd);
      }
      dr.add(mesh(box(d.w - 0.06, 0.055, 0.26), mDark, { pos: [0, SKIRT - 0.045, -sz * 0.19], name: 'door-step' }));
      for (let k = 0; k < 5; k++) dr.add(mesh(box(d.w - 0.16, 0.014, 0.018), mSash, { pos: [0, SKIRT - 0.015, -sz * (0.13 - k * 0.032)], cast: false }));
      weather(dr, { w: 0.55, h: 0.3, pos: [0.12, 1.14, sz * 0.042], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'rust', color: PAL.rust, opacity: 0.4, seed: seed + Math.round(d.c * 10) + (sz + 1) * 5, density: 1.4, spread: 0.05 });
    }
  }

  /* ══════════════════════════════════════════ 屋根・雨樋 */
  const roof = grp('roof');
  g.add(roof);
  roof.add(mesh(rbox(LNS + 0.05, 0.10, 2.08, 0.05, 2), mRoof, { pos: [xC, ROOF - 0.05, 0], name: 'roof-plate' }));
  for (const sz of [-1, 1]) {
    const sh = mesh(box(LNS + 0.02, 0.05, 0.28), mRoof, { pos: [xC, 3.38, sz * 1.11], name: 'roof-shoulder' });
    sh.rotation.x = -sz * 38 * D2R;
    roof.add(sh);
    // 雨樋（車幅 2.65 を作る最外郭）＋受け
    roof.add(mesh(box(LNS - 0.02, 0.13, 0.07), mGutter, { pos: [xC, 3.25, sz * (HW - 0.035)], name: 'eave-gutter' }));
    roof.add(mesh(box(LNS - 0.02, 0.02, 0.03), mSash, { pos: [xC, 3.175, sz * (HW - 0.075)], name: 'gutter-lip' }));
    roof.add(mesh(box(LNS - 0.02, 0.022, 0.028), mGutter, { pos: [xC, 3.32, sz * (HW - 0.016)], name: 'gutter-crown' }));
    for (let i = 0; i < 15; i++) {
      const x = xS0 + 0.45 + i * (LNS - 0.85) / 14;
      roof.add(mesh(box(0.05, 0.05, 0.14), mSteel, { pos: [x, 3.24, sz * (SO + 0.005)], cast: false, name: 'gutter-bracket' }));
    }
    // 雨水抜き（樋から側面へ落ちる小管）
    for (let i = 0; i < 4; i++) {
      const x = xS0 + 1.4 * K16 + i * 4.0 * K16;
      roof.add(mesh(cyl(0.022, 0.022, 0.1, 8), mGutter, { pos: [x, 3.2, sz * (HW - 0.035)] }));
    }
  }
  roof.add(mesh(box(LNS - 0.1, 0.04, 2.3), mInner, { pos: [xC, ROOF - 0.20, 0], name: 'ceiling', cast: false }));
  for (const cz of [-0.56, 0.56]) {
    roof.add(mesh(box(LNS - 1.7, 0.05, 0.14), MAT.lampShade({ color: '#f7f8ea', emissive: '#e9f1ff', emissiveIntensity: 0.5 }), { pos: [xC, ROOF - 0.24, cz], name: 'car-light', cast: false }));
  }

  /* ══════════════════════════════════════════ 客室（窓越しに見える内装） */
  {
    const it = grp('interior');
    g.add(it);
    it.add(mesh(box(LNS - 0.4, 0.02, 2.24), MAT.paper({ color: '#c3bba9' }), { pos: [xC, FLOOR + 0.01, 0], cast: false, receive: false }));
    const cabX = xS1 - 1.35;
    const nSeat = Math.max(3, Math.round((cabX - (xS0 + 1.2)) / 2.0));
    const seatPitch = (cabX - 1.0 - (xS0 + 1.35)) / Math.max(1, nSeat - 1);
    for (let i = 0; i < nSeat; i++) {
      const x = xS0 + 1.35 + i * seatPitch;
      for (const sz of [-1, 1]) {
        const s = grp('seat', { pos: [x, FLOOR, sz * 0.6] });
        s.add(mesh(rbox(0.84, 0.46, 0.14, 0.05, 2), i % 3 === 1 ? mSeat2 : mSeat, { pos: [0, 0.44, sz * 0.13], cast: false }));
        s.add(mesh(rbox(0.84, 0.12, 0.44, 0.04, 2), MAT.hardPlastic('#c8c1b0', { repeat: 4 }), { pos: [0, 0.43, -sz * 0.16], cast: false }));
        it.add(s);
      }
      it.add(mesh(cyl(0.022, 0.022, 1.7, 8), mSash, { pos: [x + 1.0, FLOOR + 0.95, 0] }));       // つり革支柱
      for (const cz of [-0.36, 0.36]) {
        it.add(mesh(cyl(0.008, 0.008, 0.2, 6), mSash, { pos: [x + 1.0, FLOOR + 1.62, cz] }));
        it.add(mesh(torSafe(0.055, 0.011), mRubberOld, { pos: [x + 1.0, FLOOR + 1.5, cz], rot: [8 * D2R, 0, 0], cast: false }));
      }
    }
  }
  function torSafe(r, t) { return new TorusGeometry(r, t, 6, 12); }

  /* ══════════════════════════════════════════ 屋根上機器 */
  const rk = grp('roof-gear');
  g.add(rk);
  function louvre(parent, x, z, w, h) {
    const l = grp('louvre', { pos: [x, 0.15, z], rot: [0, 90 * D2R, 0] });
    for (let i = 0; i < 6; i++) {
      const b = mesh(box(w, 0.02, 0.05), mDark, { pos: [0, -h / 2 + 0.03 + i * (h / 6), 0] });
      b.rotation.x = 28 * D2R;
      l.add(b);
    }
    l.add(mesh(box(w + 0.04, 0.02, 0.1), mSteel, { pos: [0, h / 2, 0] }));
    parent.add(l);
  }
  for (const x of [xS1 - 3.4 * K16, xS0 + 3.9 * K16]) {
    const ac = grp('air-conditioner', { pos: [x, ROOF, 0] });
    ac.add(mesh(rbox(1.62, 0.29, 2.02, 0.045, 2), mRoof, { pos: [0, 0.145, 0], name: 'ahu-case' }));
    ac.add(mesh(box(1.66, 0.02, 2.06), mSteel, { pos: [0, 0.278, 0] }));                   // 頂版（車高 3.85 を作る）
    for (const sz of [-1, 1]) {
      ac.add(mesh(box(1.44, 0.16, 0.02), mDark, { pos: [0, 0.17, sz * 1.015] }));
      for (let i = 0; i < 9; i++) ac.add(mesh(box(0.02, 0.15, 0.02), mSteel, { pos: [-0.66 + i * 0.165, 0.17, sz * 1.026], cast: false }));
    }
    louvre(ac, 0.83, 0, 0.5, 0.18);
    weather(ac, { w: 1.3, h: 0.22, pos: [0.1, 0.06, 1.03], kind: 'rust', color: '#7d4a2c', opacity: 0.45, seed: seed + Math.round(x * 9), density: 1.7, spread: 0.03 });
    rk.add(ac);
    rk.add(mesh(cyl(0.03, 0.03, 0.26, 8), mSteel, { pos: [x + 0.62, ROOF + 0.02, -0.92] }));   // ドレン管
  }
  for (let i = 0; i < 5; i++) {
    const x = [-6.4, -2.4, 0.4, 2.4, 6.4][i] * K16;
    const v = grp('ventilator', { pos: [x, ROOF, 0] });
    v.add(mesh(cyl(0.19, 0.21, 0.08, 14), mSteel, { pos: [0, 0.04, 0] }));
    v.add(mesh(cyl(0.15, 0.15, 0.06, 14), mDark, { pos: [0, 0.105, 0] }));
    const cap = mesh(lathe([[0, 0.055], [0.125, 0.042], [0.165, 0.006], [0.17, -0.018], [0, -0.022]], 14), mRoof, { pos: [0, 0.145, 0] });
    cap.rotation.y = range(rnd, 0, 6.283);
    v.add(cap);
    v.add(hoop(0.176, 0.011, mDark, { pos: [0, 0.083, 0], rot: [90 * D2R, 0, 0] }));
    weather(v, { w: 0.28, h: 0.14, pos: [0.02, 0.02, 0.17], kind: 'rust', color: '#7a4a2e', opacity: 0.5, seed: seed + 60 + i, spread: 0.02 });
    rk.add(v);
  }
  // 無線アンテナ・避雷針・配管・碍子
  rk.add(mesh(cyl(0.05, 0.06, 0.05, 10), mSteel, { pos: [xS1 - 0.9, ROOF + 0.025, -0.42] }));
  rk.add(mesh(cyl(0.013, 0.007, 0.24, 8), mDark, { pos: [xS1 - 0.9, ROOF + 0.16, -0.42] }));
  rk.add(mesh(cyl(0.011, 0.011, 0.055, 6), mSteel, { pos: [xS1 - 0.9, ROOF + 0.07, -0.42] }));
  rk.add(mesh(cyl(0.012, 0.005, 0.28, 6), mSteel, { pos: [xS0 + 0.55, ROOF + 0.14, 0.28], name: 'lightning-rod' }));
  for (const sz of [-0.88, 0.88]) {
    rk.add(mesh(tubeOf([[xS0 + 0.7, ROOF + 0.03, sz], [xS0 + 3.4, ROOF + 0.05, sz * 0.93], [xS1 - 3.4, ROOF + 0.045, sz * 0.96], [xS1 - 1.1, ROOF + 0.03, sz * 0.88]], 0.019, 26, 7), mSteel));
  }
  for (let i = 0; i < 5; i++) {
    const x = xS0 + 1.9 * K16 + i * 2.9 * K16;
    rk.add(mesh(cyl(0.042, 0.05, 0.055, 10), mSteel, { pos: [x, ROOF + 0.028, -0.88] }));
    rk.add(mesh(cyl(0.028, 0.028, 0.05, 8), MAT.hardPlastic('#8d9188', { repeat: 5 }), { pos: [x, ROOF + 0.075, 0.88] }));
  }

  /* ══════════════════════════════════════════ 前面（驾驶室） */
  //  前端の組立面： plate-front の外側は x = 7.95、小物先端 ≤ 7.99、排障器だけ 8.00 に達する
  const nose = grp('cab');
  g.add(nose);
  const NP = { x: xN - 0.11, w: 2.42, cy: 2.13, h: 2.60 };   // 0.83 〜 3.43
  const XF = xN - 0.05;                                       // 7.95 前面外側面
  const frontHoles = [
    [-0.57, 0.73, 0.94, 0.90, 0.09], [0.57, 0.73, 0.94, 0.90, 0.09],      // 2 枚窓
    [0, -0.35, 0.74, 0.2, 0.03],                                          // 行先表示器
    [-0.62, -0.71, 0.3, 0.3, 0.14], [0.62, -0.71, 0.3, 0.3, 0.14],        // 前照灯
    [-0.9, -0.98, 0.17, 0.17, 0.03], [0.9, -0.98, 0.17, 0.17, 0.03],      // 尾灯
    [0, -1.15, 0.34, 0.2, 0.04],                                          // タイフォン
  ];
  nose.add(mesh(plateGeo(NP.w, NP.h, frontHoles, 0.12), mNose, { pos: [NP.x, NP.cy, 0], rot: [0, 90 * D2R, 0], name: 'plate-front' }));
  // 前端の隅肉（側 Plateau と前面の段を埋める）と帯の回り込み
  for (const sz of [-1, 1]) nose.add(mesh(box(0.16, 2.5, 0.03), mBody, { pos: [xN - 0.155, 2.1, sz * 1.225] }));
  nose.add(mesh(box(0.06, 1.0, 0.06), mSash, { pos: [XF - 0.025, NP.cy + 0.73, 0] }));      // センターピラー
  nose.add(mesh(box(0.03, 0.2, 2.28), mRed, { pos: [XF + 0.008, 1.06, 0] }));
  nose.add(mesh(box(0.026, 0.055, 1.72), mBlue, { pos: [XF + 0.01, 1.3, 0] }));
  // ガラス（緑辺り・指紋・拭き痕）
  for (const s of [-1, 1]) {
    const w = grp('windscreen', { pos: [XF - 0.02, NP.cy + 0.73, s * 0.57], rot: [0, 90 * D2R, 0] });
    nose.add(w);
    w.add(mesh(trapGeo(0.94, 0.9, 0.055, 0.016), mGreen, { name: 'glass-front', cast: false }));
    for (const [bw, bh, bx, by] of [[0.94, 0.045, 0, 0.43], [0.94, 0.04, 0, -0.43], [0.042, 0.9, -0.45, 0], [0.042, 0.9, 0.45, 0]]) {
      w.add(mesh(box(bw, bh, 0.006), MAT.paint('#2f3d3a', { steps: 2, spec: 0.08, shadowAmt: 0.95 }), { pos: [bx, by, 0.011], cast: false }));
    }
    weather(w, { w: 0.4, h: 0.5, pos: [0.1, -0.08, 0.012], kind: 'dirt', color: '#cfd9d3', opacity: 0.22, seed: seed + 71 + s, density: 0.9, spread: 0.02 });
    weather(w, { w: 0.22, h: 0.34, pos: [-0.19, 0.16, 0.013], kind: 'scratch', color: '#eaf0ec', opacity: 0.16, seed: seed + 81 + s, density: 0.7, spread: 0.02 });
    // 運転台側：よれよれのロールカーテン
    w.add(mesh(box(0.86, 0.24, 0.014), MAT.fabric({ color: '#d6cbb1', repeat: 7 }), { pos: [0, 0.3, -0.03], cast: false }));
  }
  // ワイパー（2 基、停止角度が違う）
  for (const s of [-1, 1]) {
    const root = grp('wiper', { pos: [XF - 0.004, 1.9, s * 0.52] });
    root.rotation.x = s * (s > 0 ? 22 : 29) * D2R;
    root.add(mesh(cyl(0.026, 0.03, 0.05, 10), mDark, { rot: [90 * D2R, 0, 0] }));
    root.add(mesh(tubeOf([[0, 0.02, 0], [0, 0.24, 0.004], [0, 0.44, 0.006]], 0.012, 12, 6), mSteel));
    root.add(mesh(box(0.016, 0.4, 0.03), mRubber, { pos: [0, 0.26, 0.018] }));
    root.add(mesh(box(0.028, 0.09, 0.026), mRubberOld, { pos: [0, 0.44, 0.018] }));
    nose.add(root);
    nose.add(mesh(cyl(0.013, 0.013, 0.026, 8), mDark, { pos: [XF + 0.006, 1.84, s * 0.52], rot: [90 * D2R, 0, 0] }));   // ウォッシャノズル
  }
  // 前照灯（HID/LED・点灯 + breathe）と尾灯
  for (const s of [-1, 1]) {
    const hl = grp('headlight', { pos: [XF - 0.035, NP.cy - 0.71, s * 0.62] });
    hl.userData.breathe = { speed: 0.34, amount: 0.09, phase: range(rnd, 0, 6.28) };
    hl.add(mesh(cyl(0.135, 0.145, 0.08, 18), mSteel, { pos: [0.01, 0, 0], rot: [0, 0, 90 * D2R], name: 'hl-body' }));
    hl.add(mesh(cyl(0.113, 0.113, 0.018, 18), MAT.lampShade({ color: '#fdfbf2', emissive: '#fff3d4', emissiveIntensity: 1.45 }), { pos: [0.055, 0, 0], rot: [0, 0, 90 * D2R], name: 'hl-lens', cast: false }));
    hl.add(hoop(0.14, 0.013, mDark, { pos: [0.042, 0, 0], rot: [0, 90 * D2R, 0] }));
    boltRing(hl, { r: 0.115, count: 5, mat: mDark, x: -0.026 });
    weather(hl, { w: 0.15, h: 0.15, pos: [0.049, -0.06, 0], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#bfb48c', opacity: 0.4, seed: seed + 95 + s, spread: 0.008 });
    nose.add(hl);
    // 尾灯
    const tl = grp('taillight', { pos: [XF - 0.02, NP.cy - 0.98, s * 0.9] });
    tl.add(mesh(rbox(0.05, 0.19, 0.19, 0.02, 2), mSteel, { name: 'tl-case' }));
    tl.add(mesh(cyl(0.056, 0.056, 0.02, 14), MAT.lampShade({ color: '#e8a49c', emissive: '#e2685e', emissiveIntensity: 0.95 }), { pos: [0.028, 0, 0], rot: [0, 0, 90 * D2R], name: 'tl-lens', cast: false }));
    nose.add(tl);
  }
  function boltRing(parent, { r, count, mat, x, size = 0.011 }) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 6.283 + 0.4;
      parent.add(mesh(cyl(size, size, 0.014, 6), mat, { pos: [x, Math.sin(a) * r, Math.cos(a) * r], rot: [0, 0, 90 * D2R] }));
    }
  }
  // 行先表示器（LED・種別/行先）
  {
    const d = grp('destination', { pos: [XF - 0.02, NP.cy - 0.35, 0] });
    d.add(mesh(rbox(0.05, 0.205, 0.74, 0.008, 2), mDark, { pos: [0.01, 0, 0] }));
    d.add(mesh(plane(0.7, 0.172), MAT.lampShade({ map: TEX.lightPanel({ text: '普通  桜ヶ丘', mode: 'led', bg: '#111418', fg: '#ffd7a0' }), color: '#ffe2b6', emissive: '#ffbb62', emissiveIntensity: 1.05 }), {
      pos: [0.038, 0, 0], rot: [0, 90 * D2R, 0], name: 'dest-face', cast: false,
    }));
    d.add(mesh(box(0.018, 0.19, 0.014), MAT.paint('#191b1e', { steps: 2, shadowAmt: 1 }), { pos: [0.038, 0, 0.086], cast: false }));
    nose.add(d);
  }
  // タイフォン（汽笛・2 口）
  {
    const tf = grp('typhoon', { pos: [XF - 0.13, NP.cy - 1.15, 0] });
    tf.add(mesh(cyl(0.16, 0.17, 0.06, 14), mSteel, { rot: [0, 0, 90 * D2R] }));
    for (const s of [-1, 1]) {
      tf.add(mesh(cyl(0.048, 0.052, 0.1, 10), mDark, { pos: [0.07, 0, s * 0.072], rot: [0, 0, 90 * D2R] }));
      tf.add(mesh(new TorusGeometry(0.056, 0.009, 6, 14), mSteel, { pos: [0.118, 0, s * 0.072], rot: [0, 90 * D2R, 0] }));
    }
    nose.add(tf);
  }
  // 排障器（スキッド）— 先端だけ x = 8.00 に接する
  {
    const p = grp('pilot', { pos: [xN - 0.26, 0, 0] });
    p.add(mesh(rbox(0.52, 0.52, 2.3, 0.03, 2), MAT.metalPaint('#4c5055', { worn: 1.3, uv: { repeat: [0.35, 0.35] } }), { pos: [0, 0.272, 0], name: 'snowplough' }));
    p.add(mesh(box(0.04, 0.5, 2.32), mRed, { pos: [0.235, 0.262, 0] }));
    for (const sz of [-1, 1]) {
      p.add(mesh(box(0.44, 0.42, 0.045), mSkirt, { pos: [0, 0.28, sz * 1.15] }));
      p.add(mesh(tubeOf([[0.14, 0.5, sz * 1.1], [0, 0.62, sz * 1.14], [-0.2, 0.66, sz * 1.14]], 0.022, 12, 6), mSteel));
    }
    for (let i = 0; i < 5; i++) p.add(mesh(box(0.48, 0.022, 0.045), mDark, { pos: [0, 0.09 + i * 0.1, 0], cast: false }));
    weather(p, { w: 0.46, h: 0.44, pos: [0.262, 0.28, 0.45], rot: [0, 90 * D2R, 0], kind: 'rust', color: '#7b4526', opacity: 0.55, seed: seed + 101, density: 2, spread: 0.06 });
    weather(p, { w: 0.46, h: 0.4, pos: [0.262, 0.2, -0.6], rot: [0, -90 * D2R, 0], kind: 'dirt', color: '#5b5344', opacity: 0.5, seed: seed + 102, density: 1.8, spread: 0.06 });
    nose.add(p);
  }
  // 運転台（前面ガラス越しに見える器械台）
  {
    const cab = grp('cab-interior', { pos: [xN - 0.72, FLOOR, 0] });
    cab.add(mesh(rbox(0.6, 0.86, 1.9, 0.04, 2), mInner, { pos: [0, 0.5, 0], cast: false }));                       // 運転卓
    cab.add(mesh(box(0.5, 0.05, 1.8), MAT.hardPlastic('#3f4650', { repeat: 4 }), { pos: [0.06, 0.93, 0], cast: false }));
    for (let i = 0; i < 5; i++) cab.add(mesh(cyl(0.028, 0.03, 0.06, 10), MAT.hardPlastic('#6c737b', { repeat: 4 }), { pos: [0.13, 0.97, -0.6 + i * 0.3], rot: [90 * D2R, 0, 0], cast: false }));
    cab.add(mesh(cyl(0.05, 0.05, 0.34, 10), mDark, { pos: [-0.06, 0.52, 0.62], name: 'master-controller' }));       // 主幹制御器
    cab.add(mesh(cyl(0.03, 0.03, 0.3, 10), mDark, { pos: [-0.06, 0.52, 0.4] }));                                   // 制動機把手
    cab.add(mesh(sph(0.04, 10, 8), MAT.hardPlastic('#b8bcb4', { repeat: 4 }), { pos: [-0.06, 0.7, 0.62] }));
    cab.add(mesh(box(0.05, 1.5, 1.2), mInner, { pos: [-0.5, 0.76, -0.62], cast: false }));                          // 仕切壁
    cab.add(mesh(rbox(0.03, 0.36, 0.36, 0.02, 2), mSash, { pos: [-0.52, 1.12, -0.62], cast: false }));              // 仕切窓
    cab.add(mesh(cyl(0.09, 0.09, 0.025, 16), MAT.paint('#f2efe2', { steps: 2, spec: 0.3 }), { pos: [0, 1.5, -0.4], rot: [0, 90 * D2R, 0], cast: false }));   // 車内時計
    g.add(cab);
  }

  /* ══════════════════════════════════════════ 妻面（連結面・西向き） */
  //  plate-tail の外側は x = -7.93。幌枠・尾灯・渡り板・連結器は -7.99 を越えない。
  const tail = grp('gangway');
  g.add(tail);
  const XT = -7.88;                                  // 妻板中心
  const TH = { w: 2.42, h: 2.66, cy: SKIRT + 1.33 };
  const tailHoles = [
    [0, 0.3, 1.0, 1.5, 0.05],
    [-0.86, 1.0, 0.28, 0.28, 0.03], [0.86, 1.0, 0.28, 0.28, 0.03],
    [-0.56, -0.28, 0.3, 0.26, 0.03], [0.56, -0.28, 0.3, 0.26, 0.03],
  ];
  tail.add(mesh(plateGeo(TH.w, TH.h, tailHoles, 0.1), mNose, { pos: [XT, TH.cy, 0], rot: [0, -90 * D2R, 0], name: 'plate-tail' }));
  tail.add(mesh(box(0.026, 0.2, 2.3), mRed, { pos: [XT - 0.062, 1.06, 0] }));
  // 幌（ゴム蛇腹）＋アルミ枠
  {
    const gf = grp('bend', { pos: [XT - 0.02, TH.cy + 0.3, 0] });
    for (const sz of [-1, 1]) gf.add(mesh(box(0.08, 1.62, 0.1), mSash, { pos: [0, 0, sz * 0.55] }));
    gf.add(mesh(box(0.08, 0.1, 1.2), mSash, { pos: [0, 0.81, 0] }));
    gf.add(mesh(box(0.08, 0.1, 1.2), mSash, { pos: [0, -0.81, 0] }));
    gf.add(mesh(box(0.055, 1.5, 1.06), mRubber, { pos: [-0.03, 0, 0] }));
    // 貫通扉（半開き・窓・解錠レバー）
    const gd = grp('gangway-door', { pos: [-0.055, 0, 0.26], rot: [0, 0, 0] });
    gd.add(mesh(rbox(0.04, 1.44, 0.5, 0.014, 2), mNose, { name: 'gangway-leaf' }));
    gd.add(mesh(plateGeo(0.36, 0.46, [[0, 0, 0.28, 0.36, 0.03]], 0.018), mSash, { pos: [-5e-3, 0.4, 0.024], rot: [0, -90 * D2R, 0] }));
    gd.add(mesh(box(0.012, 0.37, 0.29), mGlass, { pos: [-0.02, 0.4, 0.024], cast: false }));
    gd.add(mesh(cyl(0.012, 0.012, 0.3, 8), mSteel, { pos: [0.004, -0.1, -0.16], rot: [0, 0, 4 * D2R] }));      // 解錠レバー
    gd.add(mesh(box(0.02, 0.05, 0.03), mDark, { pos: [0.004, 0.06, -0.17], cast: false }));
    gf.add(gd);
    for (let i = 0; i < 3; i++) gf.add(mesh(box(0.018, 1.5 - i * 0.06, 1.06 - i * 0.08), mRubberOld, { pos: [-0.052 - i * 0.015, 0, 0], cast: false }));
    tail.add(gf);
  }
  // 尾灯（貫通扉の両端・連結面）
  for (const s of [-1, 1]) {
    const tl = grp('tail-lamp', { pos: [XT - 0.075, TH.cy + 1.0, s * 0.86] });
    tl.add(mesh(rbox(0.045, 0.26, 0.26, 0.02, 2), mSteel, { name: 'tail-case' }));
    tl.add(mesh(cyl(0.07, 0.07, 0.02, 14), MAT.lampShade({ color: '#e8a49c', emissive: '#e2685e', emissiveIntensity: 1.0 }), { pos: [-0.028, 0, 0], rot: [0, 0, 90 * D2R], name: 'tail-lens', cast: false }));
    tail.add(tl);
  }
  // ジャンプ栓（2 系）＋ ケーブル
  for (const s of [-1, 1]) {
    const y = TH.cy - 0.28;
    tail.add(mesh(cyl(0.072, 0.078, 0.05, 12), mDark, { pos: [XT - 0.038, y, s * 0.56], rot: [0, 0, 90 * D2R] }));
    tail.add(mesh(cyl(0.05, 0.05, 0.07, 12), mSteel, { pos: [XT - 0.075, y, s * 0.56], rot: [0, 0, 90 * D2R] }));
    tail.add(mesh(tubeOf([[XT - 0.06, y, s * 0.56], [XT - 0.082, y - 0.16, s * 0.46], [XT - 0.06, y - 0.4, s * 0.3]], 0.024, 12, 7), mRubber));
  }
  // 渡り板・手すり・跳ばし板
  {
    const wk = grp('walkway');
    wk.add(mesh(rbox(0.3, 0.04, 0.66, 0.01, 2), mDark, { pos: [-7.84, SKIRT - 0.06, 0], name: 'walk-board' }));
    for (let i = 0; i < 5; i++) wk.add(mesh(box(0.02, 0.02, 0.62), mSteel, { pos: [-7.95 + i * 0.055, SKIRT - 0.036, 0], cast: false }));
    for (const sz of [-1, 1]) {
      wk.add(mesh(cyl(0.017, 0.017, 0.84, 8), mSteel, { pos: [-7.96, SKIRT + 0.36, sz * 0.31] }));
      wk.add(mesh(cyl(0.017, 0.017, 0.84, 8), mSteel, { pos: [-7.72, SKIRT + 0.36, sz * 0.31] }));
      wk.add(mesh(box(0.24, 0.024, 0.024), mSteel, { pos: [-7.84, SKIRT + 0.78, sz * 0.31] }));
      wk.add(mesh(box(0.24, 0.018, 0.018), mSteel, { pos: [-7.84, SKIRT + 0.45, sz * 0.31] }));
    }
    wk.add(mesh(box(0.05, 0.36, 0.18), mDark, { pos: [-7.885, SKIRT - 0.26, 0.22], rot: [0, 0, 5 * D2R] }));   // 折り畳みの跳ばし板
    tail.add(wk);
  }
  // 連結器（達磨形）＋ エアホース 2 本
  {
    const cu = grp('coupler', { pos: [XT - 0.005, 0.94, 0] });
    cu.add(mesh(box(0.18, 0.22, 0.36), mDark, { pos: [0.02, 0, 0], name: 'coupler-stalk' }));
    cu.add(mesh(cyl(0.085, 0.085, 0.12, 12), mWheel, { pos: [-0.05, 0, 0], rot: [0, 0, 90 * D2R], name: 'coupler-head' }));
    cu.add(mesh(rbox(0.12, 0.28, 0.12, 0.02, 2), mDark, { pos: [-0.05, 0.07, 0] }));
    cu.add(mesh(cyl(0.03, 0.03, 0.07, 10), mSteel, { pos: [0.06, 0.13, 0], rot: [0, 0, 90 * D2R] }));
    cu.add(mesh(box(0.3, 0.06, 0.44), mSkirt, { pos: [0.08, -0.16, 0] }));
    tail.add(cu);
    for (const s of [-1, 1]) {
      tail.add(mesh(tubeOf([[XT - 0.015, 0.9, s * 0.3], [XT - 0.042, 0.74, s * 0.27], [XT - 0.028, 0.56, s * 0.2]], 0.024, 12, 7), mRubber));
      tail.add(mesh(cyl(0.032, 0.032, 0.045, 10), mSteel, { pos: [XT - 0.03, 0.9, s * 0.3], rot: [0, 0, 90 * D2R] }));
    }
  }
  decal(tail, { map: plateTex(['キハ 40-1', '春日社区線 定員 62 人']), w: 0.42, h: 0.21, pos: [XT - 0.052, 2.86, -0.62], rot: [0, -90 * D2R, 0], order: 2 });

  /* ══════════════════════════════════════════ 裾・帯・泥よけ */
  const skirt = grp('skirts');
  g.add(skirt);
  for (const sz of [-1, 1]) {
    const z = sz * (SO - 0.055);
    skirt.add(mesh(box(LNS - 0.05, 0.24, 0.045), mSkirt, { pos: [xC, SKIRT + 0.12, z], name: 'skirt-panel' }));
    for (let i = 0; i < 9; i++) {
      const x = xS0 + 0.55 + i * (LNS - 1.0) / 8;
      skirt.add(mesh(box(0.055, 0.21, 0.03), mSteel, { pos: [x, SKIRT + 0.11, sz * (SO - 0.026)], cast: false, name: 'skid-angle' }));
    }
    // 泥跳ね（台車の後方に流れついた泥）
    for (const bx of [-S.bogiePitch / 2, S.bogiePitch / 2]) {
      weather(skirt, { w: 1.3 * K16, h: 0.3, pos: [bx - 0.9 * K16, SKIRT + 0.16, sz * (SO - 0.006)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'dirt', color: '#5f5642', opacity: 0.5, seed: seed + 120 + Math.round(bx), density: 1.9, spread: 0.05 });
    }
  }
  for (const sz of [-1, 1]) {
    skirt.add(mesh(box(LNS - 0.05, bandY[1] - bandY[0], 0.024), mBlue, { pos: [xC, (bandY[0] + bandY[1]) / 2, sz * (SO + 0.012)] }));
    skirt.add(mesh(box(LNS - 0.05, 0.05, 0.022), mRed, { pos: [xC, bandY[1] + 0.03, sz * (SO + 0.011)] }));
    skirt.add(mesh(box(LNS - 0.05, 0.05, 0.022), mRed, { pos: [xC, bandY[0] - 0.03, sz * (SO + 0.011)] }));
  }
  // 床下機器（制御器・タンク・COMP・抵抗器・配管）
  {
    const uf = grp('underfloor');
    g.add(uf);
    const yB = 0.58, yT = SKIRT - 0.01;
    uf.add(mesh(rbox(2.5 * K16, yT - yB, 0.94, 0.03, 2), mSkirt, { pos: [-0.6 * K16, (yB + yT) / 2, 0], name: 'uf-controller' }));
    uf.add(mesh(rbox(1.4, yT - yB - 0.06, 0.7, 0.03, 2), mDark, { pos: [2.4 * K16, (yB + 0.03 + yT) / 2, -0.2], name: 'uf-inverter' }));
    uf.add(mesh(cyl(0.185, 0.185, 1.7 * K16, 14), mSteel, { pos: [3.4 * K16, 0.78, 0.36], rot: [0, 0, 90 * D2R], name: 'air-reservoir' }));
    for (const s of [-1, 1]) uf.add(mesh(cyl(0.19, 0.19, 0.04, 14), mDark, { pos: [(3.4 + s * 0.87) * K16, 0.78, 0.36], rot: [0, 0, 90 * D2R] }));
    uf.add(mesh(rbox(0.9, 0.26, 0.58, 0.03, 2), mDark, { pos: [-3.1 * K16, 0.71, -0.28], name: 'compressor' }));
    uf.add(mesh(cyl(0.13, 0.13, 0.6, 12), mSteel, { pos: [-3.1 * K16, 0.99, -0.28], rot: [0, 0, 90 * D2R] }));
    const res = grp('resistor-box', { pos: [-4.5 * K16, (yB + yT) / 2, 0.18] });
    res.add(mesh(box(1.05, yT - yB, 0.48), mSkirt, {}));
    for (let i = 0; i < 11; i++) res.add(mesh(box(0.028, yT - yB - 0.06, 0.5), mDark, { pos: [-0.5 + i * 0.1, 0, 0], cast: false }));
    uf.add(res);
    for (const [sz, yy] of [[-1, 0.74], [1, 0.7]]) {
      uf.add(mesh(tubeOf([[xS0 + 0.2, yy, sz * 0.92], [-3.6 * K16, yy + 0.02, sz * 1.0], [0.4 * K16, yy - 0.01, sz * 1.02], [4.8 * K16, yy + 0.02, sz * 0.94]], 0.024, 24, 7), mSteel));
    }
    for (const x of [-1.4, 2.7, 4.4].map((v) => v * K16)) {
      uf.add(mesh(cyl(0.02, 0.02, 0.12, 8), mDark, { pos: [x, 0.53, 0.56] }));
      weather(uf, { w: 0.14, h: 0.4, pos: [x + 0.02, 0.62, 0.585], kind: 'rust', color: '#79462a', opacity: 0.5, seed: seed + Math.round(x * 97), spread: 0.03 });
    }
  }

  /* ══════════════════════════════════════════ 台車（2 基・車輪/軸箱/コイルばね/ブレーキ） */
  const BP = Math.min(S.bogiePitch, LEN - 3.9);
  for (const bx of [-BP / 2, BP / 2]) g.add(bogie(bx, bx > 0));
  function bogie(bx, motor) {
    const b = grp(bx > 0 ? 'bogie-east' : 'bogie-west', { pos: [bx, 0, 0] });
    const hg = S.gauge / 2, axY = S.treadY + S.wheelR, axles = [-0.55, 0.55];
    for (const ax of axles) {
      for (const sz of [-1, 1]) {
        b.add(mesh(cyl(S.wheelR, S.wheelR, 0.05, 22), mTread, { pos: [ax, axY, sz * hg], name: 'wheel-tread' }));
        b.add(mesh(cyl(S.wheelR - 0.014, S.wheelR - 0.014, 0.075, 20), mWheel, { pos: [ax, axY, sz * (hg - 0.055)] }));
        b.add(mesh(cyl(0.116, 0.121, 0.03, 20), mWheel, { pos: [ax, 0.045 + 0.116, sz * 0.452], name: 'wheel-flange' }));
        b.add(hoop(S.wheelR - 0.055, 0.009, mSteel, { pos: [ax, axY, sz * 0.505], rot: [90 * D2R, 0, 0] }));
        // 軸箱と軸ばね
        b.add(mesh(rbox(0.115, 0.135, 0.075, 0.02, 2), mWheel, { pos: [ax, axY + 0.015, sz * 0.598], name: 'journal-box' }));
        b.add(mesh(cyl(0.024, 0.024, 0.24, 8), mSteel, { pos: [ax, axY + 0.18, sz * 0.598] }));
        b.add(mesh(coil(0.05, 0.19, 5, 12, 0.013), mSteel, { pos: [ax, axY + 0.29, sz * 0.598] }));
        b.add(mesh(box(0.14, 0.035, 0.13), mDark, { pos: [ax, axY + 0.40, sz * 0.598] }));
      }
      b.add(mesh(cyl(0.042, 0.042, 0.86, 12), mSteel, { pos: [ax, axY, 0], rot: [90 * D2R, 0, 0], name: 'axle' }));
    }
    // 台車枠
    for (const sz of [-1, 1]) {
      b.add(mesh(rbox(1.86, 0.38, 0.09, 0.035, 2), mWheel, { pos: [0, 0.48, sz * 0.685], name: 'bogie-frame-side' }));
      b.add(mesh(box(1.6, 0.055, 0.1), mWheel, { pos: [0, 0.665, sz * 0.685] }));
      b.add(mesh(cyl(0.03, 0.03, 0.1, 8), mSteel, { pos: [0.8, 0.55, sz * 0.685], rot: [90 * D2R, 0, 0] }));
    }
    b.add(mesh(box(0.36, 0.2, 1.3), mWheel, { pos: [0, 0.58, 0], name: 'bogie-bolster' }));
    b.add(mesh(cyl(0.08, 0.09, 0.18, 12), mDark, { pos: [0, 0.73, 0], name: 'center-plate' }));
    b.add(hoop(0.13, 0.02, mSteel, { pos: [0, 0.685, 0], rot: [90 * D2R, 0, 0] }));
    b.add(mesh(tubeOf([[-0.42, 0.72, 0], [-0.1, 0.63, 0], [0.35, 0.6, 0]], 0.026, 12, 6), mSteel));   // 牽引装置
    // ブレーキ（シリンダ・てこ・踏鉄）
    b.add(mesh(cyl(0.058, 0.058, 0.36, 12), mDark, { pos: [-0.66, 0.34, 0], rot: [0, 0, 90 * D2R], name: 'brake-cylinder' }));
    b.add(mesh(box(0.1, 0.06, 0.06), mSteel, { pos: [-0.88, 0.34, 0] }));
    for (const sz of [-1, 1]) {
      b.add(mesh(box(0.86, 0.032, 0.032), mSteel, { pos: [0.05, 0.25, sz * 0.585] }));
      b.add(mesh(box(0.05, 0.16, 0.032), mSteel, { pos: [0.48, 0.29, sz * 0.585] }));
      b.add(mesh(box(0.05, 0.2, 0.13), mDark, { pos: [-0.5, 0.29, sz * 0.585] }));
      b.add(mesh(box(0.1, 0.14, 0.055), mWheel, { pos: [0.55, 0.24, sz * 0.575], name: 'brake-beam' }));
    }
    // 主電動機 / 防音カバー
    if (motor) {
      b.add(mesh(rbox(0.66, 0.36, 0.52, 0.035, 2), mSkirt, { pos: [0.24, 0.38, 0], name: 'gear-cover' }));
      b.add(mesh(cyl(0.135, 0.135, 0.42, 14), mDark, { pos: [0.24, 0.44, 0.36], rot: [90 * D2R, 0, 0], name: 'motor' }));
      b.add(mesh(cyl(0.1, 0.1, 0.16, 12), mSteel, { pos: [0.24, 0.44, 0.6], rot: [90 * D2R, 0, 0] }));
      for (let i = 0; i < 7; i++) b.add(mesh(box(0.56, 0.02, 0.03), mSkirt, { pos: [0.24, 0.24 + i * 0.05, 0.262], cast: false }));
    } else {
      b.add(mesh(rbox(0.52, 0.2, 0.42, 0.028, 2), mSkirt, { pos: [0.28, 0.42, 0] }));
    }
    // 台車廻りの泥・錆
    weather(b, { w: 1.4, h: 0.4, pos: [0, 0.36, 0.72], kind: 'dirt', color: '#57503f', opacity: 0.5, seed: seed + Math.round(bx * 11), density: 1.8, spread: 0.06 });
    weather(b, { w: 1.15, h: 0.38, pos: [0.1, 0.3, -0.72], rot: [0, Math.PI, 0], kind: 'rust', color: '#6f4526', opacity: 0.45, seed: seed + Math.round(bx * 23), density: 1.5, spread: 0.06 });
    return b;
  }

  /* ══════════════════════════════════════════ 経年（錆・ゴム劣化・帯剥がれ・除去跡・打ち跡） */
  for (let i = 0; i < 14; i++) {
    const sz = i % 2 ? 1 : -1;
    weather(g, {
      w: range(rnd, 0.5, 1.8), h: range(rnd, 0.16, 0.4),
      pos: [range(rnd, xS0 + 0.3, xS1 - 0.3), range(rnd, 0.9, 1.45), sz * (SO + 0.013)],
      rot: [0, sz > 0 ? 0 : Math.PI, 0],
      kind: i % 3 === 0 ? 'chip' : 'rust', color: i % 3 === 0 ? shade(PAL.trainBody, 1.14) : '#7c4a2b',
      opacity: range(rnd, 0.22, 0.48), seed: seed + 200 + i, density: 1.6, spread: 0.04,
    });
  }
  for (let i = 0; i < 6; i++) {
    const sz = i % 2 ? 1 : -1;
    weather(g, { w: 1.2, h: 0.2, pos: [range(rnd, xS0 + 1, xS1 - 1), (bandY[0] + bandY[1]) / 2, sz * (SO + 0.028)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'chip', color: '#e0dac9', opacity: 0.6, seed: seed + 320 + i, density: 1.4, spread: 0.02 });
  }
  for (const sz of [-1, 1]) {
    bays.forEach((_, bi) => {
      for (const x of winCols[bi].xs) {
        weather(g, { w: winCols[bi].ww * 0.72, h: WIN_H * 0.74, pos: [x, (WLO + WHI) / 2, sz * (SO + 0.004)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'dirt', color: '#918d81', opacity: 0.34, seed: seed + 400 + bi * 11 + (sz + 1) * 3 + Math.round(x), density: 0.9, spread: 0.008 });
      }
    });
  }
  // 落書きを洗い流した跡（薄く残る文字の輪郭）
  for (const [x0, sz] of [[-6.5, 1], [0.3, -1], [5.2, 1]]) {
    const x = x0 * K16;
    decal(g, {
      map: TEX.wear({ kind: 'scratch', color: '#f2eee2', seed: seed + Math.round(x * 13), density: 0.7 }),
      w: 0.85, h: 0.46, pos: [x, 1.9, sz * (SO + 0.014)], rot: [0, sz > 0 ? 0 : Math.PI, 0], opacity: 0.5, order: 2,
    });
  }
  // 板金打ち跡（叩き直した浅い盛り上がり＋パテ、肌は周囲より一亮度）
  for (let i = 0; i < 14; i++) {
    const sz = i % 2 ? 1 : -1;
    const rr0 = range(rnd, 0.05, 0.1);
    g.add(mesh(sph(rr0, 10, 8), i % 4 === 0 ? mBodyUp : mBody, {
      pos: [range(rnd, xS0 + 0.4, xS1 - 0.4), range(rnd, 1.1, 3.2), sz * (SO - rr0 * 0.07)],
      rot: [0, 0, 0], scale: [1, 0.86, 0.16], cast: false,
    }));
  }
  // 屋根の錆・鳥糞・前面の飛び石
  weather(g, { w: 5.2, h: 1.1, pos: [0, ROOF + 0.052, 0.25], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8a6040', opacity: 0.3, seed: seed + 520, density: 1.5, spread: 0.16 });
  weather(g, { w: 2.6, h: 0.8, pos: [-2.1, ROOF + 0.053, -0.5], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#f0ead9', opacity: 0.4, seed: seed + 530, density: 1.1 });
  weather(g, { w: 1.6, h: 0.5, pos: [XF + 0.036, 1.02, 0], rot: [0, 90 * D2R, 0], kind: 'dirt', color: '#6b5f4b', opacity: 0.45, seed: seed + 540, density: 1.6, spread: 0.012 });
  weather(g, { w: 0.9, h: 0.34, pos: [XF + 0.036, 2.5, 0.5], rot: [0, 90 * D2R, 0], kind: 'chip', color: shade(PAL.trainBody, 1.1), opacity: 0.28, seed: seed + 545, density: 1.2, spread: 0.012 });

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { DEFAULT_OPTIONS, SPEC, build, build as default, meta };
