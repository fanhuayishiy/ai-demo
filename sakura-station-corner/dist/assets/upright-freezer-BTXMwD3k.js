import { g as grp, M as MAT, T as TEX, P as PAL, m as mesh, b as box, n as range, A as row, c as cyl, t as tor, r as rbox, W as pipe, i as grill, h as decal, q as finish, w as weather, a9 as stockItem, z as rand } from './index-BxWjt-aN.js';
import { meta as meta$1, build as build$2 } from './ice-cream-Cd3tA3ae.js';
import { build as build$1 } from './price-tag-0KGjdID2.js';

//  assets/interior/upright-freezer.js —— 立式アイスケース（ガラス 2 門・庫内 5 段バスケットに密陳）
//  ・原点 = 床面（脚・コンプレッカバー下）中心、+Y 上、正面 +Z
//  ・構造：断熱ボデー（側・天・底・背・機械室の膨らみ）／アルミ框ガラス扉 N 枚（把手・パッキン・蝶番・霜）／
//        庫内 5 段のワイヤバスケット（front rail・側ワイヤ・底グリル）／商品 ice-cream を前後列で隙間なく／
//        庫内 LED（breathe）・上箱広告＋蛍光灯・前面「要冷凍」表示・脚と底のドレン

const meta = {
  id: 'upright-freezer',
  real: [0.94, 1.95, 0.81],
  origin: 'ground-center',
};

const PI = Math.PI;
const ICE = (meta$1 && meta$1.real) || [0.065, 0.09, 0.065];
const ICE_V = (meta$1 && meta$1.variants) || ['bar', 'cup', 'parfait', 'mochi', 'popsicle', 'twin'];

/* ---------- 寸法 ---------- */
const WALL = 0.055;
const Y_FLOOR = 0.185;      // 庫内床
const Y_CEIL = 1.655;       // 庫内天井
const BASK = [0.335, 0.585, 0.835, 1.085, 1.335];   // バスケット受（5 段）
const BASK_H = 0.145;       // バスケットの深さ
const Z_FRONT = 0.28;       // 商品フロント基準（庫内）
const Z_BACK = -0.24;       // 庫内奥壁面

const WS = 1.4;
function dust(parent, o) {
  return weather(parent, { spread: 0.014, ...o, w: (o.w || 1) / WS, h: (o.h || 1) / WS });
}

/** 1 段のバスケットに ice-cream を密陳（前後 2 列・傾き交じり） */
function fillBasket(parent, { y, iw, seed, rnd, back }) {
  const [w, h, d] = ICE;
  const pitch = w + 0.008;
  const n = Math.max(1, Math.floor((iw - 0.014) / pitch));
  const xs0 = -((n - 1) * pitch) / 2;
  for (let r = 0; r < 2; r++) {
    const z = Z_FRONT - d / 2 - 0.007 - r * (d + 0.010);
    const count = r === 0 ? n : Math.max(1, Math.round(n * back));
    for (let i = 0; i < count; i++) {
      const x = xs0 + i * pitch + (r ? pitch * 0.5 + range(rnd, -0.011, 0.011) : range(rnd, -2e-3, 0.002));
      const it = stockItem(`ice:${ICE_V[(i + r * 2) % ICE_V.length]}`, () => build$2({ seed: seed + r * 211 + i * 31, variant: ICE_V[(i + r * 2) % ICE_V.length] }));
      it.position.set(x, y, z);
      it.rotation.y = r === 0 ? range(rnd, -0.05, 0.05) : range(rnd, -0.32, 0.32);
      if (r === 0 && rnd() > 0.88) it.rotation.z = range(rnd, -0.05, 0.05);
      parent.add(it);
    }
  }
  // 前列の商品が倒れて出来た隙間に見せる値札
  const tg = build$1({ seed: seed + 5, variant: 'shelf' });
  tg.position.set(iw * 0.26, y + 0.004, Z_FRONT + 0.030);
  tg.rotation.x = -0.13;
  parent.add(tg);
  return n;
}

