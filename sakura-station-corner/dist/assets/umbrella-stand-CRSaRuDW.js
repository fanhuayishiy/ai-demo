import { g as grp, M as MAT, P as PAL, m as mesh, c as cyl, r as rbox, T as TEX, b as box, i as grill, w as weather, h as decal, t as tor, n as range, p as shadowBlob, q as finish, a4 as RepeatWrapping, X as cone, aj as BackSide, k as tubeOf, a as sph, o as lathe, z as rand } from './index-yWEMv7O8.js';

//  assets/street/umbrella-stand.js —— 店舗前の雨伞架（枠＋傘 5~7 本を個別 Mesh で独立建模）
//  構成：亜鉛メッキ枠＋樹脂エンドキャップ／水受けトレイ／番号札／「傘立て」札／盗難注意ステッカー
//  傘：透明ビニール長傘×3（うち 1 本是骨 1 本折れ・1 本是柄が曲がり）、折り畳み傘×2、子供用キャラ傘×1

const meta = {
  id: 'umbrella-stand',
  real: [0.54, 0.66, 0.19],      // 枠 H=0.55、傘を立てた天端 0.652（実測 bbox 準拠）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

/** 共有テクチャの一部を切り出す（DOM 使わず repeat/offset のみで正規化クロップ） */
function crop(tex, x0, y0, x1, y1) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(x1 - x0, y1 - y0);
  t.offset.set(x0, y0);
  return t;
}
/** 平面系（水盤・ミラー面）は描边壳を付けると不自然になるので除外 */
function noOutline(o) {
  o.userData.noOutline = true;
  return o;
}

