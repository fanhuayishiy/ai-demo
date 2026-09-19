//  assets/store/backroom-door.js —— 後扉（東壁 x=-1.9 側に取り付く鋼製防火扉まわり一式）
//  原点 = 壁の取り付き面（local z=0）と地面（y=0）の交線の中点 / +Y 上 / 建物の外側が +Z
//  装配層は世界 (-1.9, 0, 0.4)・rotY=90 で置く（→ local +Z = 東＝外側、local +X = 北側）。
import {
  grp, mesh, box, cyl, rbox, sph, tor, finish, rand, range, put,
  weather, decal, shadowBlob, grill,
} from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'backroom-door',
  real: [1.10, 2.62, 0.62],        // 枠外寸＋上部換気グリル＋扉前段差の張り出し
  origin: 'wall-foot-center',      // 壁面 z=0 × 地面 y=0 の交線中心
  front: '+Z = 建物の外側（東）',
};

const D2R = Math.PI / 180;
const noOut = (o) => { o.userData.noOutline = true; return o; };

export function build(options = {}) {
  const seed = options.seed ?? 227;
  const rnd = rand(seed);
  const g = grp('backroom-door');

  /* ---------------- 寸法 ---------------- */
  const W = Math.max(0.62, options.width ?? 0.9);       // 開口幅
  const H = Math.max(1.6, options.height ?? 2.0);       // 開口高さ
  const yS = 0.12;                                      // 段差天端＝室内地坪
  const openDeg = options.open ?? 0;                    // 扉の開き角（度・外開き）
  const fl = 0.078;                                     // 枠フランジ幅
  const fD = 0.062;                                     // 枠の壁からの突き出し
  const yO0 = yS - 0.004;                               // 開口下端
  const yO1 = yO0 + H;                                  // 開口上端
  const xL = -W / 2, xR = W / 2;

  /* ---------------- 材質（鋼・アルミ・亜鉛・ゴム・モルタル・ガラス） ---------------- */
  const steel = MAT.metalPaint('#b9bfb4', { worn: 0.62, repeat: 3, tint: '#eef2e6', sat: 0.95 });     // 鋼製防火扉（淡灰緑）
  const steelFrame = MAT.metalPaint(PAL.storeWallTrim, { worn: 0.85, repeat: 4, tint: '#f4ecda' });   // 枠（再塗装ムラ）
  const alu = MAT.metal('#ccd2d4', { spec: 0.62, repeat: 5 });
  const galv = MAT.galvanized({ repeat: 4 });
  const iron = MAT.darkIron({ repeat: 6 });
  const rubber = MAT.rubber('#31343a');
  const gasket = MAT.rubber('#22252a', { steps: 2 });
  const deep = MAT.paint('#191b1a', { steps: 2, shadowAmt: 1, spec: 0.02 });
  const concrete = MAT.concrete({ base: PAL.concrete, repeat: 1, joints: 2 });
  const mortar = MAT.paint('#cdc6b5', { map: TEX.concrete({ base: '#d2cbbb', repeat: 1 }).map, spec: 0.05, shadowAmt: 0.94, steps: 3 });
  const glass = MAT.glassLite({ color: PAL.glassTint, opacity: 0.36 });
  const plateWhite = MAT.paint(PAL.marking, { steps: 2, sat: 0.9, tint: '#f7f2e4' });
  const markYellow = MAT.marking(PAL.markingYellow, { sat: 0.72, tint: '#f2e6c2' });

  /* ================= １. 扉枠（アングル枠）＋シーリング劣化 ================= */
  const frame = grp('door-frame');
  g.add(frame);
  const zc = fD / 2 + 0.004;
  for (const sx of [-1, 1]) {
    const fx = sx < 0 ? xL : xR;
    frame.add(mesh(box(fl, H + 0.02, fD), steelFrame, { pos: [fx + sx * fl / 2, (yO0 + yO1) / 2, zc] }));
    // 内側の戸当たり（rebate stop）
    frame.add(mesh(box(0.014, H, 0.030), steelFrame, { pos: [fx - sx * 0.007, (yO0 + yO1) / 2, 0.030] }));
    // 枠と壁の取り合いのシーリング（打ち増し・劣化で切れ目）
    frame.add(mesh(box(0.013, H + 0.01, 0.010), gasket, { pos: [fx + sx * (fl + 0.006), (yO0 + yO1) / 2, 0.007] }));
    frame.add(noOut(mesh(box(0.016, 0.09, 0.011), mortar, { pos: [fx + sx * (fl + 0.007), yO0 + H * (sx < 0 ? 0.28 : 0.66), 0.0085], cast: false })));  // 打ち増し補修
    // 枠据付ボルト（片側 3 箇所）とまわりの錆
    for (let i = 0; i < 3; i++) {
      const y = yO0 + 0.26 + i * ((H - 0.52) / 2);
      frame.add(mesh(cyl(0.0088, 0.0088, 0.010, 6), iron, { pos: [fx + sx * fl * 0.55, y, fD + 0.003], rot: [90 * D2R, 0, 0] }));
      frame.add(mesh(cyl(0.0145, 0.0145, 0.0035, 10), alu, { pos: [fx + sx * fl * 0.55, y, fD + 0.0045], rot: [90 * D2R, 0, 0] }));
      weather(frame, { w: 0.05, h: 0.07, pos: [fx + sx * fl * 0.55, y - 0.055, fD + 0.0052], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 30 + i * 3 + sx, density: 1.7, spread: 0.005 });
    }
  }
  // 上部枠（ヘッダー）＋雨仕舞の水切
  frame.add(mesh(box(W + fl * 2, fl, fD), steelFrame, { pos: [0, yO1 + fl / 2, zc] }));
  frame.add(mesh(box(W + fl * 2 + 0.02, 0.014, 0.026), alu, { pos: [0, yO1 + fl + 0.004, fD - 0.004] }));
  frame.add(mesh(box(W + fl * 2, 0.010, 0.010), gasket, { pos: [0, yO1 + 0.004, 0.010] }));
  // 枠の再塗装ムラ（上部だけ新しく塗り直した段違い）
  decal(frame, { map: TEX.gradient({ stops: [[0, 'rgba(250,247,238,1)'], [0.42, 'rgba(238,232,214,0.5)'], [1, 'rgba(214,206,186,0)']] }), w: W + fl * 2, h: H * 0.55, pos: [0, yO0 + H * 0.74, fD + 0.0062], opacity: 0.5 });
  weather(frame, { w: 0.16, h: 0.22, pos: [xR - 0.01, yO0 + 0.18, fD + 0.0052], kind: 'chip', color: '#9d968a', opacity: 0.55, seed: seed + 33, density: 1.9, spread: 0.006 });
  weather(frame, { w: 0.26, h: 0.07, pos: [0, yO1 + fl - 0.018, fD + 0.0052], kind: 'rust', color: '#8a5236', opacity: 0.42, seed: seed + 34, density: 1.4, spread: 0.004 });

  /* ================= ２. 開口まわりの壁（欠け・補修・開閉による当り傷） ================= */
  const wall = grp('wall-around');
  g.add(wall);
  for (const sx of [-1, 1]) {
    // 枠際の欠け落ちたモルタル（ひとまわり別の色で補修）
    wall.add(mesh(rbox(0.10, H * 0.82, 0.012, 0.02, 2), mortar, { pos: [sx * (xR + fl + 0.056), (yO0 + yO1) / 2 - 0.04, 0.008] }));
    if (sx > 0) {
      // 扉の開閉で削れた弧状の当り傷（開く側の壁）
      for (let i = 0; i < 5; i++) {
        wall.add(noOut(mesh(box(0.020, range(rnd, 0.05, 0.16), 0.006), mortar, {
          pos: [xR + 0.19 + i * 0.030, yO0 + 0.30 + i * 0.16 + range(rnd, -0.03, 0.03), 0.0065],
          rot: [0, 0, range(rnd, -0.4, 0.4)], cast: false,
        })));
      }
      weather(wall, { w: 0.18, h: 0.7, pos: [xR + 0.28, yO0 + 0.62, 0.009], kind: 'scratch', color: '#8f887a', opacity: 0.5, seed: seed + 41, density: 2.1, spread: 0.02 });
      // 当り止め（ゴムブロック）＝ 突き当たり
      wall.add(mesh(rbox(0.05, 0.10, 0.026, 0.008, 2), rubber, { pos: [xR + 0.33, yO0 + 0.26, 0.015] }));
      wall.add(mesh(cyl(0.008, 0.008, 0.014, 8), iron, { pos: [xR + 0.33, yO0 + 0.26, 0.030], rot: [90 * D2R, 0, 0] }));
    }
  }
  // 壁厚の中の羽口（主体側に穴があいても素通しにしない）＋内部の暗がり
  for (const sx of [-1, 1]) wall.add(mesh(box(0.010, H, 0.17), steelFrame, { pos: [sx * (xR - 0.005), (yO0 + yO1) / 2, -0.082] }));
  wall.add(mesh(box(W, 0.010, 0.17), steelFrame, { pos: [0, yO1 - 0.005, -0.082] }));
  wall.add(mesh(box(W - 0.03, H - 0.03, 0.008), deep, { pos: [0, (yO0 + yO1) / 2, -0.162], cast: false }));
  // 壁のひび・補修パテ・コーキング打ち増し
  weather(wall, { w: 0.5, h: 1.1, pos: [xL - 0.34, yO0 + 0.72, 0.009], kind: 'scratch', color: '#928b7c', opacity: 0.42, seed: seed + 45, density: 1.4, spread: 0.01 });
  wall.add(mesh(rbox(0.16, 0.075, 0.009, 0.02, 2), mortar, { pos: [xL - 0.30, yO0 + 0.30, 0.006] }));
  wall.add(noOut(mesh(box(0.30, 0.012, 0.011), MAT.rubber('#c8c2b2', { steps: 2 }), { pos: [0.02, yO1 + fl + 0.055, 0.008], rot: [0, 0, 0.02], cast: false })));
  // 地面際の湧き汚れ・苔
  weather(wall, { w: 0.9, h: 0.22, pos: [0, 0.10, 0.010], kind: 'moss', color: PAL.moss, opacity: 0.42, seed: seed + 47, density: 1.7, spread: 0.01 });
  weather(wall, { w: 0.6, h: 0.9, pos: [xL - 0.22, yO0 + 0.55, 0.0095], kind: 'dirt', color: '#6f665a', opacity: 0.3, seed: seed + 48, density: 1.2, spread: 0.012 });

  /* ================= ３. 扉本体（丁番側を回転軸に） ================= */
  const Wl = W - 0.026, Hl = H - 0.014;
  const hinge = grp('door-leaf');
  hinge.position.set(xL + 0.014, yO0 + 0.009, 0.056);
  hinge.rotation.y = -openDeg * D2R;
  g.add(hinge);
  const lz = 0.024;                                     // 扉板の中心 z（扉群ローカル）
  const wX = Wl * 0.46, wY = Hl * 0.71, wW = 0.125, wH = 0.085;
  const plate = (w, h, y) => mesh(rbox(w, h, 0.046, 0.004, 2), steel, { pos: [w / 2, y, lz] });
  hinge.add(plate(Wl, wY - wH - 0.055, (wY - wH - 0.055) / 2));
  hinge.add(plate(Wl, Hl - (wY + wH) - 0.030, wY + wH + 0.030 + (Hl - wY - wH - 0.030) / 2));
  for (const [x0, x1] of [[0.026, wX - wW], [wX + wW, Wl - 0.004]]) {
    if (x1 - x0 > 0.01) hinge.add(mesh(box(x1 - x0, wH * 2, 0.046), steel, { pos: [(x0 + x1) / 2, wY, lz] }));
  }
  hinge.add(noOut(mesh(box(0.20, 0.010, 0.050), steel, { pos: [wX, wY - wH - 0.028, lz], cast: false })));   // 窓下敷き

  // のぞき窓（網入りガラス：框・ガラス・ワイヤー・内側は暗がり）
  const win = grp('vision-panel');
  win.position.set(wX, wY, lz);
  hinge.add(win);
  for (const [dy, dx, fw, fh] of [[wH + 0.013, 0, wW * 2 + 0.030, 0.026], [-wH - 0.013, 0, wW * 2 + 0.030, 0.026], [0, wW + 0.013, 0.026, wH * 2], [0, -wW - 0.013, 0.026, wH * 2]]) {
    win.add(mesh(box(fw, fh, 0.050), alu, { pos: [dx, dy, 0.001] }));
  }
  win.add(noOut(mesh(box(wW * 2, wH * 2, 0.006), glass, { pos: [0, 0, 0.027], cast: false })));
  noOut(grill(win, { w: wW * 2 - 0.01, h: wH * 2 - 0.01, nx: 5, ny: 4, bar: 0.0026, mat: MAT.metal('#b8bcb6', { repeat: 6 }), pos: [0, 0, 0.031] }));
  win.add(noOut(mesh(box(wW * 2 - 0.006, wH * 2 - 0.006, 0.004), deep, { pos: [0, 0, -0.026], cast: false })));
  weather(win, { w: wW * 1.9, h: wH * 1.5, pos: [0, -0.01, 0.034], kind: 'dirt', color: '#8f9a8c', opacity: 0.34, seed: seed + 52, density: 1.5, spread: 0.004 });

  // 胴縁（成形鋼板の押さえリブ）
  for (let i = 0; i < 3; i++) {
    const y = 0.30 + i * 0.52;
    if (y > wY - wH - 0.12 && y < wY + wH + 0.12) continue;
    hinge.add(mesh(box(Wl - 0.07, 0.020, 0.052), steel, { pos: [Wl / 2, y, lz] }));
  }
  // 下部 蹴り上げ補強板＋蹴り傷・錆
  hinge.add(mesh(box(Wl - 0.03, 0.26, 0.052), steel, { pos: [Wl / 2, 0.145, lz] }));
  for (let i = 0; i < 4; i++) {
    hinge.add(noOut(mesh(sph(0.034, 10, 7), steel, {
      pos: [0.12 + i * 0.19 + range(rnd, -0.03, 0.03), 0.16 + range(rnd, 0, 0.13), lz + 0.014],
      scale: [1, 0.72, 0.20], cast: false,
    })));
  }
  weather(hinge, { w: 0.42, h: 0.22, pos: [Wl * 0.42, 0.16, lz + 0.0255], kind: 'chip', color: '#9c968a', opacity: 0.6, seed: seed + 55, density: 2.0, spread: 0.008 });
  weather(hinge, { w: 0.30, h: 0.30, pos: [Wl * 0.24, 0.11, lz + 0.0255], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 56, density: 1.8, spread: 0.008 });
  weather(hinge, { w: 0.24, h: 0.16, pos: [Wl * 0.76, 0.24, lz - 0.0255], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 57, density: 1.6, spread: 0.006 });
  // 下部ブラシシーリング（外気が上がる隙間）
  hinge.add(mesh(box(Wl - 0.02, 0.024, 0.050), gasket, { pos: [Wl / 2, 0.012, lz] }));
  for (let i = 0; i < 12; i++) {
    hinge.add(noOut(mesh(box(0.006, 0.016, 0.010), rubber, { pos: [0.05 + i * 0.062, 0.005, lz + 0.026], rot: [0, 0, range(rnd, -0.4, 0.4)], cast: false })));
  }

  /* ---- 丁番 3 箇所（蝶番板＋ノックピン＋錆） ---- */
  for (let i = 0; i < 3; i++) {
    const y = 0.18 + i * ((Hl - 0.36) / 2);
    const hg = put(grp('hinge'), 0.012, y, lz);
    hinge.add(hg);
    hg.add(mesh(box(0.026, 0.078, 0.012), galv, { pos: [0.010, 0, -0.028] }));
    hg.add(mesh(box(0.026, 0.078, 0.012), galv, { pos: [0.010, 0, 0.028] }));
    hg.add(mesh(cyl(0.0092, 0.0092, 0.086, 10), iron));
    hg.add(mesh(cyl(0.0125, 0.0125, 0.008, 10), iron, { pos: [0, 0.044, 0] }));
    for (const s of [-1, 1]) {
      hg.add(mesh(cyl(0.0048, 0.0048, 0.006, 6), MAT.stainless({ repeat: 8 }), { pos: [0.024, s * 0.026, s * 0.028], rot: [90 * D2R, 0, 0] }));
    }
    weather(hg, { w: 0.06, h: 0.10, pos: [0.014, -0.055, 0], kind: 'rust', color: '#8a5236', opacity: 0.62, seed: seed + 60 + i, density: 2.0, spread: 0.005 });
  }

  /* ---- ドアクローザ（本体＋2 段アーム＋油漏れ） ---- */
  const closer = grp('door-closer');
  closer.position.set(0, Hl - 0.055, lz + 0.030);
  hinge.add(closer);
  closer.add(mesh(rbox(0.26, 0.062, 0.070, 0.008, 2), iron, { pos: [0.30, 0.030, 0.020] }));
  closer.add(mesh(cyl(0.017, 0.017, 0.024, 12), iron, { pos: [0.175, 0.030, 0.036], rot: [90 * D2R, 0, 0] }));
  closer.add(mesh(box(0.016, 0.010, 0.116), alu, { pos: [0.24, 0.048, 0.086], rot: [0, -0.42, 0.16] }));
  closer.add(mesh(box(0.014, 0.010, 0.128), alu, { pos: [0.40, 0.028, 0.140], rot: [0, 0.70, -0.20] }));
  for (const [x, y, z] of [[0.175, 0.030, 0.098], [0.315, 0.058, 0.128], [0.455, 0.020, 0.196]]) {
    closer.add(mesh(cyl(0.0062, 0.0062, 0.020, 8), MAT.stainless({ repeat: 8 }), { pos: [x, y, z], rot: [90 * D2R, 0, 0] }));
  }
  closer.add(mesh(cyl(0.0055, 0.0055, 0.014, 6), MAT.plastic('#e6dcc0', { steps: 2 }), { pos: [0.20, 0.058, 0.042] }));   // 調整弁
  weather(closer, { w: 0.10, h: 0.17, pos: [0.30, -0.035, 0.030], kind: 'dirt', color: '#3f3a30', opacity: 0.55, seed: seed + 64, density: 1.6, spread: 0.007 });
  weather(closer, { w: 0.16, h: 0.06, pos: [0.32, 0.048, 0.058], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 65, spread: 0.004 });

  /* ---- 回転レバー＋錠前（施錠状態・鍵差込み） ---- */
  const lever = grp('lever-lock');
  lever.position.set(Wl - 0.075, Hl * 0.44, lz);
  hinge.add(lever);
  lever.add(mesh(rbox(0.076, 0.24, 0.016, 0.006, 2), alu, { pos: [0, 0, 0.030] }));                         // ロゼット
  lever.add(mesh(cyl(0.014, 0.014, 0.062, 12), iron, { pos: [-0.005, 0, 0.060], rot: [90 * D2R, 0, 0] }));
  lever.add(mesh(box(0.255, 0.024, 0.024), alu, { pos: [-0.128, 0, 0.086] }));                              // レバー
  lever.add(mesh(cyl(0.0125, 0.0125, 0.024, 10), alu, { pos: [-0.252, 0, 0.086], rot: [90 * D2R, 0, 0] }));
  lever.add(mesh(cyl(0.0068, 0.0068, 0.030, 8), iron, { pos: [-0.252, -0.016, 0.086] }));
  lever.add(mesh(rbox(0.062, 0.070, 0.022, 0.006, 2), iron, { pos: [0, -0.125, 0.032] }));                   // 錠前
  lever.add(mesh(cyl(0.0125, 0.0125, 0.014, 12), MAT.metal('#a9a5a0', { repeat: 7 }), { pos: [0, -0.125, 0.046], rot: [90 * D2R, 0, 0] }));
  lever.add(mesh(box(0.007, 0.020, 0.006), deep, { pos: [0, -0.125, 0.0535] }));
  const keyG = grp('key');
  keyG.position.set(0, -0.125, 0.056);
  keyG.rotation.set(90 * D2R, 0, 0.7);
  lever.add(keyG);
  keyG.add(mesh(box(0.006, 0.062, 0.003), MAT.metal('#c9b98a', { spec: 0.6, repeat: 6 })));
  keyG.add(mesh(cyl(0.011, 0.011, 0.004, 10), MAT.metal('#c9b98a', { spec: 0.6, repeat: 6 }), { pos: [0, 0.034, 0] }));
  // 内側（−Z）のサムターン
  lever.add(mesh(cyl(0.011, 0.011, 0.014, 10), iron, { pos: [0, -0.125, -0.032], rot: [90 * D2R, 0, 0] }));
  lever.add(mesh(box(0.020, 0.006, 0.008), iron, { pos: [0, -0.125, -0.040] }));
  weather(lever, { w: 0.10, h: 0.10, pos: [0, -0.195, 0.042], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 70, density: 2.0, spread: 0.005 });

  // 扉自体の表示ステッカー（色褪せ・めくれ）
  decal(hinge, { map: TEX.signboard({ text: '関係者以外 立入禁止', sub: '通用口 施錠厳守', bg: '#f3efe3', fg: '#3f4a52', stripe: PAL.storeBand3 }), w: 0.24, h: 0.075, pos: [Wl * 0.52, Hl * 0.30, lz + 0.0255], opacity: 0.95 });
  decal(hinge, { map: TEX.wear({ kind: 'chip', color: '#efe9d8', seed: seed + 73, density: 1.1 }), w: 0.16, h: 0.06, pos: [Wl * 0.60, Hl * 0.29, lz + 0.0285], opacity: 0.65, rot: [0, 0, 4 * D2R] });

  /* ================= ４. 上部の換気グリル ================= */
  const vent = grp('vent-grill');
  const gW = W + fl * 1.2, gH = 0.30;
  const gY = yO1 + fl + 0.115;
  g.add(vent);
  for (const [dy, dx, w, h] of [[gH / 2, 0, gW, 0.020], [-gH / 2, 0, gW, 0.020], [0, gW / 2, 0.020, gH], [0, -gW / 2, 0.020, gH]]) {
    vent.add(mesh(box(w, h, 0.048), alu, { pos: [dx, gY + dy, 0.026] }));
  }
  vent.add(mesh(box(gW - 0.05, gH - 0.04, 0.020), deep, { pos: [0, gY, 0.006], cast: false }));
  vent.add(mesh(cyl(0.088, 0.088, 0.20, 14), galv, { pos: [0.02, gY, -0.098], rot: [90 * D2R, 0, 0] }));
  vent.add(mesh(box(gW - 0.09, gH - 0.08, 0.006), MAT.paint('#141615', { steps: 2, shadowAmt: 1, spec: 0.02 }), { pos: [0, gY, -0.196], cast: false }));
  // 羽根（7 枚・1 枚だけ曲がって隙間）
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const y = gY - gH / 2 + 0.024 + t * (gH - 0.048);
    vent.add(mesh(box(gW - 0.042, 0.036, 0.010), alu, { pos: [0, y, 0.024], rot: [0.62 + (i === 2 ? -0.17 : 0), 0, 0] }));
  }
  noOut(grill(vent, { w: gW - 0.05, h: gH - 0.05, nx: 13, ny: 5, bar: 0.0024, mat: MAT.metal('#b0b5b2', { worn: 0.6, repeat: 6 }), pos: [0, gY, 0.013] }));
  for (const sx of [-1, 1]) {
    vent.add(mesh(cyl(0.0062, 0.0062, 0.008, 6), MAT.stainless({ repeat: 8 }), { pos: [sx * (gW / 2 - 0.012), gY, 0.052], rot: [90 * D2R, 0, 0] }));
  }
  decal(vent, { map: TEX.gradient({ stops: [[0, 'rgba(255,236,190,1)'], [1, 'rgba(236,222,186,0)']] }), w: gW - 0.02, h: gH + 0.04, pos: [0, gY, 0.053], opacity: 0.42 });
  weather(vent, { w: gW * 0.8, h: 0.06, pos: [0, gY - gH / 2 - 0.006, 0.036], kind: 'dirt', color: '#6b6152', opacity: 0.55, seed: seed + 81, density: 2.0, spread: 0.006 });
  weather(vent, { w: 0.14, h: 0.06, pos: [gW * 0.24, gY + 0.05, 0.0535], kind: 'rust', color: '#8a5236', opacity: 0.4, seed: seed + 82, spread: 0.004 });
  weather(wall, { w: 0.05, h: 0.34, pos: [-gW * 0.30, gY - 0.26, 0.010], kind: 'rust', color: '#7f8f76', opacity: 0.4, seed: seed + 83, density: 0.8, spread: 0.005 });

  /* ================= ５. 段差（コンクリート框＋アルミ枕＋水切） ================= */
  const step = grp('threshold-step');
  g.add(step);
  const sD = 0.46;                                        // 段差の奥行き（壁から外へ）
  const sw = W + fl * 2 + 0.16;
  step.add(mesh(box(sw, yS - 0.004, sD), concrete, { pos: [0, (yS - 0.004) / 2, 0.016 + sD / 2] }));
  for (const sx of [-1, 1]) {
    step.add(mesh(box(0.012, yS - 0.02, sD - 0.03), concrete, { pos: [sx * (sw / 2 - 0.004), (yS - 0.02) / 2, 0.026 + sD / 2] }));
    weather(step, { w: 0.14, h: 0.10, pos: [sx * (sw / 2 + 0.004), 0.05, 0.18], rot: [0, sx * Math.PI / 2, 0], kind: 'chip', color: '#a49d8e', opacity: 0.5, seed: seed + 88 + sx, density: 1.6, spread: 0.006 });
  }
  // アルミ枕（敷居金物）＋溝＋目地シール
  step.add(mesh(rbox(W + fl * 2 + 0.02, 0.014, 0.22, 0.004, 2), alu, { pos: [0, yS + 0.004, 0.116] }));
  for (let i = 0; i < 5; i++) step.add(noOut(mesh(box(W + fl * 2, 0.004, 0.008), MAT.paint('#8f938f', { steps: 2 }), { pos: [0, yS + 0.0115, 0.048 + i * 0.036], cast: false })));
  step.add(mesh(box(W + fl * 2 + 0.05, 0.009, 0.014), gasket, { pos: [0, yS - 0.001, 0.014] }));
  // 段鼻（アルミ角材の取り合い）＋すべり止め
  step.add(mesh(rbox(sw, 0.020, 0.030, 0.006, 2), alu, { pos: [0, yS - 0.004, 0.010 + sD] }));
  for (let i = 0; i < 9; i++) step.add(noOut(mesh(box(0.020, 0.004, 0.026), MAT.paint('#7f8480', { steps: 2 }), { pos: [-sw / 2 + 0.08 + i * 0.108, yS + 0.007, 0.010 + sD], cast: false })));
  // 水切（段下面の排水隙間と受樋・排水口）
  step.add(mesh(box(sw + 0.04, 0.026, 0.030), deep, { pos: [0, 0.024, 0.020] }));
  step.add(mesh(box(0.030, 0.020, 0.032), galv, { pos: [sw / 2 - 0.06, 0.018, 0.020] }));
  weather(step, { w: sw * 0.8, h: 0.09, pos: [0, 0.030, 0.014 + sD + 0.006], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 92, density: 1.8, spread: 0.007 });
  weather(step, { w: 0.42, h: 0.10, pos: [-0.1, yS + 0.013, 0.28], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.4, seed: seed + 93, density: 1.5, spread: 0.006 });

  /* ================= ６. 扉前の空地（ゴミ置場風の線・水たまり・落ち葉） ================= */
  const fore = grp('forecourt');
  g.add(fore);
  // 補修打設帯（既存の土間より一段高い）
  fore.add(mesh(box(1.96, 0.020, 0.78), MAT.concrete({ base: PAL.concreteDark, repeat: 1, joints: 2 }), { pos: [0.06, 0.008, 0.88], cast: false }));
  // ゴミ置場風の線（色褪せた黄線を 3 面で囲う）
  fore.add(noOut(mesh(box(1.34, 0.010, 0.052), markYellow, { pos: [0.02, 0.019, 1.14], cast: false })));
  for (const sx of [-1, 1]) fore.add(noOut(mesh(box(0.052, 0.010, 0.52), markYellow, { pos: [0.02 + sx * 0.645, 0.019, 0.885], cast: false })));
  weather(fore, { w: 1.3, h: 0.5, pos: [0.02, 0.020, 0.92], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5f594e', opacity: 0.3, seed: seed + 96, density: 1.6, spread: 0.02 });
  // 袋置きの擦り跡
  for (const [ox, oz, r] of [[-0.34, 0.98, 0.19], [0.26, 1.02, 0.16], [0.44, 0.78, 0.13]]) {
    fore.add(noOut(mesh(cyl(r, r, 0.004, 18), MAT.paint('#a39a89', { steps: 2, sat: 0.8, tint: '#e6e0cf' }), { pos: [ox, 0.020, oz], cast: false })));
  }
  // 水たまり（濡れ跡＋浅い水面＋浮いた紙屑）
  const pud = put(grp('puddle'), -0.52, 0, 0.66);
  fore.add(pud);
  pud.add(noOut(mesh(cyl(0.20, 0.20, 0.003, 22), MAT.paint('#7f786a', { steps: 2, sat: 0.76, tint: '#8e8878' }), { pos: [0, 0.0205, 0], scale: [1.25, 1, 0.72], cast: false })));
  pud.add(noOut(mesh(cyl(0.165, 0.165, 0.004, 22), MAT.water({ opacity: 0.6 }), { pos: [0, 0.0255, 0], scale: [1.2, 1, 0.68], cast: false })));
  pud.add(noOut(mesh(box(0.05, 0.003, 0.02), MAT.paint('#6d6a5e', { steps: 2 }), { pos: [0.10, 0.0285, 0.04], cast: false })));
  // 落ち葉・桜瓣・小枝
  for (let i = 0; i < 11; i++) {
    const s = range(rnd, 0.026, 0.052);
    const isPetal = i % 4 === 0;
    fore.add(noOut(mesh(rbox(s, 0.004, s * 0.74, 0.002, 1),
      isPetal ? MAT.petal({ tone: i % 8 === 0 ? 1 : 0 }) : MAT.leaf({ color: i % 3 === 0 ? '#9c8a5c' : PAL.leaf, tint: '#eee2c6' }),
      {
        pos: [range(rnd, -0.84, 0.94), range(rnd, 0.0205, 0.0245), range(rnd, 0.56, 1.20)],
        rot: [range(rnd, -0.25, 0.25), range(rnd, 0, 6.28), range(rnd, -0.25, 0.25)], cast: false,
      })));
  }
  for (let i = 0; i < 3; i++) {
    fore.add(noOut(mesh(cyl(0.0035, 0.0025, range(rnd, 0.07, 0.14), 5), MAT.bark({ base: PAL.trunk, repeat: 2 }), {
      pos: [range(rnd, -0.7, 0.8), 0.0235, range(rnd, 0.55, 1.1)], rot: [Math.PI / 2, range(rnd, 0, 3), 0], cast: false,
    })));
  }
  // 隅の砂利溜まり（土こぼれ）
  for (let i = 0; i < 16; i++) {
    const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.6) * 0.22;
    fore.add(noOut(mesh(rbox(0.020 + rnd() * 0.024, 0.014, 0.020 + rnd() * 0.020, 0.006, 1), MAT.stone({ color: '#a8a29a' }), {
      pos: [0.80 - Math.cos(a) * rr * 0.7, 0.014, 0.66 + Math.sin(a) * rr], rot: [0, rnd() * 3, 0], cast: false,
    })));
  }

  /* ================= ７. 突き当たり表示（通用口・立入禁止・防犯） ================= */
  const sign = grp('signage');
  g.add(sign);
  const addPlate = ({ text, sub, w, h, x, y, bg, fg, stripe, tilt = 0 }) => {
    const p = put(grp('plate'), x, y, 0);
    p.rotation.z = tilt;
    sign.add(p);
    p.add(mesh(box(w + 0.012, h + 0.012, 0.006), steelFrame, { pos: [0, 0, 0.010] }));
    p.add(mesh(rbox(w, h, 0.010, 0.003, 2), plateWhite, { pos: [0, 0, 0.016] }));
    for (const sx of [-1, 1]) p.add(mesh(cyl(0.0048, 0.0048, 0.006, 6), MAT.stainless({ repeat: 8 }), { pos: [sx * (w / 2 - 0.02), h / 2 - 0.018, 0.0225], rot: [90 * D2R, 0, 0] }));
    decal(p, { map: TEX.signboard({ text, sub, bg, fg, stripe }), w: w - 0.014, h: h - 0.014, pos: [0, 0, 0.0225] });
    return p;
  };
  addPlate({ text: '通用口', sub: '関係者以外 立入禁止', w: 0.34, h: 0.13, x: xR + 0.34, y: 1.52, bg: '#f2eee1', fg: '#3c4650', stripe: PAL.storeBand });
  const p2 = addPlate({ text: '立入禁止', sub: '施錠のほど', w: 0.20, h: 0.20, x: xR + 0.34, y: 1.24, bg: '#f6f2e6', fg: '#8f3a34', tilt: -2.5 * D2R });
  p2.add(noOut(mesh(cyl(0.056, 0.056, 0.002, 20), MAT.paint('#efe9db', { steps: 2, sat: 0.9 }), { pos: [0, 0.014, 0.024], cast: false })));
  p2.add(noOut(mesh(tor(0.060, 0.0075, 6, 20), MAT.paint(PAL.storeBand3, { steps: 2 }), { pos: [0, 0.014, 0.026], cast: false })));
  p2.add(noOut(mesh(box(0.126, 0.013, 0.004), MAT.paint(PAL.storeBand3, { steps: 2 }), { pos: [0, 0.014, 0.0275], rot: [0, 0, 0.72], cast: false })));
  addPlate({ text: '火気厳禁', sub: '消火器 右側にあり', w: 0.17, h: 0.105, x: xL - 0.30, y: 1.36, bg: PAL.storeBand3, fg: '#fbf6ea' });
  addPlate({ text: '防犯カメラ 作動中', sub: '24 時間録画中', w: 0.24, h: 0.085, x: xL - 0.30, y: 1.18, bg: PAL.storeBand, fg: '#f7f4ea' });
  // 針金で下がった注意札（片方が千れて斜め）
  const tag = put(grp('paper-tag', { rot: [0.18, 0.1, -0.14] }), xR + 0.34, 1.05, 0.036);
  sign.add(tag);
  tag.add(noOut(mesh(box(0.088, 0.116, 0.002), MAT.paper({ color: '#f4eeda', steps: 2 }), { pos: [0, -0.058, 0], cast: false })));
  decal(tag, { map: TEX.poster({ title: '本日は', sub: '閉店 22:00', bg: '#f6efdd', accent: PAL.storeBand2, seed: seed + 101 }), w: 0.078, h: 0.10, pos: [0, -0.058, 0.0035], opacity: 0.95 });
  tag.add(noOut(mesh(cyl(0.0016, 0.0016, 0.05, 5), MAT.rubber('#7a746a'), { pos: [0.02, 0, -0.006], rot: [0.3, 0, 0.2], cast: false })));
  weather(sign, { w: 0.36, h: 0.16, pos: [xR + 0.34, 1.44, 0.030], kind: 'dirt', color: '#8b8271', opacity: 0.32, seed: seed + 104, density: 1.4, spread: 0.01 });
  decal(sign, { map: TEX.gradient({ stops: [[0, 'rgba(255,240,206,1)'], [1, 'rgba(255,240,206,0)']] }), w: 1.05, h: 0.7, pos: [xR + 0.05, 1.5, 0.028], opacity: 0.3 });

  /* ================= 仕上げ：接地の陰・全体の経年 ================= */
  shadowBlob(g, { r: 0.62, pos: [0.1, 0.008, 0.60], opacity: 0.26, ratio: 0.74 });
  weather(g, { w: 1.4, h: 0.30, pos: [0, yO0 + 0.14, 0.020], kind: 'dirt', color: '#5f5a4e', opacity: 0.24, seed: seed + 110, density: 1.2, spread: 0.02 });

  return finish(g, { outline: 'normal' });
}

export default build;