/** ワイヤバスケット（前面レール・側ワイヤ・底グリル・把手かけ） */
function basket(parent, { iw, y, seed, rnd }, mats) {
  const bg = grp('basket', { pos: [0, y, 0] });
  parent.add(bg);
  const zf = Z_FRONT + 0.018, zb = Z_BACK + 0.012;
  const bw = iw / 2;
  // 底（3 本の受けバー＋奥の受け金物）
  for (let i = 0; i < 5; i++) {
    const z = zb + (i / 4) * (zf - zb);
    bg.add(mesh(cyl(0.0024, 0.0024, iw - 0.006, 7), mats.wire, { pos: [0, 0.004, z], rot: [0, 0, PI / 2], name: 'wire-bottom', cast: false }));
  }
  for (let i = 0; i < 5; i++) {
    const x = -bw + 0.012 + i * ((iw - 0.024) / 4);
    bg.add(mesh(cyl(0.0022, 0.0022, zf - zb, 6), mats.wire, { pos: [x, 0.006, (zf + zb) / 2], rot: [PI / 2, 0, 0], name: 'wire-bottom-x', cast: false }));
  }
  // 前面レール（2 段のバー＋立ち上がり）
  bg.add(mesh(cyl(0.0042, 0.0042, iw, 8), mats.wire, { pos: [0, 0.048, zf], rot: [0, 0, PI / 2], name: 'front-rail' }));
  bg.add(mesh(cyl(0.0042, 0.0042, iw, 8), mats.wire, { pos: [0, 0.112, zf], rot: [0, 0, PI / 2], name: 'front-rail-2' }));
  bg.add(mesh(cyl(0.0042, 0.0042, iw, 8), mats.wire, { pos: [0, 0.006, zf], rot: [0, 0, PI / 2], name: 'front-rail-b', cast: false }));
  for (const s of [-1, 1]) {
    bg.add(mesh(cyl(0.0032, 0.0032, BASK_H, 7), mats.wire, { pos: [s * (bw - 0.003), BASK_H / 2, zf], name: 'post' }));
    bg.add(mesh(cyl(0.0024, 0.0024, zf - zb, 6), mats.wire, { pos: [s * (bw - 0.003), 0.118, (zf + zb) / 2], rot: [PI / 2, 0, 0], name: 'side-rail', cast: false }));
  }
  // 前面 price ラベルホルダ
  bg.add(mesh(box(iw * 0.42, 0.020, 0.007), mats.label, { pos: [-iw * 0.20, 0.075, zf + 0.006], name: 'label-holder' }));
  dust(bg, { w: iw * 0.6, h: 0.03, pos: [range(rnd, -0.2, 0.2), 0.118, zf], kind: 'dirt', color: '#c9d2d2', opacity: 0.32, seed: seed + 7, density: 1.4, spread: 0.02 });
  return bg;
}

