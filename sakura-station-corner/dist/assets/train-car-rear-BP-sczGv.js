import { g as grp, M as MAT, s as shade, P as PAL, T as TEX, m as mesh, b as box, h as decal, w as weather, r as rbox, c as cyl, y as TorusGeometry, k as tubeOf, o as lathe, n as range, am as hoop, H as plane, d as coil, a as sph, q as finish, S as Shape, ab as Path, R as ExtrudeGeometry, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-C4-XtFer.js';

//  assets/station/train-car-rear.js —— 通勤形気動車 後述車（2 号車・東端が連結妻面、西端が車尾）
//  ---------------------------------------------------------------------------
//  座標系は train-car-front.js と同じ約束（資産同士の import はしない）
//   ・ローカル +X = 編成の東（=先頭車側）。+X 端が **連結妻面**、-X 端が車尾。
//   ・原点 = 車体中心、y = 0 は レール頂面（RE）。装配層で y = RAIL.railTop(-0.30)、z = RAIL.centerZ。
//   ・編成中心 cx とすると：先頭車 x = cx + (L+gap)/2、本車 x = cx - (L+gap)/2 かつ rotY = 180。
//     （rotY=180 で本車の +X = 世界 -X = 先頭車の方を向く。車番・広告の向きは 180 を前提に置く。）
//   ・meta.real = [車体長(X), 高さ(Y), 幅(Z)] = [16.0, 3.85, 2.65]
//  経年度合いは先頭車より一段古い（色褪せ・裾の錆・帯の捲れ・広告の日焼け）。

const meta = {
  id: 'train-car-rear',
  real: [16.0, 3.85, 2.65],
  origin: 'car-center, y0 = rail top, coupler end = +X',
};
const DEFAULT_OPTIONS = { seed: 5202 };

const D2R = Math.PI / 180;
const SPEC = {
  len: 16.0, width: 2.65, height: 3.85, floor: 1.13, bogiePitch: 12.1,
  gap: 0.55, wheelR: 0.14, gauge: 1.067, treadY: 0.045,
};

/* ───────────────────────────────────────────────── 形状ヘルパ（自前用意） */
function roundPath(p, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  p.moveTo(x + rad, y);
  p.lineTo(x + w - rad, y); p.quadraticCurveTo(x + w, y, x + w, y + rad);
  p.lineTo(x + w, y + h - rad); p.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  p.lineTo(x + rad, y + h); p.quadraticCurveTo(x, y + h, x, y + h - rad);
  p.lineTo(x, y + rad); p.quadraticCurveTo(x, y, x + rad, y);
  return p;
}
function plateGeo(w, h, holes = [], th = 0.1) {
  const s = new Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  for (const [hx, hy, hw, hh, r = 0.02] of holes) {
    const p = new Path();
    roundPath(p, hx - hw / 2, hy - hh / 2, hw, hh, r);
    s.holes.push(p);
  }
  const g = new ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 8, steps: 1 });
  g.translate(0, 0, -th / 2);
  return g;
}
/** 車番・行先の小銘板（日焼けした白プラ） */
function plateTex(lines) {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#e4ddcb'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#544d40'; g.lineWidth = 7; g.strokeRect(16, 16, w - 32, h - 32);
  lines.forEach((t, i) => jpText(g, t, {
    x: w / 2, y: h * (0.34 + i * 0.225), size: h * (i === 0 ? 0.21 : 0.13),
    color: i === 0 ? '#463f33' : '#84796a', weight: i === 0 ? 800 : 600, spacing: 3,
  }));
  for (let i = 0; i < 1200; i++) {
    g.globalAlpha = 0.03 + rnd() * 0.11;
    g.fillStyle = rnd() > 0.5 ? '#fff' : '#5a5241';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  return toTexture(cv, { repeat: 1 });
}
/** 後部（車尾）の尾灯表示板：赤地の「止」なし・反射材の退色 */
function tailMarkTex() {
  const cv = makeCanvas(256, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#b2493e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f2ead8'; g.fillRect(0, h * 0.42, w, h * 0.16);
  jpText(g, 'おうごん', { x: w / 2, y: h * 0.24, size: h * 0.17, color: '#f7f2e2', weight: 700, spacing: 6 });
  for (let i = 0; i < 2400; i++) {
    g.globalAlpha = 0.02 + rnd() * 0.1;
    g.fillStyle = rnd() > 0.6 ? '#fff' : '#3a2a22';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  return toTexture(cv, { repeat: 1 });
}

/* ─────────────────────────────────────────────────────────────────── build */
function build(options = {}) {
  const seed = options.seed ?? 5202;
  const rnd = rand(seed);
  const S = Object.assign({}, SPEC, options.spec || {});

  const HALF = S.len / 2;                    // 8.00（+X = 連結側 / -X = 車尾）
  const xT = -HALF;
  const xS0 = -7.87, xS1 = 7.87;             // 側板の端
  const SO = 1.24, HW = S.width / 2;
  const FLOOR = S.floor, SKIRT = FLOOR - 0.30, ROOF = 3.56;
  const WLO = 2.06, WHI = 2.96, WIN_H = WHI - WLO;
  const bandY = [1.44, 1.62];
  const xC = (xS0 + xS1) / 2, LNS = xS1 - xS0;

  const g = grp('train-car-rear');

  /* 側面割付：扉は 1 端寄り＋中央、車尾側は大きな窓帯（田舎車の 3 人掛け跨ぎ区間） */
  const doors = [{ c: -6.25, w: 1.30 }, { c: 1.15, w: 1.30 }];
  const bays = [];
  {
    let cur = xS0;
    for (const d of [...doors].sort((a, b) => a.c - b.c)) { bays.push([cur, d.c - d.w / 2]); cur = d.c + d.w / 2; }
    bays.push([cur, xS1]);
  }
  const winCols = bays.map(([a, b]) => {
    const span = b - a;
    const n = Math.max(1, Math.round((span - 0.2) / 1.55));
    const ww = Math.min(1.42, (span - 0.16 - (n - 1) * 0.11) / n);
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(a + 0.08 + ww / 2 + i * (n > 1 ? (span - 0.16 - ww) / (n - 1) : 0));
    return { xs, ww };
  });

  /* 材質（先頭車より日焼け・退色した配合） */
  const mBody = MAT.metalPaint(shade(PAL.trainBody, 1.012), { worn: 0.95, uv: { repeat: [0.2, 0.2] }, spec: 0.3, shadowAmt: 0.8 });
  const mBodyUp = MAT.metalPaint(shade(PAL.trainBody, 0.982), { worn: 1.2, uv: { repeat: [0.18, 0.18] }, shadowAmt: 0.86 });
  const mEnd = MAT.metalPaint(shade(PAL.trainBody, 0.96), { worn: 1.05, uv: { repeat: [0.3, 0.3] } });
  const mRed = MAT.metalPaint(shade(PAL.trainAccent, 0.97), { worn: 1.15, uv: { repeat: [0.22, 0.9] }, shadowAmt: 0.9 });
  const mBlue = MAT.metalPaint(shade(PAL.trainStripe, 1.04), { worn: 1.05, uv: { repeat: [0.3, 2.2] } });
  const mSkirt = MAT.metalPaint(PAL.trainSkirt, { worn: 1.35, uv: { repeat: [0.3, 1.1] }, spec: 0.2, shadowAmt: 0.94 });
  const mRoof = MAT.metalPaint('#aeb2af', { worn: 1.55, uv: { repeat: [0.1, 0.34] }, spec: 0.24, shadowAmt: 0.92 });
  const mSash = MAT.metal('#8b9093', { worn: 1.0, dir: 'h', uv: { repeat: [0.5, 0.5] } });
  const mGutter = MAT.galvanized({ uv: { repeat: [0.12, 1.4] }, spec: 0.32 });
  const mSteel = MAT.metal('#969c9f', { worn: 1.0, uv: { repeat: [0.6, 0.6] } });
  const mDark = MAT.darkIron({ uv: { repeat: [0.6, 0.6] } });
  const mWheel = MAT.darkIron({ spec: 0.4, worn: 1.35, uv: { repeat: [0.35, 0.35] } });
  const mTread = MAT.metal('#bec2c4', { worn: 0.5, spec: 0.82, specPower: 180, uv: { repeat: [0.3, 0.3] } });
  const mRubber = MAT.rubber('#2a2724', { steps: 2 });
  const mRubberOld = MAT.rubber('#494339', { steps: 2 });
  const mGlass = MAT.glass({ color: shade(PAL.glassTint, 0.985), transmission: 0.86, thickness: 0.02, roughness: 0.09 });
  const mInner = MAT.paint('#c9c1af', { map: TEX.paper({ base: '#c9c1af' }).map, spec: 0.05, shadowAmt: 0.95, steps: 2 });
  const mSeat = MAT.fabric({ color: '#67614f', repeat: 6 });
  const mSeat2 = MAT.fabric({ color: '#6d5a58', repeat: 6 });

  /* ══════════════════════════════════════════ 床組 */
  const ufr = grp('underframe');
  g.add(ufr);
  ufr.add(mesh(box(LNS, 0.09, 2.30), mSkirt, { pos: [xC, FLOOR - 0.055, 0], name: 'floor-plate' }));
  for (const sz of [-1, 1]) ufr.add(mesh(box(LNS, 0.17, 0.08), mSkirt, { pos: [xC, FLOOR - 0.16, sz * (SO - 0.14)], name: 'side-sill' }));
  for (let i = 0; i < 8; i++) {
    const x = xS0 + 0.5 + i * (LNS - 0.9) / 7;
    ufr.add(mesh(box(0.1, 0.15, 2.26), mSkirt, { pos: [x, FLOOR - 0.17, 0], name: 'cross-bearer' }));
  }

  /* ══════════════════════════════════════════ 側板 */
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
    for (const y of [WLO - 0.045, WHI + 0.05]) side.add(mesh(box(LNS - 0.05, 0.05, 0.022), mSash, { pos: [xC, y, z + sz * 0.036] }));
  }

  /* ══════════════════════════════════════════ 窓（サッシ・ガラス・広告ポスター） */
  const win = grp('side-windows');
  g.add(win);
  const posterTex = [
    TEX.poster({ title: '春の桜まつり', sub: '3/28 - 4/12  桜ヶ丘商店街', bg: '#f7efdd', accent: '#d9534f', seed: seed + 11 }),
    TEX.poster({ title: '地元の牛乳', sub: '生産者直送 毎朝のdelivery', bg: '#eef3e6', accent: '#3f8f5c', seed: seed + 12 }),
    TEX.poster({ title: '社区バザー', sub: '駅舎前 4/6 10:00〜', bg: '#f4ecf2', accent: '#7d5aa8', seed: seed + 13 }),
  ];
  for (const sz of [-1, 1]) {
    const z = sz * (SO - 0.025);
    bays.forEach(([a, b], bi) => {
      const { xs, ww } = winCols[bi];
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const w = grp('window', { pos: [x, (WLO + WHI) / 2, z] });
        w.add(mesh(plateGeo(ww, WIN_H, [[0, 0, ww - 0.08, WIN_H - 0.08, 0.028]], 0.055), mSash, { pos: [0, 0, sz * 0.008], rot: [0, sz > 0 ? 0 : Math.PI, 0], name: 'window-frame' }));
        w.add(mesh(box(ww - 0.09, WIN_H - 0.09, 0.014), mGlass, { pos: [0, 0, -sz * 0.004], name: 'glass-side', cast: false }));
        w.add(mesh(box(ww - 0.09, 0.026, 0.03), mSash, { pos: [0, -WIN_H / 2 + 0.075, sz * 0.03] }));
        // 車内側：日焼けした広告ポスター・網掛け・座席
        if ((bi === 1 && (i === 1 || i === 3)) || (bi === 2 && i === 0)) {
          w.add(mesh(box(ww - 0.14, WIN_H - 0.16, 0.008), MAT.paper({ color: '#efe8d6' }), { pos: [0, -0.02, -sz * 0.075], cast: false }));
          decal(w, { map: posterTex[(i + bi) % 3], w: ww - 0.18, h: WIN_H - 0.22, pos: [0, -0.02, -sz * 0.081], rot: [0, sz > 0 ? Math.PI : 0, 0], opacity: 0.94, order: 1 });
        }
        w.add(mesh(box(ww - 0.09, 0.045, 0.016), MAT.paint('#33403c', { steps: 2, spec: 0.08, shadowAmt: 0.95 }), { pos: [0, WIN_H / 2 - 0.045, sz * 0.016], cast: false }));
        win.add(w);
        if (i < xs.length - 1) win.add(mesh(box(0.1, WIN_H + 0.05, 0.055), mSash, { pos: [(x + xs[i + 1]) / 2, (WLO + WHI) / 2, z + sz * 0.01] }));
      }
      win.add(mesh(box(0.075, WIN_H + 0.06, 0.05), mSash, { pos: [a + 0.035, (WLO + WHI) / 2, z + sz * 0.012] }));
      win.add(mesh(box(0.075, WIN_H + 0.06, 0.05), mSash, { pos: [b - 0.035, (WLO + WHI) / 2, z + sz * 0.012] }));
    });
  }
  // 車体広告帯（2 箇所・色褪せ）
  {
    for (const [ax, aw, txt] of [[-2.6, 3.4, '桜ヶ丘 温泉 徒歩5分  送迎あり'], [4.6, 2.6, '春の交通安全運動']]) {
      for (const sz of [-1, 1]) {
        const p = grp('ad-panel', { pos: [ax, 1.86, sz * (SO + 0.006)] });
        p.add(mesh(box(aw, 0.24, 0.012), mBody, { name: 'ad-base' }));
        decal(p, { map: TEX.adStrip({ text: txt, bg: '#e7ebee', seed: seed + Math.round(ax * 7) }), w: aw - 0.05, h: 0.2, pos: [0, 0, sz * 0.009], rot: [0, sz > 0 ? 0 : Math.PI, 0], order: 1, opacity: 0.9 });
        weather(p, { w: aw * 0.6, h: 0.2, pos: [ax > 0 ? 0.4 : -0.6, 0, sz * 0.01], kind: 'chip', color: '#efe9d8', opacity: 0.6, seed: seed + Math.round(ax * 31), density: 1.9, spread: 0.004 });
        g.add(p);
      }
    }
  }

  /* ══════════════════════════════════════════ 扉（2 箇所） */
  for (const sz of [-1, 1]) {
    for (const d of doors) {
      const z = sz * (SO + 0.03);
      const dr = grp('door', { pos: [d.c, 0, z] });
      g.add(dr);
      dr.add(mesh(box(d.w + 0.14, 1.94, 0.028), mSash, { pos: [0, 2.0, -sz * 0.055], name: 'door-opening' }));
      const leaf = d.w / 2 - 0.014;
      for (const s of [-1, 1]) {
        dr.add(mesh(rbox(leaf, 1.9, 0.05, 0.012, 2), mBody, { pos: [s * (leaf / 2 + 0.007), 2.0, 0], name: 'door-leaf' }));
        dr.add(mesh(box(leaf - 0.05, 0.018, 0.014), mSash, { pos: [s * (leaf / 2 + 0.007), 1.28, sz * 0.03] }));
        dr.add(mesh(box(0.03, 0.02, 0.05), mSteel, { pos: [s * (leaf / 2 + 0.007), 2.93, sz * 0.006] }));
      }
      dr.add(mesh(plateGeo(d.w - 0.14, 0.84, [[0, 0, d.w - 0.26, 0.68, 0.028]], 0.022), mSash, { pos: [0, 2.44, sz * 0.03], rot: [0, sz > 0 ? 0 : Math.PI, 0] }));
      dr.add(mesh(box(d.w - 0.27, 0.69, 0.014), mGlass, { pos: [0, 2.44, sz * 0.014], name: 'glass-door', cast: false }));
      dr.add(mesh(box(d.w - 0.28, 0.13, 0.01), MAT.glassLite({ color: '#7b9d96', opacity: 0.55 }), { pos: [0, 2.12, sz * 0.026], cast: false }));
      for (const s of [-1, 1]) dr.add(mesh(box(0.024, 1.9, 0.03), mRubber, { pos: [s * (d.w / 2 + 0.022), 2.0, -sz * 0.02] }));
      dr.add(mesh(box(d.w - 0.02, bandY[1] - bandY[0], 0.018), mBlue, { pos: [0, (bandY[0] + bandY[1]) / 2, sz * 0.036] }));
      dr.add(mesh(box(d.w - 0.06, 0.055, 0.26), mDark, { pos: [0, SKIRT - 0.045, -sz * 0.19], name: 'door-step' }));
      for (let k = 0; k < 5; k++) dr.add(mesh(box(d.w - 0.16, 0.014, 0.018), mSash, { pos: [0, SKIRT - 0.015, -sz * (0.13 - k * 0.032)], cast: false }));
      // 戸袋の落書き除去跡・錆
      weather(dr, { w: 0.6, h: 0.4, pos: [0, 1.6, sz * 0.032], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'chip', color: '#ddd6c2', opacity: 0.5, seed: seed + Math.round(d.c * 13) + (sz + 1) * 7, density: 1.5, spread: 0.03 });
      weather(dr, { w: 0.5, h: 0.3, pos: [0.1, 1.1, sz * 0.04], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'rust', color: PAL.rust, opacity: 0.42, seed: seed + Math.round(d.c * 17) + (sz + 1) * 5, density: 1.4, spread: 0.05 });
    }
  }
  // 車椅子マーク（後扉側）
  {
    const t = TEX.signboard({ text: '車椅子', bg: PAL.trainStripe, fg: '#f4f2e8' });
    for (const sz of [-1, 1]) {
      const c = grp('wheelchair-mark', { pos: [doors[1].c + 0.92, 1.24, sz * (SO + 0.005)] });
      c.add(mesh(rbox(0.2, 0.2, 0.012, 0.006, 2), mBody, { name: 'wc-plate' }));
      decal(c, { map: t, w: 0.17, h: 0.17, pos: [0, 0, sz * 0.009], rot: [0, sz > 0 ? 0 : Math.PI, 0], order: 1, opacity: 0.9 });
      g.add(c);
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
    roof.add(mesh(box(LNS - 0.02, 0.13, 0.07), mGutter, { pos: [xC, 3.25, sz * (HW - 0.035)], name: 'eave-gutter' }));
    roof.add(mesh(box(LNS - 0.02, 0.02, 0.03), mSash, { pos: [xC, 3.175, sz * (HW - 0.075)], name: 'gutter-lip' }));
    roof.add(mesh(box(LNS - 0.02, 0.022, 0.028), mGutter, { pos: [xC, 3.32, sz * (HW - 0.016)], name: 'gutter-crown' }));
    for (let i = 0; i < 15; i++) {
      const x = xS0 + 0.45 + i * (LNS - 0.85) / 14;
      roof.add(mesh(box(0.05, 0.05, 0.14), mSteel, { pos: [x, 3.24, sz * (SO + 0.005)], cast: false, name: 'gutter-bracket' }));
    }
    for (let i = 0; i < 4; i++) roof.add(mesh(cyl(0.022, 0.022, 0.1, 8), mGutter, { pos: [xS0 + 1.4 + i * 4.0, 3.2, sz * (HW - 0.035)] }));
    // 樋の錆・落ち葉詰まり
    weather(roof, { w: 5.0, h: 0.1, pos: [xC, 3.30, sz * (HW - 0.03)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'rust', color: '#7b4a2c', opacity: 0.45, seed: seed + 21 + sz, density: 1.8, spread: 0.02 });
  }
  roof.add(mesh(box(LNS - 0.1, 0.04, 2.3), mInner, { pos: [xC, ROOF - 0.20, 0], name: 'ceiling', cast: false }));
  for (const cz of [-0.56, 0.56]) {
    roof.add(mesh(box(LNS - 1.7, 0.05, 0.14), MAT.lampShade({ color: '#f3f2e4', emissive: '#e2eaf5', emissiveIntensity: 0.38 }), { pos: [xC, ROOF - 0.24, cz], name: 'car-light', cast: false }));
  }

  /* ══════════════════════════════════════════ 客室（先頭車より簡素・座席の向きを変える） */
  {
    const it = grp('interior');
    g.add(it);
    it.add(mesh(box(LNS - 0.4, 0.02, 2.24), MAT.paper({ color: '#bdb5a2' }), { pos: [xC, FLOOR + 0.01, 0], cast: false, receive: false }));
    for (let i = 0; i < 8; i++) {
      const x = xS0 + 1.15 + i * 1.86;
      for (const sz of [-1, 1]) {
        const s = grp('seat', { pos: [x, FLOOR, sz * 0.6] });
        s.add(mesh(rbox(0.8, 0.44, 0.13, 0.05, 2), i % 2 ? mSeat : mSeat2, { pos: [0, 0.44, sz * 0.12], cast: false }));
        s.add(mesh(rbox(0.8, 0.11, 0.42, 0.04, 2), MAT.hardPlastic('#c2bba9', { repeat: 4 }), { pos: [0, 0.42, -sz * 0.15], cast: false }));
        it.add(s);
      }
      it.add(mesh(cyl(0.022, 0.022, 1.7, 8), mSash, { pos: [x + 0.93, FLOOR + 0.95, 0] }));
      for (const cz of [-0.34, 0.34]) {
        it.add(mesh(cyl(0.008, 0.008, 0.18, 6), mSash, { pos: [x + 0.93, FLOOR + 1.63, cz] }));
        it.add(mesh(new TorusGeometry(0.052, 0.01), mRubberOld, { pos: [x + 0.93, FLOOR + 1.52, cz], rot: [8 * D2R, 0, 0], cast: false }));
      }
    }
  }

  /* ══════════════════════════════════════════ 屋根上機器（1 クーラー・4 ベンチレータ・避雷器） */
  const rk = grp('roof-gear');
  g.add(rk);
  {
    const x = -1.9;
    const ac = grp('air-conditioner', { pos: [x, ROOF, 0] });
    ac.add(mesh(rbox(1.62, 0.29, 2.02, 0.045, 2), mRoof, { pos: [0, 0.145, 0], name: 'ahu-case' }));
    ac.add(mesh(box(1.66, 0.02, 2.06), mSteel, { pos: [0, 0.278, 0] }));
    for (const sz of [-1, 1]) {
      ac.add(mesh(box(1.44, 0.16, 0.02), mDark, { pos: [0, 0.17, sz * 1.015] }));
      for (let i = 0; i < 9; i++) ac.add(mesh(box(0.02, 0.15, 0.02), mSteel, { pos: [-0.66 + i * 0.165, 0.17, sz * 1.026], cast: false }));
    }
    // ぶつけた角・凹み（屋根上の段差）
    ac.add(mesh(rbox(0.26, 0.1, 0.42, 0.05, 2), mRoof, { pos: [0.72, 0.2, 0.62], rot: [0, 0, -6 * D2R] }));
    weather(ac, { w: 1.4, h: 0.24, pos: [-0.1, 0.08, 1.028], kind: 'rust', color: '#79462a', opacity: 0.5, seed: seed + 31, density: 2.1, spread: 0.03 });
    weather(ac, { w: 0.9, h: 0.2, pos: [0.2, 0.284, -0.3], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#efe8d6', opacity: 0.5, seed: seed + 32, density: 1.2, spread: 0.012 });
    rk.add(ac);
    rk.add(mesh(cyl(0.03, 0.03, 0.26, 8), mSteel, { pos: [x + 0.62, ROOF + 0.02, -0.92] }));
    rk.add(mesh(tubeOf([[x - 0.81, ROOF + 0.16, 0], [x - 0.95, ROOF + 0.05, 0]], 0.018, 10, 6), mSteel));   // 冷媒管
  }
  for (let i = 0; i < 4; i++) {
    const x = [-6.6, -0.4, 2.6, 6.5][i];
    const v = grp('ventilator', { pos: [x, ROOF, 0] });
    v.add(mesh(cyl(0.19, 0.21, 0.08, 14), mSteel, { pos: [0, 0.04, 0] }));
    v.add(mesh(cyl(0.15, 0.15, 0.06, 14), mDark, { pos: [0, 0.105, 0] }));
    const cap = mesh(lathe([[0, 0.055], [0.125, 0.042], [0.165, 0.006], [0.17, -0.018], [0, -0.022]], 14), i === 2 ? mDark : mRoof, { pos: [0, 0.145, 0] });
    cap.rotation.y = range(rnd, 0, 6.283);
    v.add(cap);
    v.add(hoop(0.176, 0.011, mDark, { pos: [0, 0.083, 0], rot: [90 * D2R, 0, 0] }));
    if (i === 2) {                                   // 1 基は帽が外れかけている
      v.children[2].position.y = 0.128;
      v.children[2].rotation.z = 7 * D2R;
    }
    weather(v, { w: 0.28, h: 0.14, pos: [0.02, 0.02, 0.17], kind: 'rust', color: '#7a4a2e', opacity: 0.55, seed: seed + 60 + i, spread: 0.02 });
    rk.add(v);
  }
  // 避雷器・無線アンテナ・配管・碍子
  {
    const ar = grp('arrester', { pos: [5.4, ROOF, 0] });
    ar.add(mesh(rbox(0.5, 0.2, 0.5, 0.04, 2), mRoof, { pos: [0, 0.1, 0] }));
    for (const sz of [-1, 1]) for (let i = 0; i < 3; i++) ar.add(mesh(cyl(0.03, 0.034, 0.045, 8), MAT.hardPlastic('#8b8f86', { repeat: 5 }), { pos: [-0.14 + i * 0.14, 0.225, sz * 0.14] }));
    ar.add(mesh(box(0.46, 0.02, 0.42), mSteel, { pos: [0, 0.25, 0] }));
    rk.add(ar);
  }
  rk.add(mesh(cyl(0.05, 0.06, 0.05, 10), mSteel, { pos: [xS0 + 1.0, ROOF + 0.025, -0.42] }));
  rk.add(mesh(cyl(0.013, 0.007, 0.24, 8), mDark, { pos: [xS0 + 1.0, ROOF + 0.16, -0.42] }));
  rk.add(mesh(cyl(0.012, 0.005, 0.28, 6), mSteel, { pos: [xS1 - 0.6, ROOF + 0.14, 0.3], name: 'lightning-rod' }));
  for (const sz of [-0.88, 0.88]) {
    rk.add(mesh(tubeOf([[xS0 + 0.7, ROOF + 0.03, sz], [xS0 + 3.4, ROOF + 0.05, sz * 0.93], [xS1 - 3.4, ROOF + 0.045, sz * 0.96], [xS1 - 1.0, ROOF + 0.03, sz * 0.88]], 0.019, 26, 7), mSteel));
  }
  for (let i = 0; i < 5; i++) {
    const x = xS0 + 1.9 + i * 2.9;
    rk.add(mesh(cyl(0.042, 0.05, 0.055, 10), mSteel, { pos: [x, ROOF + 0.028, -0.88] }));
    rk.add(mesh(cyl(0.028, 0.028, 0.05, 8), MAT.hardPlastic('#8d9188', { repeat: 5 }), { pos: [x, ROOF + 0.075, 0.88] }));
  }

  /* ══════════════════════════════════════════ 東端：連結妻面（先頭車と向かい合う） */
  const coup = grp('coupler-end');
  g.add(coup);
  const XT = 7.90;                                   // 妻板中心（外面 x = 7.95）
  const TH = { w: 2.42, h: 2.66, cy: SKIRT + 1.33 };
  coup.add(mesh(plateGeo(TH.w, TH.h, [
    [0, 0.3, 1.0, 1.5, 0.05],
    [-0.86, 1.0, 0.28, 0.28, 0.03], [0.86, 1.0, 0.28, 0.28, 0.03],
    [-0.56, -0.28, 0.3, 0.26, 0.03], [0.56, -0.28, 0.3, 0.26, 0.03],
  ], 0.1), mEnd, { pos: [XT, TH.cy, 0], rot: [0, 90 * D2R, 0], name: 'plate-coupler-end' }));
  coup.add(mesh(box(0.026, 0.2, 2.3), mRed, { pos: [XT + 0.062, 1.06, 0] }));
  {
    const gf = grp('bend', { pos: [XT + 0.02, TH.cy + 0.3, 0] });
    for (const sz of [-1, 1]) gf.add(mesh(box(0.08, 1.62, 0.1), mSash, { pos: [0, 0, sz * 0.55] }));
    gf.add(mesh(box(0.08, 0.1, 1.2), mSash, { pos: [0, 0.81, 0] }));
    gf.add(mesh(box(0.08, 0.1, 1.2), mSash, { pos: [0, -0.81, 0] }));
    gf.add(mesh(box(0.055, 1.5, 1.06), mRubber, { pos: [0.03, 0, 0] }));
    for (let i = 0; i < 3; i++) gf.add(mesh(box(0.018, 1.5 - i * 0.06, 1.06 - i * 0.08), mRubberOld, { pos: [0.04 + i * 0.012, 0, 0], cast: false }));
    coup.add(gf);
  }
  for (const s of [-1, 1]) {
    const tl = grp('tail-lamp', { pos: [XT + 0.058, TH.cy + 1.0, s * 0.86] });
    tl.add(mesh(rbox(0.045, 0.26, 0.26, 0.02, 2), mSteel, { name: 'tail-case' }));
    tl.add(mesh(cyl(0.07, 0.07, 0.02, 14), MAT.lampShade({ color: '#e8a49c', emissive: '#e2685e', emissiveIntensity: 1.0 }), { pos: [0.024, 0, 0], rot: [0, 0, 90 * D2R], name: 'tail-lens', cast: false }));
    coup.add(tl);
    // ジャンプ栓
    const y = TH.cy - 0.28;
    coup.add(mesh(cyl(0.072, 0.078, 0.05, 12), mDark, { pos: [XT + 0.038, y, s * 0.56], rot: [0, 0, 90 * D2R] }));
    coup.add(mesh(cyl(0.05, 0.05, 0.06, 12), mSteel, { pos: [XT + 0.058, y, s * 0.56], rot: [0, 0, 90 * D2R] }));
    coup.add(mesh(tubeOf([[XT + 0.03, y, s * 0.56], [XT + 0.045, y - 0.16, s * 0.46], [XT + 0.03, y - 0.4, s * 0.3]], 0.024, 12, 7), mRubber));
  }
  {   // 渡り板・手すり
    const wk = grp('walkway');
    wk.add(mesh(rbox(0.3, 0.04, 0.66, 0.01, 2), mDark, { pos: [7.84, SKIRT - 0.06, 0], name: 'walk-board' }));
    for (let i = 0; i < 5; i++) wk.add(mesh(box(0.02, 0.02, 0.62), mSteel, { pos: [7.69 + i * 0.055, SKIRT - 0.036, 0], cast: false }));
    for (const sz of [-1, 1]) {
      wk.add(mesh(cyl(0.017, 0.017, 0.84, 8), mSteel, { pos: [7.72, SKIRT + 0.36, sz * 0.31] }));
      wk.add(mesh(cyl(0.017, 0.017, 0.84, 8), mSteel, { pos: [7.96, SKIRT + 0.36, sz * 0.31] }));
      wk.add(mesh(box(0.24, 0.024, 0.024), mSteel, { pos: [7.84, SKIRT + 0.78, sz * 0.31] }));
      wk.add(mesh(box(0.24, 0.018, 0.018), mSteel, { pos: [7.84, SKIRT + 0.45, sz * 0.31] }));
    }
    coup.add(wk);
  }
  {   // 連結器
    const cu = grp('coupler', { pos: [XT + 0.005, 0.94, 0] });
    cu.add(mesh(box(0.18, 0.22, 0.36), mDark, { pos: [-0.02, 0, 0], name: 'coupler-stalk' }));
    cu.add(mesh(cyl(0.085, 0.085, 0.12, 12), mWheel, { pos: [0.03, 0, 0], rot: [0, 0, 90 * D2R], name: 'coupler-head' }));
    cu.add(mesh(rbox(0.12, 0.28, 0.12, 0.02, 2), mDark, { pos: [0.03, 0.07, 0] }));
    cu.add(mesh(cyl(0.03, 0.03, 0.07, 10), mSteel, { pos: [-0.06, 0.13, 0], rot: [0, 0, 90 * D2R] }));
    cu.add(mesh(box(0.3, 0.06, 0.44), mSkirt, { pos: [-0.08, -0.16, 0] }));
    coup.add(cu);
    for (const s of [-1, 1]) {
      coup.add(mesh(tubeOf([[XT + 0.015, 0.9, s * 0.3], [XT + 0.042, 0.74, s * 0.27], [XT + 0.028, 0.56, s * 0.2]], 0.024, 12, 7), mRubber));
      coup.add(mesh(cyl(0.032, 0.032, 0.045, 10), mSteel, { pos: [XT + 0.03, 0.9, s * 0.3], rot: [0, 0, 90 * D2R] }));
    }
  }
  decal(coup, { map: plateTex(['キハ 40-2', '春日社区線 定員 62 人']), w: 0.42, h: 0.21, pos: [XT + 0.052, 2.86, 0.62], rot: [0, 90 * D2R, 0], order: 2 });

  /* ══════════════════════════════════════════ 西端：車尾（非貫通寄り・尾灯と表示幕） */
  const rear = grp('rear-end');
  g.add(rear);
  const RN = { x: xT + 0.11, cy: 2.13, w: 2.42, h: 2.60 };
  rear.add(mesh(plateGeo(RN.w, RN.h, [
    [0, 0.72, 0.86, 0.6, 0.06],                     // 後台形窓（車掌が後ろを見る）
    [-0.86, -0.66, 0.2, 0.2, 0.04], [0.86, -0.66, 0.2, 0.2, 0.04],   // 尾灯
    [0, -0.2, 0.5, 0.24, 0.03],                     // 後部表示幕
    [0, -1.05, 0.3, 0.16, 0.03],                    // 反射板・連管
  ], 0.12), mEnd, { pos: [RN.x, RN.cy, 0], rot: [0, -90 * D2R, 0], name: 'plate-rear' }));
  for (const sz of [-1, 1]) rear.add(mesh(box(0.16, 2.5, 0.03), mBody, { pos: [xT + 0.155, 2.1, sz * 1.225] }));
  rear.add(mesh(box(0.03, 0.2, 2.28), mRed, { pos: [xT + 0.058, 1.06, 0] }));
  rear.add(mesh(box(0.026, 0.055, 1.72), mBlue, { pos: [xT + 0.06, 1.3, 0] }));
  {   // 後台形窓（サッシ＋ガラス＋内側の仕切壁）
    const w = grp('rear-window', { pos: [xT + 0.05, RN.cy + 0.72, 0], rot: [0, -90 * D2R, 0] });
    w.add(mesh(plateGeo(0.9, 0.64, [[0, 0, 0.8, 0.54, 0.03]], 0.03), mSash, { pos: [0, 0, 0.004] }));
    w.add(mesh(box(0.8, 0.54, 0.014), mGlass, { pos: [0, 0, -6e-3], name: 'glass-rear', cast: false }));
    w.add(mesh(box(0.86, 0.05, 0.016), MAT.paint('#33403c', { steps: 2, spec: 0.08, shadowAmt: 0.95 }), { pos: [0, 0.32, 0.012], cast: false }));
    weather(w, { w: 0.5, h: 0.4, pos: [0.06, -0.06, 0.012], kind: 'dirt', color: '#cfd9d3', opacity: 0.3, seed: seed + 71, density: 1.2, spread: 0.02 });
    rear.add(w);
    rear.add(mesh(box(0.05, 1.4, 1.2), mInner, { pos: [xT + 0.24, 1.9, 0], cast: false }));   // 仕切壁
  }
  for (const s of [-1, 1]) {   // 尾灯・反射板
    const tl = grp('tail-lamp-rear', { pos: [xT + 0.045, RN.cy - 0.66, s * 0.86] });
    tl.add(mesh(rbox(0.05, 0.22, 0.22, 0.02, 2), mSteel, { name: 'tail-case' }));
    tl.add(mesh(cyl(0.062, 0.062, 0.02, 14), MAT.lampShade({ color: '#e8a49c', emissive: '#e2685e', emissiveIntensity: 1.1 }), { pos: [-0.03, 0, 0], rot: [0, 0, 90 * D2R], name: 'tail-lens', cast: false }));
    rear.add(tl);
    rear.add(mesh(box(0.02, 0.14, 0.2), MAT.paint('#d8d2c2', { map: tailMarkTex(), steps: 2, spec: 0.14 }), { pos: [xT + 0.06, RN.cy - 0.98, s * 0.5], name: 'reflector' }));
  }
  {   // 後部表示幕（方向幕・使われていない文字）
    const d = grp('rear-destination', { pos: [xT + 0.045, RN.cy - 0.2, 0] });
    d.add(mesh(rbox(0.05, 0.24, 0.5, 0.008, 2), mDark, { pos: [0.008, 0, 0] }));
    d.add(mesh(plane(0.46, 0.2), MAT.lampShade({ map: TEX.lightPanel({ text: '桜ヶ丘', bg: '#2a2c2e', fg: '#e8e2c8', mode: 'sign' }), color: '#efe6cf', emissive: '#8d7f5c', emissiveIntensity: 0.35 }), {
      pos: [0.035, 0, 0], rot: [0, -90 * D2R, 0], name: 'rear-face', cast: false,
    }));
    rear.add(d);
  }
  {   // 車尾の手すり・渡り板（跳ね上げ状態）・石よけ
    const h = grp('rear-rail');
    for (const sz of [-1, 1]) {
      h.add(mesh(cyl(0.018, 0.018, 0.9, 8), mSteel, { pos: [xT + 0.03, SKIRT + 0.4, sz * 0.62] }));
      h.add(mesh(cyl(0.018, 0.018, 0.9, 8), mSteel, { pos: [xT + 0.03, SKIRT + 0.4, sz * 0.2] }));
      h.add(mesh(box(0.024, 0.42, 0.024), mSteel, { pos: [xT + 0.03, SKIRT + 0.68, sz * 0.41] }));
      h.add(mesh(box(0.02, 0.02, 0.42), mSteel, { pos: [xT + 0.03, SKIRT + 0.87, sz * 0.41] }));
    }
    h.add(mesh(box(0.05, 0.5, 1.3), mDark, { pos: [xT + 0.07, SKIRT - 0.19, 0], rot: [0, 0, -8 * D2R], name: 'folded-plank' }));
    h.add(mesh(rbox(0.4, 0.46, 2.24, 0.03, 2), mSkirt, { pos: [xT + 0.24, 0.242, 0], name: 'stone-guard' }));
    rear.add(h);
    weather(rear, { w: 2.0, h: 0.34, pos: [xT + 0.062, 0.34, 0], rot: [0, -90 * D2R, 0], kind: 'dirt', color: '#5f5642', opacity: 0.5, seed: seed + 77, density: 1.9, spread: 0.05 });
  }

  /* ══════════════════════════════════════════ 裾・帯・床下 */
  const skirt = grp('skirts');
  g.add(skirt);
  for (const sz of [-1, 1]) {
    const z = sz * (SO - 0.055);
    skirt.add(mesh(box(LNS - 0.05, 0.24, 0.045), mSkirt, { pos: [xC, SKIRT + 0.12, z], name: 'skirt-panel' }));
    for (let i = 0; i < 9; i++) {
      const x = xS0 + 0.55 + i * (LNS - 1.0) / 8;
      skirt.add(mesh(box(0.055, 0.21, 0.03), mSteel, { pos: [x, SKIRT + 0.11, sz * (SO - 0.026)], cast: false, name: 'skid-angle' }));
    }
    for (const bx of [-S.bogiePitch / 2, S.bogiePitch / 2]) {
      weather(skirt, { w: 1.25, h: 0.32, pos: [bx - 0.95, SKIRT + 0.16, sz * (SO - 0.006)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'dirt', color: '#5b5240', opacity: 0.55, seed: seed + 120 + Math.round(bx), density: 2.1, spread: 0.05 });
    }
    skirt.add(mesh(box(LNS - 0.05, bandY[1] - bandY[0], 0.024), mBlue, { pos: [xC, (bandY[0] + bandY[1]) / 2, sz * (SO + 0.012)] }));
    skirt.add(mesh(box(LNS - 0.05, 0.05, 0.022), mRed, { pos: [xC, bandY[1] + 0.03, sz * (SO + 0.011)] }));
    skirt.add(mesh(box(LNS - 0.05, 0.05, 0.022), mRed, { pos: [xC, bandY[0] - 0.03, sz * (SO + 0.011)] }));
  }
  {
    const uf = grp('underfloor');
    g.add(uf);
    const yB = 0.58, yT = SKIRT - 0.01;
    uf.add(mesh(rbox(3.0, yT - yB, 0.9, 0.03, 2), mSkirt, { pos: [0.9, (yB + yT) / 2, 0], name: 'uf-battery-box' }));
    for (let i = 0; i < 4; i++) uf.add(mesh(box(0.02, yT - yB - 0.08, 0.92), mDark, { pos: [-0.42 + i * 0.9 - 0.4, (yB + yT) / 2, 0], cast: false }));
    uf.add(mesh(rbox(1.3, yT - yB - 0.05, 0.7, 0.03, 2), mDark, { pos: [-2.7, (yB + yT) / 2, 0.16], name: 'uf-resistor' }));
    uf.add(mesh(cyl(0.185, 0.185, 1.6, 14), mSteel, { pos: [-4.6, 0.78, -0.3], rot: [0, 0, 90 * D2R], name: 'air-reservoir' }));
    for (const s of [-1, 1]) uf.add(mesh(cyl(0.19, 0.19, 0.04, 14), mDark, { pos: [-4.6 + s * 0.82, 0.78, -0.3], rot: [0, 0, 90 * D2R] }));
    uf.add(mesh(rbox(0.86, 0.26, 0.58, 0.03, 2), mDark, { pos: [3.9, 0.71, 0.24], name: 'compressor' }));
    uf.add(mesh(cyl(0.11, 0.11, 0.58, 12), mSteel, { pos: [3.9, 0.87, 0.24], rot: [0, 0, 90 * D2R] }));
    for (const [sz, yy] of [[-1, 0.74], [1, 0.7]]) {
      uf.add(mesh(tubeOf([[xS0 + 0.2, yy, sz * 0.92], [-3.6, yy + 0.02, sz * 1.0], [0.4, yy - 0.01, sz * 1.02], [4.9, yy + 0.02, sz * 0.94]], 0.024, 24, 7), mSteel));
    }
    for (const x of [-2.2, 1.4, 4.1]) {
      uf.add(mesh(cyl(0.02, 0.02, 0.12, 8), mDark, { pos: [x, 0.53, -0.56] }));
      weather(uf, { w: 0.14, h: 0.42, pos: [x + 0.02, 0.62, -0.585], kind: 'rust', color: '#79462a', opacity: 0.55, seed: seed + Math.round(x * 97), spread: 0.03 });
    }
  }

  /* ══════════════════════════════════════════ 台車（2 基・いずれも付台車） */
  for (const bx of [-S.bogiePitch / 2, S.bogiePitch / 2]) g.add(bogie(bx));
  function bogie(bx) {
    const b = grp(bx > 0 ? 'bogie-east' : 'bogie-west', { pos: [bx, 0, 0] });
    const hg = S.gauge / 2, axY = S.treadY + S.wheelR;
    for (const ax of [-0.55, 0.55]) {
      for (const sz of [-1, 1]) {
        b.add(mesh(cyl(S.wheelR, S.wheelR, 0.05, 22), mTread, { pos: [ax, axY, sz * hg], name: 'wheel-tread' }));
        b.add(mesh(cyl(S.wheelR - 0.014, S.wheelR - 0.014, 0.075, 20), mWheel, { pos: [ax, axY, sz * (hg - 0.055)] }));
        b.add(mesh(cyl(0.116, 0.121, 0.03, 20), mWheel, { pos: [ax, 0.045 + 0.116, sz * 0.452], name: 'wheel-flange' }));
        b.add(hoop(S.wheelR - 0.055, 0.009, mSteel, { pos: [ax, axY, sz * 0.505], rot: [90 * D2R, 0, 0] }));
        b.add(mesh(rbox(0.115, 0.135, 0.075, 0.02, 2), mWheel, { pos: [ax, axY + 0.015, sz * 0.598], name: 'journal-box' }));
        b.add(mesh(cyl(0.024, 0.024, 0.24, 8), mSteel, { pos: [ax, axY + 0.18, sz * 0.598] }));
        b.add(mesh(coil(0.05, 0.19, 5, 12, 0.013), mSteel, { pos: [ax, axY + 0.29, sz * 0.598] }));
        b.add(mesh(box(0.14, 0.035, 0.13), mDark, { pos: [ax, axY + 0.40, sz * 0.598] }));
      }
      b.add(mesh(cyl(0.042, 0.042, 0.86, 12), mSteel, { pos: [ax, axY, 0], rot: [90 * D2R, 0, 0], name: 'axle' }));
    }
    for (const sz of [-1, 1]) {
      b.add(mesh(rbox(1.86, 0.38, 0.09, 0.035, 2), mWheel, { pos: [0, 0.48, sz * 0.685], name: 'bogie-frame-side' }));
      b.add(mesh(box(1.6, 0.055, 0.1), mWheel, { pos: [0, 0.685, sz * 0.685] }));
      b.add(mesh(cyl(0.03, 0.03, 0.1, 8), mSteel, { pos: [0.8, 0.55, sz * 0.685], rot: [90 * D2R, 0, 0] }));
    }
    b.add(mesh(box(0.36, 0.2, 1.3), mWheel, { pos: [0, 0.58, 0], name: 'bogie-bolster' }));
    b.add(mesh(cyl(0.08, 0.09, 0.18, 12), mDark, { pos: [0, 0.73, 0], name: 'center-plate' }));
    b.add(hoop(0.13, 0.02, mSteel, { pos: [0, 0.685, 0], rot: [90 * D2R, 0, 0] }));
    b.add(mesh(cyl(0.058, 0.058, 0.36, 12), mDark, { pos: [0.66, 0.34, 0], rot: [0, 0, 90 * D2R], name: 'brake-cylinder' }));
    b.add(mesh(box(0.1, 0.06, 0.06), mSteel, { pos: [0.88, 0.34, 0] }));
    for (const sz of [-1, 1]) {
      b.add(mesh(box(0.86, 0.032, 0.032), mSteel, { pos: [-0.05, 0.25, sz * 0.585] }));
      b.add(mesh(box(0.05, 0.16, 0.032), mSteel, { pos: [-0.48, 0.29, sz * 0.585] }));
      b.add(mesh(box(0.05, 0.2, 0.13), mDark, { pos: [0.5, 0.29, sz * 0.585] }));
      b.add(mesh(box(0.1, 0.14, 0.055), mWheel, { pos: [-0.55, 0.24, sz * 0.575], name: 'brake-beam' }));
    }
    b.add(mesh(rbox(0.56, 0.3, 0.46, 0.03, 2), mSkirt, { pos: [-0.26, 0.42, 0], name: 'gear-cover' }));
    weather(b, { w: 1.5, h: 0.4, pos: [0, 0.36, 0.72], kind: 'dirt', color: '#514a3a', opacity: 0.55, seed: seed + Math.round(bx * 11), density: 2.0, spread: 0.06 });
    weather(b, { w: 1.2, h: 0.4, pos: [0.1, 0.3, -0.72], rot: [0, Math.PI, 0], kind: 'rust', color: '#6f4526', opacity: 0.5, seed: seed + Math.round(bx * 23), density: 1.7, spread: 0.06 });
    return b;
  }

  /* ══════════════════════════════════════════ 経年（先頭車より進む） */
  for (let i = 0; i < 18; i++) {
    const sz = i % 2 ? 1 : -1;
    weather(g, {
      w: range(rnd, 0.45, 1.5), h: range(rnd, 0.16, 0.4),
      pos: [range(rnd, xS0 + 1.35, xS1 - 1.35), range(rnd, 0.92, 1.5), sz * (SO + 0.013)],
      rot: [0, sz > 0 ? 0 : Math.PI, 0],
      kind: i % 3 === 0 ? 'chip' : 'rust', color: i % 3 === 0 ? shade(PAL.trainBody, 1.16) : '#7c4a2b',
      opacity: range(rnd, 0.26, 0.55), seed: seed + 200 + i, density: 1.8, spread: 0.04,
    });
  }
  for (let i = 0; i < 9; i++) {
    const sz = i % 2 ? 1 : -1;
    weather(g, { w: 1.2, h: 0.2, pos: [range(rnd, xS0 + 1.2, xS1 - 1.2), (bandY[0] + bandY[1]) / 2, sz * (SO + 0.028)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'chip', color: '#e3ddcb', opacity: 0.65, seed: seed + 320 + i, density: 1.6, spread: 0.02 });
  }
  for (const sz of [-1, 1]) {
    bays.forEach((_, bi) => {
      for (const x of winCols[bi].xs) {
        weather(g, { w: winCols[bi].ww * 0.7, h: WIN_H * 0.72, pos: [x, (WLO + WHI) / 2, sz * (SO + 0.004)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'dirt', color: '#95907f', opacity: 0.4, seed: seed + 400 + bi * 11 + (sz + 1) * 3 + Math.round(x), density: 1.1, spread: 0.008 });
      }
    });
  }
  // 落書きと、その洗い落とし残り（後述車は目立つ）
  for (const [x, sz, w] of [[-5.2, 1, 1.1], [-1.4, -1, 0.9], [3.2, 1, 1.4], [6.4, -1, 0.7]]) {
    decal(g, { map: TEX.wear({ kind: 'scratch', color: '#6b6355', seed: seed + Math.round(x * 13), density: 0.8 }), w, h: 0.4, pos: [x, 1.72, sz * (SO + 0.014)], rot: [0, sz > 0 ? 0 : Math.PI, 0], opacity: 0.32, order: 1 });
    decal(g, { map: TEX.wear({ kind: 'scratch', color: '#f2eee2', seed: seed + Math.round(x * 29), density: 0.7 }), w: w * 1.15, h: 0.5, pos: [x, 1.9, sz * (SO + 0.016)], rot: [0, sz > 0 ? 0 : Math.PI, 0], opacity: 0.5, order: 2 });
  }
  // 板金打ち跡・雨だれ・屋根の錆
  for (let i = 0; i < 18; i++) {
    const sz = i % 2 ? 1 : -1;
    const rr0 = range(rnd, 0.05, 0.11);
    g.add(mesh(sph(rr0, 10, 8), i % 4 === 0 ? mBodyUp : mBody, {
      pos: [range(rnd, xS0 + 0.4, xS1 - 0.4), range(rnd, 1.05, 3.25), sz * (SO - rr0 * 0.07)],
      scale: [1, 0.86, 0.16], cast: false,
    }));
  }
  for (const sz of [-1, 1]) {
    weather(g, { w: 1.6, h: 0.5, pos: [xS0 + 2.4, 3.1, sz * (SO + 0.008)], rot: [0, sz > 0 ? 0 : Math.PI, 0], kind: 'dirt', color: '#6f6653', opacity: 0.32, seed: seed + 610 + sz, density: 1.2, spread: 0.02 });
  }
  weather(g, { w: 5.0, h: 1.0, pos: [0.6, ROOF + 0.052, 0.25], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8a6040', opacity: 0.34, seed: seed + 520, density: 1.7, spread: 0.05 });
  weather(g, { w: 2.4, h: 0.7, pos: [-4.4, ROOF + 0.053, -0.5], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#efe8d6', opacity: 0.45, seed: seed + 530, density: 1.2, spread: 0.05 });

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { DEFAULT_OPTIONS, SPEC, build, build as default, meta };