/* 閉じた長傘の布束（先端は細く閉じる） */
function bundleGeo(len, rBottom, rMid, rTop) {
  return lathe([
    [0, 0],
    [rBottom * 0.62, len * 0.08],
    [rBottom, len * 0.26],
    [rMid, len * 0.58],
    [rTop, len * 0.86],
    [rTop * 0.45, len],
    [0, len],
  ], 12);
}
/** 親骨 1 本：円柱束の外面を走る細いチューブ */
function ribGeo(len, r, ang, bow) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const pts = [
    [c * r * 0.30, len * 0.05, s * r * 0.30],
    [c * r * 0.92, len * 0.30, s * r * 0.92],
    [c * (r + bow), len * 0.60, s * (r + bow)],
    [c * r * 0.86, len * 0.88, s * r * 0.86],
    [c * r * 0.30, len, s * r * 0.30],
  ];
  return tubeOf(pts, 0.0016, 12, 5);
}

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const slots = Math.max(3, Math.min(8, options.slots ?? 6));
  const count = Math.max(5, Math.min(7, slots));           // 傘は 5~7 本

  const g = grp('umbrella-stand');

  /* ---------------- 基本寸法 ---------------- */
  const W = 0.54, D = 0.17, H = 0.55;
  const pitch = 0.08;
  const xOf = (i) => (i - (slots - 1) / 2) * pitch;
  const ringR = 0.033, ringTube = 0.006;

  /* ---------------- マテリアル ---------------- */
  const zinc = MAT.galvanized({ repeat: 3 });
  const zincFine = MAT.galvanized({ repeat: 6, uv: { repeat: [5, 5] } });
  const steel = MAT.darkIron({ repeat: 4 });
  const resin = MAT.hardPlastic(PAL.lampBlack, { repeat: 4 });
  const resinAmber = MAT.hardPlastic(PAL.storeBand2, { repeat: 4, sat: 0.94 });
  const vinyl = MAT.glassLite({ color: '#e9f4f6', opacity: 0.34 });        // 透明ビニール
  const vinylTint = MAT.glassLite({ color: '#dfeef0', opacity: 0.30 });
  const ribMat = MAT.darkIron({ spec: 0.5 });
  const gripBlack = MAT.rubber('#2b2e33');
  const gripBlue = MAT.rubber('#3d76b4');
  const plate = MAT.paint(PAL.paint, { steps: 2 });
  MAT.metalPaint(PAL.lampGreen, { worn: 0.75, repeat: 3 });

  /* ================= 枠：水受けトレイ ================= */
  const tray = grp('tray');
  g.add(tray);
  // 脚（樹脂 4 点、錆た金具）
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? -1 : 1;
    tray.add(mesh(cyl(0.017, 0.019, 0.013, 12), resin, { pos: [sx * (W / 2 - 0.035), 0.0065, sz * (D / 2 - 0.032)] }));
    tray.add(mesh(cyl(0.008, 0.008, 0.017, 8), steel, { pos: [sx * (W / 2 - 0.035), 0.016, sz * (D / 2 - 0.032)] }));
  }
  // トレイ本体（厚みあり・内面あり）
  tray.add(mesh(rbox(W, 0.052, D, 0.009, 2), zinc, { pos: [0, 0.039, 0] }));
  const inner = mesh(rbox(W - 0.036, 0.040, D - 0.030, 0.006, 2), MAT.paint('#8f938f', { steps: 2, shadowAmt: 0.98 }), { pos: [0, 0.045, 0] });
  tray.add(inner);
  // 砂利状の底＋滞留した水（薄層）
  tray.add(noOutline(mesh(box(W - 0.046, 0.004, D - 0.040), MAT.paint(PAL.dirt, { tint: '#9a9078', steps: 3, map: TEX.concrete({ base: PAL.dirt, repeat: 6 }).map }), { pos: [0, 0.028, 0] })));
  tray.add(noOutline(mesh(box(W * 0.55, 0.0035, D * 0.40), MAT.water({ opacity: 0.5, scroll: [0.004, 0.003] }), { pos: [-0.03, 0.0315, 0.012] })));
  // 排水グリル（トレイ天面）
  grill(tray, { w: W - 0.075, h: D - 0.062, nx: 12, ny: 3, bar: 0.0055, mat: zincFine, pos: [0, 0.0635, 0], rot: [-Math.PI / 2, 0, 0] });
  // 泥・水跡・苔（経年 1・2）
  weather(tray, { w: 0.22, h: 0.08, pos: [0.02, 0.0685, 0.004], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5d5347', opacity: 0.5, seed: seed + 11, density: 1.5, spread: 0.008 });
  weather(tray, { w: 0.16, h: 0.07, pos: [-0.1, 0.0695, -0.018], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 12, density: 1.2, spread: 0.006 });
  weather(tray, { w: 0.12, h: 0.05, pos: [0.13, 0.0705, 0.026], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#7d6a4e', opacity: 0.35, seed: seed + 13, spread: 0.006 });

  /* ================= 枠：柱・側板・背板 ================= */
  const frame = grp('frame');
  g.add(frame);
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? -1 : 1;
    frame.add(mesh(box(0.019, H - 0.06, 0.019), zinc, { pos: [sx * (W / 2 - 0.016), 0.062 + (H - 0.06) / 2, sz * (D / 2 - 0.016)] }));
    // 樹脂エンドキャップ
    frame.add(mesh(rbox(0.023, 0.014, 0.023, 0.004, 2), resin, { pos: [sx * (W / 2 - 0.016), H - 0.006, sz * (D / 2 - 0.016)] }));
  }
  // 側板（パンチング風：板＋打抜き風の暗溝 2 本）
  for (const sx of [-1, 1]) {
    const px = sx * (W / 2 - 0.008);
    frame.add(mesh(box(0.013, 0.44, D - 0.026), zincFine, { pos: [px, 0.292, 0] }));
    frame.add(mesh(box(0.0145, 0.012, D - 0.030), MAT.paint('#6f7371', { shadowAmt: 1, steps: 2 }), { pos: [px, 0.20, 0] }));
    frame.add(mesh(box(0.0145, 0.012, D - 0.030), MAT.paint('#6f7371', { shadowAmt: 1, steps: 2 }), { pos: [px, 0.38, 0] }));
  }
  // 背板（飛び出し防止・傘の影が枠外へ漏れないための受け）
  const back = grp('back-panel');
  frame.add(back);
  back.add(mesh(box(W - 0.034, 0.33, 0.011), zinc, { pos: [0, 0.285, -0.07400000000000001] }));
  back.add(mesh(box(W - 0.034, 0.013, 0.013), steel, { pos: [0, 0.452, -0.07400000000000001] }));
  // 雨だれ・退色・錆（経年 3・4）／内側の黒ズミ
  weather(back, { w: W - 0.12, h: 0.26, pos: [0, 0.31, -0.081], rot: [0, Math.PI, 0], kind: 'rust', color: '#8a6a4a', opacity: 0.42, seed: seed + 21, density: 1.3, spread: 0.012 });
  weather(back, { w: 0.14, h: 0.10, pos: [-0.13, 0.15, -0.082], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 22, spread: 0.01 });
  weather(back, { w: 0.28, h: 0.14, pos: [0.02, 0.20, -0.0655], kind: 'dirt', color: '#3d3a34', opacity: 0.55, seed: seed + 23, density: 1.7, spread: 0.01 });

  /* ================= 枠：前バンドと銘板 ================= */
  const front = grp('front-panel');
  g.add(front);
  front.add(mesh(box(W - 0.034, 0.205, 0.012), zinc, { pos: [0, 0.166, D / 2 - 0.012] }));
  front.add(mesh(box(W - 0.034, 0.014, 0.014), steel, { pos: [0, 0.272, D / 2 - 0.012] }));
  // 「傘立て」銘板（板＋刷面）
  const sign = grp('sign-umbrella');
  front.add(sign);
  sign.add(mesh(rbox(0.226, 0.058, 0.007, 0.002, 2), plate, { pos: [-0.075, 0.176, D / 2 - 0.0035] }));
  decal(sign, {
    map: TEX.signboard({ text: '傘立て', bg: '#f2ece0', fg: '#3d4247' }),
    w: 0.20, h: 0.05, pos: [-0.075, 0.176, D / 2 + 0.0006],
  });
  // 盗難注意ステッカー（色褪せ）
  const sticker = mesh(rbox(0.155, 0.040, 0.004, 0.0015, 2), MAT.paint(PAL.storeBand3, { sat: 0.72, tint: '#f7e6dc' }), { pos: [0.145, 0.207, D / 2 - 0.004] });
  front.add(sticker);
  decal(front, {
    map: TEX.signboard({ text: '盗難注意', sub: '防犯カメラ作動中', bg: '#c8564d', fg: '#fbf3e6' }),
    w: 0.146, h: 0.0365, pos: [0.145, 0.207, D / 2 - 0.0014], opacity: 0.9,
  });
  // 貼紙残り（剥がした後の白抜き・糊跡）
  decal(front, { map: TEX.wear({ kind: 'chip', color: '#e9e2d0', seed: seed + 31, density: 1.4 }), w: 0.10, h: 0.075, pos: [0.055, 0.126, D / 2 - 0.0042], opacity: 0.72, rot: [0, 0, 6 * D2R] });
  weather(front, { w: 0.26, h: 0.09, pos: [-0.06, 0.112, D / 2 - 0.0040], kind: 'chip', color: '#8d8b84', opacity: 0.5, seed: seed + 32, density: 1.2, spread: 0.01 });   // 塗装剥がれ（経年 5）
  weather(front, { w: 0.16, h: 0.14, pos: [0.14, 0.142, D / 2 - 0.0038], kind: 'dirt', color: '#6a5f4d', opacity: 0.4, seed: seed + 33, spread: 0.01 });

  /* ================= 枠：傘リング（各スロット独立） ================= */
  const rails = grp('rails');
  g.add(rails);
  for (const y of [0.135, 0.462]) {
    for (const sz of [-1, 1]) {
      rails.add(mesh(box(W - 0.042, 0.013, 0.013), zinc, { pos: [0, y, sz * 0.0365] }));
    }
  }
  for (let i = 0; i < slots; i++) {
    const x = xOf(i);
    const slot = grp(`slot-${i}`);
    rails.add(slot);
    for (const y of [0.135, 0.462]) {
      slot.add(mesh(tor(ringR, ringTube, 7, 14), zincFine, { pos: [x, y, 0], rot: [-90 * D2R, 0, 0] }));
      // リング補強タビ（前后レールへ溶接）
      for (const sz of [-1, 1]) {
        slot.add(mesh(box(0.010, 0.012, 0.014), steel, { pos: [x, y, sz * 0.034] }));
      }
    }
    // スロット仕切り板（樹脂）— 傘同士・傘と枠の接触を減らす
    if (i < slots - 1) {
      slot.add(mesh(rbox(0.005, 0.30, 0.062, 0.002, 1), resinAmber, { pos: [x + pitch / 2, 0.30, 0] }));
    }
    // 番号札（傘の番号）
    const nTag = mesh(rbox(0.030, 0.050, 0.005, 0.0015, 2), MAT.paint(PAL.markingYellow, { sat: 0.8, tint: '#fff4dd' }), { pos: [x, 0.415, 0.045], rot: [6 * D2R, 0, 0] });
    slot.add(nTag);
    decal(slot, {
      map: crop(TEX.lightPanel({ text: String(i + 1), bg: '#f0c353', fg: '#4a3a22', mode: 'sign' }), 0.34, 0.06, 0.66, 0.96),
      w: 0.026, h: 0.044, pos: [x, 0.4155, 0.0482], rot: [6 * D2R, 0, 0],
    });
    slot.add(mesh(box(0.010, 0.010, 0.010), steel, { pos: [x, 0.441, 0.040] }));
  }
  for (const x of [-0.16, 0.09]) {   // 経年 6：リング・レール錆
    weather(rails, { w: 0.10, h: 0.05, pos: [x, 0.135, 0.0452], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 41, density: 1.6, count: 2, spread: 0.01 });
  }

  /* ============================================================
   *  傘 5~7 本 —— 1 本ずつ独立 Group / 独立 Mesh
   *  ・リング位置で x が固定されるので互いに接触しない
   *  ・布・骨・水滴は castShadow=false → 影が枠から漏れない
   * ========================================================== */
  const tipMat = MAT.stainless({ repeat: 6 });

  /** 透明ビニール長傘（先端を下向きに収納） */
  function vinylLong({ tint = vinyl, bent = false, brokenRib = -1, grip = gripBlack, ribs = 8, tag = '' }) {
    const u = grp(`umbrella-vinyl${tag}`);
    const yTip = 0.078;
    const bLen = 0.425;                                    // 布束の長さ
    const yShaftTop = 0.602;
    // シャフト（芯金）
    const sLen = yShaftTop - 0.056;
    u.add(mesh(cyl(0.0055, 0.0052, sLen, 10), MAT.metal('#b4b8bb', { repeat: 5 }), { pos: [0, 0.056 + sLen / 2, 0] }));
    // 先端金具（フェルール）
    u.add(mesh(cyl(0.0075, 0.0058, 0.026, 9), tipMat, { pos: [0, yTip + 0.012, 0] }));
    u.add(noOutline(mesh(cone(0.0055, 0.014, 8), tipMat, { pos: [0, yTip - 0.004, 0], rot: [180 * D2R, 0, 0], cast: false })));
    // 布束（透明ビニール）
    const bun = mesh(bundleGeo(bLen, 0.0225, 0.0245, 0.0155), tint, { pos: [0, yTip + 0.014, 0], cast: false, receive: false });
    u.add(bun);
    // 布の内面（二重にし中身が見えるようにする）
    u.add(noOutline(mesh(bundleGeo(bLen * 0.985, 0.0195, 0.0212, 0.0132), MAT.glassLite({ color: '#cfe3e6', opacity: 0.22, side: BackSide }), { pos: [0, yTip + 0.016, 0], cast: false, receive: false })));
    // 親骨
    for (let k = 0; k < ribs; k++) {
      const a = (k / ribs) * Math.PI * 2 + 0.2;
      if (k === brokenRib) continue;
      u.add(noOutline(mesh(ribGeo(bLen, 0.0235, a, 0.0035), ribMat, { pos: [0, yTip + 0.014, 0], cast: false })));
    }
    // 折れた骨 1 本：根元は束に沿うが途中で外側へへし折れて垂れる
    if (brokenRib >= 0) {
      const a = (brokenRib / ribs) * Math.PI * 2 + 2.35;   // 背板側（-Z）へ折れる
      const c = Math.cos(a), s = Math.sin(a);
      const y0 = yTip + 0.014;
      const lower = tubeOf([
        [c * 0.007, bLen * 0.06, s * 0.007],
        [c * 0.020, bLen * 0.26, s * 0.020],
        [c * 0.0235, bLen * 0.42, s * 0.0235],
      ], 0.0016, 8, 5);
      u.add(noOutline(mesh(lower, ribMat, { pos: [0, y0, 0], cast: false })));
      const kink = y0 + bLen * 0.42;
      u.add(noOutline(mesh(tubeOf([
        [c * 0.0235, kink, s * 0.0235],
        [c * 0.0372, kink + 0.026, s * 0.0372],
        [c * 0.0405, kink + 0.006, s * 0.0405],
        [c * 0.0378, kink - 0.034, s * 0.0378],
      ], 0.0015, 10, 5), ribMat, { cast: false })));
      // 折れた親骨の先金（ロッド）が垂れ下がる
      u.add(noOutline(mesh(cyl(0.0028, 0.0022, 0.030, 6), ribMat, {
        pos: [c * 0.0378, kink - 0.052, s * 0.0378], rot: [14 * D2R * (s > 0 ? 1 : -1), 0, 16 * D2R * c], cast: false,
      })));
    }
    // スライダー（開閉管）とストラップ
    u.add(mesh(cyl(0.0092, 0.0092, 0.042, 10), MAT.hardPlastic('#d8d5cc', { repeat: 6 }), { pos: [0, yTip + bLen * 0.86, 0], cast: false }));
    u.add(mesh(tor(0.0205, 0.0026, 6, 14), MAT.rubber('#4b4f55'), { pos: [0, yTip + bLen * 0.78, 0], rot: [-90 * D2R, 0, 0], cast: false }));
    // 柄（グリップ）
    const yTop = 0.578;
    if (bent) {
      // 柄が塑性変形で曲がった個体
      u.add(noOutline(mesh(tubeOf([
        [0, yTop - 0.006, 0], [0.0012, yTop + 0.026, 0.002], [0.0065, yTop + 0.046, 0.009],
        [0.0035, yTop + 0.062, 0.022], [-45e-4, yTop + 0.0655, 0.0335],
      ], 0.0086, 14, 8), grip, { cast: false })));
    } else {
      u.add(noOutline(mesh(tubeOf([
        [0, yTop - 0.006, 0], [0, yTop + 0.022, 0], [0.0015, yTop + 0.042, 0.004], [0.004, yTop + 0.0575, 0.0155],
        [0.002, yTop + 0.0625, 0.0295], [-2e-3, yTop + 0.053, 0.0405], [-3e-3, yTop + 0.0385, 0.0435],
      ], 0.0084, 18, 8), grip, { cast: false })));
    }
    // 先端の水滴（骨先・布端から垂れる）
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 1.1;
      u.add(noOutline(mesh(sph(0.0032, 7, 6), MAT.water({ opacity: 0.72, scroll: [0.001, 0.004] }), {
        pos: [Math.cos(a) * 0.0245, yTip + 0.016 + k * 0.014, Math.sin(a) * 0.0245], scale: [1, 1.5, 1], cast: false, receive: false,
      })));
    }
    return u;
  }

  /** 折り畳み傘：収納ケース（布）＋布束 */
  function folding({ caseColor = '#3f4a63', clothColor = '#4a5364', strapColor = '#8d8f8c' } = {}) {
    const u = grp('umbrella-folding');
    const yBase = 0.070, h = 0.44;
    // 収納ケース（布製・底と口を閉じた車輪断面）
    u.add(mesh(lathe([
      [0, 0], [0.0165, 0.0015], [0.0232, 0.0075], [0.0244, 0.022],
      [0.0246, h * 0.60], [0.0230, h * 0.665], [0.0148, h * 0.695], [0.0140, h * 0.72], [0, h * 0.72],
    ], 14), MAT.fabric({ color: caseColor, repeat: 10 }), { pos: [0, yBase, 0] }));
    // ケース口のパイピング＋引き紐
    u.add(mesh(tor(0.0228, 0.0023, 6, 16), MAT.fabric({ color: '#2b3040', repeat: 12 }), { pos: [0, yBase + h * 0.612, 0], rot: [-90 * D2R, 0, 0], cast: false }));
    u.add(noOutline(mesh(tubeOf([[0.0215, yBase + h * 0.60, 0.004], [0.0305, yBase + h * 0.50, 0.0085], [0.0275, yBase + h * 0.385, 0.0025]], 0.0016, 8, 5), MAT.rubber('#c9c3b4'), { cast: false })));
    u.add(noOutline(mesh(sph(0.0035, 7, 5), MAT.rubber('#c9c3b4'), { pos: [0.0275, yBase + h * 0.38, 0.0025], cast: false })));
    // 布束（ケース口から突き出る：根元はケース内に隠す）
    const bH = 0.215, y0 = yBase + h * 0.55;
    u.add(mesh(bundleGeo(bH, 0.0152, 0.0168, 0.0118), MAT.fabric({ color: clothColor, repeat: 9 }), { pos: [0, y0, 0], cast: false }));
    // 布の上に出る骨のこぶ（6 本）
    for (let k = 0; k < 6; k++) {
      u.add(noOutline(mesh(ribGeo(bH, 0.0156, (k / 6) * Math.PI * 2, 0.0016), ribMat, { pos: [0, y0, 0], cast: false })));
    }
    // トップキャップ（樹脂）＋マジックストラップ
    u.add(mesh(rbox(0.019, 0.015, 0.019, 0.005, 2), MAT.hardPlastic('#2f3339', { repeat: 6 }), { pos: [0, y0 + bH + 0.002, 0], cast: false }));
    u.add(mesh(tor(0.0208, 0.0028, 6, 14), MAT.rubber(strapColor), { pos: [0, 0.458, 0], rot: [-90 * D2R, 0, 0], cast: false }));
    return u;
  }

  /** 子供用キャラクター長傘（短め・鮮色・丸い先金） */
  function kidUmbrella() {
    const u = grp('umbrella-kid');
    const yTip = 0.080, bLen = 0.33;
    u.add(mesh(cyl(0.005, 0.0048, 0.41, 10), MAT.metal('#c0c4c6', { repeat: 5 }), { pos: [0, 0.265, 0] }));
    const cloth = MAT.fabric({ color: '#e9738a', repeat: 7 });
    u.add(mesh(bundleGeo(bLen, 0.0235, 0.0255, 0.019), cloth, { pos: [0, yTip + 0.012, 0], cast: false }));
    for (let k = 0; k < 8; k++) {
      u.add(noOutline(mesh(ribGeo(bLen, 0.0245, (k / 8) * Math.PI * 2, 0.0042), MAT.darkIron({ spec: 0.45 }), { pos: [0, yTip + 0.012, 0], cast: false })));
    }
    // キャラクターシール（色褪せ）
    decal(u, { map: crop(TEX.lightPanel({ text: '春', bg: '#fbd9e4', fg: '#c2564a', mode: 'sign' }), 0.33, 0.05, 0.67, 0.95), w: 0.024, h: 0.030, pos: [0.0248, yTip + 0.16, 0.008], rot: [0, 70 * D2R, 0], opacity: 0.88 });
    decal(u, { map: crop(TEX.lightPanel({ text: '玉', bg: '#f2b23c', fg: '#5a4520', mode: 'sign' }), 0.33, 0.05, 0.67, 0.95), w: 0.019, h: 0.024, pos: [-0.0125, yTip + 0.235, 0.0212], rot: [0, -30 * D2R, 0], opacity: 0.8 });
    // 安全丸先金
    u.add(noOutline(mesh(sph(0.0072, 8, 6), MAT.hardPlastic(PAL.storeBand2, { repeat: 6 }), { pos: [0, yTip + 0.004, 0], cast: false })));
    // スライダーとストラップ
    u.add(mesh(cyl(0.0085, 0.0085, 0.036, 10), MAT.plastic('#7fb0dd'), { pos: [0, yTip + bLen + 0.018, 0], cast: false }));
    u.add(mesh(tor(0.0215, 0.0024, 6, 14), MAT.rubber('#c2564a'), { pos: [0, yTip + bLen * 0.82, 0], rot: [-90 * D2R, 0, 0], cast: false }));
    // 丸ハンドル（子供用 C 型）
    const yTop = yTip + bLen + 0.046;
    u.add(noOutline(mesh(tubeOf([
      [0, yTop - 0.004, 0], [0, yTop + 0.028, 0], [0.004, yTop + 0.052, 0.006], [0.002, yTop + 0.066, 0.022], [-4e-3, yTop + 0.062, 0.034],
    ], 0.0090, 14, 8), MAT.rubber('#3d76b4'), { cast: false })));
    return u;
  }

  /* ---- 傘の並び（スロット位置に 1 本ずつ、互いに非接触） ---- */
  const kinds = [
    () => vinylLong({ tag: '-A' }),
    () => folding({ caseColor: '#39465e', clothColor: '#4a5364', strapColor: '#8d8f8c' }),
    () => vinylLong({ bent: true, grip: gripBlue, tint: vinylTint, tag: '-bent' }),
    () => kidUmbrella(),
    () => vinylLong({ brokenRib: 2, tag: '-broken' }),
    () => folding({ caseColor: '#5d4a52', clothColor: '#6b5560', strapColor: '#b9a06a' }),
    () => vinylLong({ tint: vinylTint, grip: MAT.rubber('#6b5560'), tag: '-G' }),
  ];
  const umbrellas = grp('umbrellas');
  g.add(umbrellas);
  for (let i = 0; i < count; i++) {
    const u = kinds[i % kinds.length]();
    u.position.set(xOf(i), 0, range(rnd, -4e-3, 0.004));
    u.rotation.z = range(rnd, -1.4, 1.4) * D2R;
    u.rotation.x = range(rnd, -1.4, 1.4) * D2R;
    u.rotation.y = range(rnd, -40, 40) * D2R;
    umbrellas.add(u);
  }
  // 傘の根元（トレイ上）に落ちた水滴跡
  for (let i = 0; i < count; i++) {
    umbrellas.add(noOutline(mesh(cyl(0.016 + rnd() * 0.008, 0.015, 0.0022, 10), MAT.water({ opacity: 0.42 }), { pos: [xOf(i), 0.0325, range(rnd, -0.012, 0.012)], cast: false, receive: false })));
  }

  /* ---------------- 接触影・全体の経年 ---------------- */
  shadowBlob(g, { r: 0.29, pos: [0, 0.002, 0], opacity: 0.3, ratio: 0.32 });
  weather(frame, { w: 0.10, h: 0.26, pos: [-0.271, 0.20, 0.02], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 51, density: 1.5, spread: 0.012 });   // 経年 7：側板錆
  weather(frame, { w: 0.09, h: 0.13, pos: [W / 2 + 0.001, 0.12, -0.02], rot: [0, Math.PI / 2, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 52, spread: 0.012 });
  weather(tray, { w: W - 0.08, h: 0.04, pos: [0, 0.055, D / 2 - 0.0025], kind: 'chip', color: '#b9b5ac', opacity: 0.45, seed: seed + 53, density: 1.6, spread: 0.008 });   // 経年 8：トレイ縁の塗装剥がれ

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