/* ------------------------------------------------------------------ build */
function build(options = {}) {
  const { doors = 2, w = 0.92, h = 1.92, seed = 7301, density = 1 } = options;
  const back = Math.max(0.3, Math.min(1, 0.62 * density));
  const rnd = rand(seed);
  const g = grp('upright-freezer');
  const HW = w / 2;
  const D = 0.66;
  const yBodyTop = h - 0.22;        // 箱体上端（上箱をのせる）

  const mats = {
    skin: MAT.metalPaint('#ece7db', { worn: 0.5, repeat: 3 }),
    skinSide: MAT.metalPaint('#dcd6c8', { worn: 0.7, repeat: 2 }),
    steel: MAT.metal('#b2b6b7', { worn: 0.7, dir: 'h', repeat: 2 }),
    alu: MAT.metal('#cdd1d2', { worn: 0.28, dir: 'v', spec: 0.66, repeat: 3 }),
    aluDim: MAT.metal('#a9aeb0', { worn: 0.62, dir: 'h', spec: 0.5, repeat: 2 }),
    chrome: MAT.chrome({}),
    wire: MAT.metal('#c2c6c7', { worn: 0.45, spec: 0.6, repeat: 2 }),
    rubber: MAT.rubber('#2b2e32', {}),
    dark: MAT.paint('#31353a', { spec: 0.14, shadowAmt: 0.96, steps: 2 }),
    label: MAT.plastic('#e8ece8', { spec: 0.3, shadowAmt: 0.7 }),
    frost: MAT.paint('#eff7f8', {
      map: TEX.frost({ repeat: 1 }).map, normalMap: TEX.frost({ repeat: 1 }).normalMap,
      normalScaleX: 0.75, normalScaleY: 0.75, spec: 0.32, shadowAmt: 0.58, steps: 3, sat: 0.88,
    }),
    led: MAT.lampShade({ color: '#f6fcff', emissive: '#e4f4ff', emissiveIntensity: 0.95, steps: 2, shadowAmt: 0.3 }),
    sign: MAT.lampShade({
      map: TEX.lightPanel({ text: '要冷凍 −18℃', bg: '#e7f2fb', fg: '#1f4e7a', mode: 'sign' }),
      color: '#ffffff', emissive: '#cfe8ff', emissiveIntensity: 0.55, steps: 2, shadowAmt: 0.42,
    }),
    ad: MAT.poster({
      map: TEX.poster({ title: 'アイスクリーム', sub: 'ICE CREAM · SPRING FLAVOR', bg: '#f6f1e3', accent: PAL.storeBand, seed }),
      steps: 3, sat: 0.99, spec: 0.2, shadowAmt: 0.6,
    }),
  };
  /* ガラス：実屈折ながら庫内商品（半透明パーツ含む）を落とさないようデプス書込を切る */
  const glassMat = MAT.glass({ color: '#dbeef2', thickness: 0.010, roughness: 0.05, transmission: 0.93, attenuation: '#cbe9e8' });
  glassMat.depthWrite = false;

  const iw = w - 2 * WALL;          // 庫内幅

  /* ==================================================== ①箱体 */
  const shell = grp('shell');
  g.add(shell);
  for (const s of [1, -1]) {
    shell.add(mesh(box(WALL, yBodyTop - 0.14, D - 0.02), mats.skinSide, { pos: [s * (HW - WALL / 2), 0.14 + (yBodyTop - 0.14) / 2, 0], name: 'side' }));
    dust(shell, { w: 0.4, h: 0.5, pos: [s * (HW + 0.001), 0.9, range(rnd, -0.1, 0.1)], rot: [0, s * PI / 2, 0], kind: 'scratch', color: '#cfc9b9', opacity: 0.28, seed: seed + s * 17, density: 1.5, spread: 0.06 });
    dust(shell, { w: 0.3, h: 0.24, pos: [s * (HW + 0.001), 0.30, D / 2 - 0.12], rot: [0, s * PI / 2, 0], kind: 'dirt', color: '#6f6a5d', opacity: 0.34, seed: seed + s * 23, density: 1.3, spread: 0.04 });
  }
  shell.add(mesh(box(w, 0.018, D - 0.01), mats.skin, { pos: [0, yBodyTop - 0.009, 0], name: 'skin-top' }));
  shell.add(mesh(box(w - 0.012, 0.012, D - 0.02), MAT.galvanized({ repeat: 2 }), { pos: [0, yBodyTop - 0.028, 0], name: 'top-lining', cast: false }));
  shell.add(mesh(box(w, 0.145, D), mats.skin, { pos: [0, 0.0725, 0], name: 'machine-box' }));
  shell.add(mesh(box(iw + 0.01, Y_CEIL - Y_FLOOR, 0.020), MAT.galvanized({ repeat: 2 }), { pos: [0, (Y_CEIL + Y_FLOOR) / 2, -D / 2 + WALL + 0.010], name: 'back-inner' }));
  // 庫内側板（発泡断熱の内側アルミ）
  for (const s of [1, -1]) {
    shell.add(mesh(box(0.012, Y_CEIL - Y_FLOOR, D - 2 * WALL - 0.02), MAT.metal('#c8cdcf', { worn: 0.4, dir: 'v' }), { pos: [s * (iw / 2 + 0.006), (Y_CEIL + Y_FLOOR) / 2, 0], name: 'inner-side' }));
  }
  // 前面アルミ框
  const fr = 0.028;
  shell.add(mesh(box(w - 0.01, fr, 0.030), mats.alu, { pos: [0, yBodyTop - fr / 2, D / 2 - 0.014], name: 'frame-head' }));
  shell.add(mesh(box(w - 0.01, fr, 0.030), mats.alu, { pos: [0, 0.165 + fr / 2, D / 2 - 0.014], name: 'frame-sill' }));
  for (const s of [-1, 1]) {
    shell.add(mesh(box(0.026, Y_CEIL - 0.19, 0.030), mats.alu, { pos: [s * (iw / 2 + 0.013), (Y_CEIL + 0.19) / 2, D / 2 - 0.014], name: 'frame-jamb' }));
  }
  row(shell, 5, (w - 0.14) / 4, (i, x) => mesh(cyl(0.0038, 0.0038, 0.008, 8), mats.chrome, { pos: [x, yBodyTop - fr / 2, D / 2 - 0.002], rot: [PI / 2, 0, 0], cast: false }), { x0: -HW + 0.07 });

  /* ==================================================== ②庫内（バスケット・商品・霜） */
  const cab = grp('cabinet');
  g.add(cab);
  // 床（ドレン勾配）
  cab.add(mesh(box(iw, 0.012, D - 2 * WALL), MAT.metal('#bcc1c2', { worn: 0.5, dir: 'h' }), { pos: [0, Y_FLOOR - 0.006, 0], name: 'inner-floor' }));
  cab.add(mesh(cyl(0.018, 0.018, 0.012, 12), mats.dark, { pos: [0, Y_FLOOR + 0.002, Z_BACK + 0.05], name: 'drain-hole', cast: false }));
  cab.add(mesh(tor(0.020, 0.0035, 6, 14), mats.steel, { pos: [0, Y_FLOOR + 0.004, Z_BACK + 0.05], rot: [PI / 2, 0, 0], name: 'drain-ring', cast: false }));
  // 奥壁フィン＋霜
  {
    const nFin = 22;
    for (let i = 0; i < nFin; i++) {
      const x = -iw / 2 + 0.02 + i * ((iw - 0.04) / (nFin - 1));
      cab.add(mesh(box(0.0032, Y_CEIL - Y_FLOOR - 0.08, 0.026), mats.aluDim, { pos: [x, (Y_CEIL + Y_FLOOR) / 2, Z_BACK + 0.020], name: 'fin', cast: false }));
    }
    cab.add(mesh(rbox(iw - 0.02, 0.20, 0.010, 0.005, 2), mats.frost, { pos: [0, Y_FLOOR + 0.12, Z_BACK + 0.036], name: 'back-frost' }));
    for (let i = 0; i < 6; i++) {
      cab.add(mesh(rbox(range(rnd, 0.05, 0.13), range(rnd, 0.04, 0.10), 0.007, 0.018, 2), mats.frost, { pos: [range(rnd, -iw / 2 + 0.06, iw / 2 - 0.06), range(rnd, Y_FLOOR + 0.2, Y_CEIL - 0.1), Z_BACK + 0.036], name: 'frost-patch', cast: false }));
    }
  }
  // バスケット 5 段と商品
  for (let t = 0; t < BASK.length; t++) {
    const y = BASK[t];
    basket(cab, { iw, y, seed: seed + t * 97, rnd }, mats);
    fillBasket(cab, { y: y + 0.008, iw, seed: seed + t * 313, rnd, back });
    // 段受けアングル
    for (const s of [-1, 1]) {
      cab.add(mesh(box(0.012, 0.016, D - 2 * WALL - 0.04), mats.aluDim, { pos: [s * (iw / 2 - 0.006), y - 0.006, -0.01], name: 'rail-angle', cast: false }));
    }
    dust(cab, { w: iw * 0.8, h: 0.05, pos: [range(rnd, -0.1, 0.1), y + 0.002, Z_BACK + 0.09], rot: [-PI / 2, 0, 0], kind: 'dirt', color: '#cfd8d8', opacity: 0.30, seed: seed + t * 41, density: 1.4, spread: 0.02 });
    // 庫内 LED（段裏、呼吸）
    const lamp = grp('cab-led' + t, { pos: [0, y + BASK_H + 0.055, Z_BACK + 0.06] });
    cab.add(lamp);
    lamp.add(mesh(box(iw - 0.03, 0.012, 0.022), mats.led, { name: 'led-bar' }));
    lamp.add(mesh(box(iw - 0.01, 0.018, 0.008), mats.aluDim, { pos: [0, 0.004, -0.013], name: 'led-holder', cast: false }));
    lamp.userData.breathe = { speed: 0.4 + t * 0.02, amount: 0.10, phase: (seed % 7) / 7 * 6.28 + t };
  }
  // 一番上の商品が天井に達するので最上段は低く抑える（隙間チェック用の目視調整は不要）
  // 庫内温度センサー・配線
  cab.add(pipe([[iw / 2 - 0.03, Y_CEIL - 0.05, Z_BACK + 0.05], [iw / 2 - 0.05, Y_CEIL - 0.18, Z_BACK + 0.02], [iw / 2 - 0.02, Y_CEIL - 0.40, Z_BACK + 0.05]],
    0.0045, MAT.rubber("#e6e0d0"), { seg: 12, radial: 6, name: 'sensor-lead', cast: false }));

  /* ==================================================== ③ガラス扉 */
  const step = (iw + (doors - 1) * 0.014) / doors;
  const doorW = step - 0.008;
  const doorH = Y_CEIL - 0.215;
  for (let c = 0; c < doors; c++) {
    const cx = -iw / 2 - 0.007 + step * (c + 0.5);
    const dg = grp('door' + c, { pos: [cx, 0.195 + doorH / 2, D / 2 - 0.016] });
    g.add(dg);
    dg.rotation.y = range(rnd, -5e-3, 0.005);
    const gl = mesh(box(doorW - 0.026, doorH - 0.026, 0.009), glassMat, { pos: [0, 0, 0.004], name: 'door-glass', cast: false, receive: false });
    gl.userData.noOutline = true;
    dg.add(gl);
    // アングル框
    dg.add(mesh(box(doorW, 0.016, 0.022), mats.alu, { pos: [0, doorH / 2 - 0.008, 0], name: 'rail-top' }));
    dg.add(mesh(box(doorW, 0.020, 0.024), mats.alu, { pos: [0, -doorH / 2 + 0.010, 0], name: 'rail-bottom' }));
    for (const s of [-1, 1]) dg.add(mesh(box(0.015, doorH - 0.030, 0.022), mats.alu, { pos: [s * (doorW / 2 - 0.0075), 0, 0], name: 'stile' }));
    // パッキン（4 面）
    for (const s of [-1, 1]) dg.add(mesh(box(0.009, doorH - 0.040, 0.011), mats.rubber, { pos: [s * (doorW / 2 - 0.022), 0, -0.013], name: 'gasket-v', cast: false }));
    dg.add(mesh(box(doorW - 0.044, 0.009, 0.011), mats.rubber, { pos: [0, doorH / 2 - 0.026, -0.013], name: 'gasket-t', cast: false }));
    dg.add(mesh(box(doorW - 0.044, 0.009, 0.011), mats.rubber, { pos: [0, -doorH / 2 + 0.028, -0.013], name: 'gasket-b', cast: false }));
    // 蝶番
    for (let k = 0; k < 3; k++) {
      const hy = -doorH / 2 + 0.16 + k * (doorH - 0.32) / 2;
      dg.add(mesh(box(0.024, 0.038, 0.018), mats.steel, { pos: [-doorW / 2 + 0.004, hy, -0.01], name: 'hinge', cast: false }));
      dg.add(mesh(cyl(0.005, 0.005, 0.042, 8), mats.chrome, { pos: [-doorW / 2 + 0.004, hy, -0.01], name: 'hinge-pin', cast: false }));
    }
    // 把手（縦バー・開閉で片側だけ太さが違う）
    const hx = doorW / 2 - 0.040;
    dg.add(mesh(cyl(0.0105, 0.0105, 0.260, 12), mats.chrome, { pos: [hx, 0.03, 0.030], name: 'handle-bar' }));
    for (const hy of [0.14, -0.08]) {
      dg.add(mesh(cyl(0.007, 0.007, 0.032, 8), mats.alu, { pos: [hx, 0.03 + hy, 0.014], rot: [PI / 2, 0, 0], name: 'handle-stud', cast: false }));
    }
    // 錠・「要冷凍」表示・指紋・霜
    dg.add(mesh(cyl(0.0115, 0.0115, 0.013, 12), MAT.metal('#b3b7b9', { worn: 0.6 }), { pos: [hx, -doorH / 2 + 0.085, 0.016], rot: [PI / 2, 0, 0], name: 'lock' }));
    dg.add(mesh(box(0.004, 0.011, 0.005), mats.dark, { pos: [hx, -doorH / 2 + 0.085, 0.023], name: 'keyway', cast: false }));
    const sg = grp('freeze-sign', { pos: [-doorW * 0.14, doorH / 2 - 0.075, 0.013] });
    dg.add(sg);
    sg.add(mesh(rbox(0.22, 0.052, 0.008, 0.004, 2), mats.sign, { name: 'sign-face' }));
    sg.userData.breathe = { speed: 0.5, amount: 0.13, phase: c * 2.1 + (seed % 4) };
    dust(dg, { w: 0.24, h: 0.28, pos: [range(rnd, -0.1, 0.1), range(rnd, -0.1, 0.3), 0.010], kind: 'scratch', color: '#ffffff', opacity: 0.22, seed: seed + c * 31, density: 1.4, spread: 0.04 });
    dust(dg, { w: 0.30, h: 0.16, pos: [range(rnd, -0.14, 0.14), -doorH * 0.34, 0.010], kind: 'dirt', color: '#eaf5f6', opacity: 0.36, seed: seed + c * 37, density: 1.1, spread: 0.03 });
    dg.add(mesh(rbox(doorW - 0.05, 0.13, 0.006, 0.03, 2), mats.frost, { pos: [0, -doorH / 2 + 0.075, -6e-3], name: 'glass-frost', cast: false }));
    for (let i = 0; i < 10; i++) {
      dg.add(mesh(cyl(0.0018, 0.0030, range(rnd, 0.006, 0.018), 6), MAT.water({ opacity: 0.7 }), {
        pos: [range(rnd, -doorW / 2 + 0.04, doorW / 2 - 0.04), range(rnd, -doorH / 2 + 0.06, doorH / 2 - 0.12), 0.010],
        rot: [PI / 2, 0, 0], cast: false, receive: false, name: 'condense',
      }));
    }
  }
  // 扉中央のモリオン
  if (doors > 1) {
    g.add(mesh(box(0.012, doorH + 0.02, 0.018), mats.aluDim, { pos: [0, 0.195 + doorH / 2, D / 2 - 0.018], name: 'mullion' }));
  }

  /* ==================================================== ④上箱（広告・蛍光灯） */
  {
    const tb = grp('top-box');
    g.add(tb);
    const bh = h - yBodyTop;
    tb.add(mesh(box(w, bh, D - 0.06), mats.skin, { pos: [0, yBodyTop + bh / 2, -0.01], name: 'box' }));
    tb.add(mesh(box(w + 0.010, 0.012, D - 0.03), mats.aluDim, { pos: [0, h + 0.006, -5e-3], name: 'crown' }));
    tb.add(mesh(box(w - 0.05, bh - 0.055, 0.010), mats.ad, { pos: [0, yBodyTop + bh / 2 - 0.004, D / 2 - 0.075], name: 'ad-face' }));
    tb.add(mesh(box(w - 0.03, 0.012, 0.018), mats.alu, { pos: [0, yBodyTop + bh - 0.026, D / 2 - 0.076], name: 'ad-hood' }));
    const lamp = grp('ad-lamp', { pos: [0, yBodyTop + bh - 0.055, D / 2 - 0.115] });
    tb.add(lamp);
    lamp.add(mesh(box(w - 0.10, 0.016, 0.024), mats.led, { name: 'fluorescent' }));
    lamp.userData.breathe = { speed: 0.34, amount: 0.12, phase: (seed % 5) };
    dust(tb, { w: w * 0.8, h: 0.16, pos: [range(rnd, -0.1, 0.1), h + 0.013, -0.02], rot: [-PI / 2, 0, 0.35], kind: 'dirt', color: '#7d766a', opacity: 0.44, seed: seed + 51, density: 2.1, spread: 0.03 });
    dust(tb, { w: 0.30, h: bh * 0.5, pos: [w * 0.2, yBodyTop + bh / 2, D / 2 - 0.069], kind: 'dirt', color: '#e2d8bd', opacity: 0.34, seed: seed + 52, density: 0.9 });
    dust(tb, { w: 0.16, h: 0.05, pos: [-w * 0.30, yBodyTop + 0.05, D / 2 - 0.069], kind: 'chip', color: '#cbc2ac', opacity: 0.5, seed: seed + 53, density: 1.2 });
    grill(tb, { w: w - 0.24, h: 0.10, nx: 2, ny: 7, bar: 0.006, mat: mats.aluDim, pos: [0, yBodyTop + bh / 2, -D / 2 + 0.020], rot: [0, PI, 0] });
  }

  /* ==================================================== ⑤下面（脚・コンプレッサ・ドレン） */
  {
    const bot = grp('underside');
    g.add(bot);
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      bot.add(mesh(cyl(0.022, 0.028, 0.055, 10), mats.rubber, { pos: [sx * (HW - 0.09), 0.0275, sz * (D / 2 - 0.09)], name: 'foot' }));
      bot.add(mesh(cyl(0.009, 0.009, 0.060, 8), mats.chrome, { pos: [sx * (HW - 0.09), 0.042, sz * (D / 2 - 0.09)], name: 'foot-bolt', cast: false }));
    }
    // 機械室の膨らみ（背面）
    bot.add(mesh(rbox(0.42, 0.24, 0.16, 0.03, 3), MAT.metalPaint('#7e8388', { worn: 0.85, repeat: 2 }), { pos: [-0.1, 0.20, -D / 2 + 0.02], name: 'compressor' }));
    bot.add(pipe([[-0.1, 0.32, -D / 2 + 0.02], [-0.02, 0.44, -D / 2 - 0.01], [0.16, 0.40, -D / 2 + 0.03], [0.26, 0.30, -D / 2 + 0.01]],
      0.010, MAT.metal('#bda06c', { worn: 0.8 }), { seg: 16, radial: 7, name: 'pipe' }));
    grill(bot, { w: 0.34, h: 0.16, nx: 2, ny: 8, bar: 0.007, mat: mats.aluDim, pos: [-0.1, 0.20, -D / 2 - 0.058], rot: [0, PI, 0] });
    // ドレンパン・ホース・水跡
    bot.add(mesh(box(0.44, 0.030, 0.14), MAT.paint('#6c7068', { shadowAmt: 0.95 }), { pos: [0.10, 0.052, -D / 2 - 0.03], name: 'drip-pan' }));
    bot.add(pipe([[0.10, 0.10, -D / 2 + 0.02], [0.12, 0.06, -D / 2 - 0.03], [0.10, 0.058, -D / 2 - 0.06]],
      0.009, MAT.rubber('#3d4045'), { seg: 10, radial: 6, name: 'drain-hose' }));
    dust(bot, { w: 0.8, h: 0.22, pos: [0, 0.004, D / 2 - 0.08], rot: [-PI / 2, 0, 0.3], kind: 'dirt', color: '#6b6559', opacity: 0.42, seed: seed + 61, density: 1.9, spread: 0.03 });
    dust(bot, { w: 0.4, h: 0.2, pos: [-0.1, 0.10, -D / 2 - 0.06], rot: [0, PI, 0], kind: 'rust', color: '#8a5236', opacity: 0.42, seed: seed + 62, density: 1.6, spread: 0.05 });
    // 銘板
    decal(bot, { map: TEX.signboard({ text: '春日冷研', sub: 'Upright Freezer U-2G · R290', bg: '#dee2df', fg: '#3a3f44' }), w: 0.20, h: 0.06, pos: [HW - 0.14, 0.60, -D / 2 - 0.004], rot: [0, PI, 0], opacity: 0.96 });
  }
  // 前面下部「要冷凍」大表示（框の下・客側から見える）
  {
    const b = grp('front-mark');
    g.add(b);
    b.add(mesh(rbox(0.44, 0.080, 0.008, 0.005, 2), mats.sign, { pos: [-0.1, 0.098, D / 2 + 0.003], name: 'freeze-mark' }));
    dust(b, { w: 0.4, h: 0.06, pos: [-0.1, 0.098, D / 2 + 0.009], kind: 'scratch', color: '#f2f6f2', opacity: 0.3, seed: seed + 71, density: 1.5, spread: 0.02 });
  }
  return finish(g, { outline: 'normal', minSize: 0.026 });
}

export { build, build as default, meta };
