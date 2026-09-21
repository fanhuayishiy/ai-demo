import { g as grp, M as MAT, P as PAL, m as mesh, b as box, G as put, i as grill, w as weather, h as decal, T as TEX, n as range, c as cyl, r as rbox, a as sph, t as tor, k as tubeOf, p as shadowBlob, q as finish, z as rand } from './index-CSUFndW_.js';

//  assets/store/pavement-frontage.js —— 店舗前铺面（店前タイル帯＋段差・スロープ＋車止め＋点字取合い）
//  原点 = 铺面の中心（地面 y=0）/ +Y 上 / +Z = 道路側（南）。装配層は世界 (STORE.cx, 0, STORE.z1+1.05)・rotY=0。
//  ※ world/sidewalk.js の铺砖（天端 y=0.150）の上に載せる前提。自前の天端は 0.158 以上として z-fighting を避ける。
//  ※ 既存の点字ブロックとは重ねない（当店前は出入口直前の短冊のみ・天端を揃える）。
//  ※ 既存の側溝・縁石（world 側 z≈+0.98）と当たらないよう、铺面の道路側端は z=+0.90 で終える。

const meta = {
  id: 'pavement-frontage',
  real: [9.4, 0.24, 2.20],        // 铺面輪郭（抬段の天端高さを含む）
  origin: 'center-ground',        // 铺面中心・地面 y=0
  front: '+Z = 道路側',
};

const D2R = Math.PI / 180;
const noOut = (o) => { o.userData.noOutline = true; return o; };
const deepMat = () => MAT.paint('#141615', { steps: 2, shadowAmt: 1, spec: 0.02 });

function build(options = {}) {
  const seed = options.seed ?? 233;
  const rnd = rand(seed);
  const g = grp('pavement-frontage');

  /* ---------------- 基準寸法 ---------------- */
  const W = Math.max(3.0, options.width ?? 9.4);
  const D = Math.max(1.2, options.depth ?? 2.2);
  const x0 = -W / 2, x1 = W / 2;
  const zN = -D / 2;                       // 壁側（建物下に 50mm 潜らせる）
  const zS = Math.min(D / 2, 0.90);        // 道路側端
  const zM = 0.30;                         // 主タイル帯／外側バンドの分界
  const yB = 0.162;                        // 主タイル帯 天端
  const yC = 0.158;                        // 外側バンド 天端
  const yS1 = 0.192;                       // 段 1 天端
  const yP = 0.222;                        // 抬（ゴミ置場）天端
  const pX = 1.46;                         // 抬の西端

  /* ---------------- タイル・舗装マテリアル（world 尺度 UV） ---------------- */
  const tileMat = (color, cycle, w, d, n = 2, extra = {}) => MAT.paint('#ffffff', {
    map: TEX.tile({ color, n, repeat: 1 }).map,
    normalMap: TEX.tile({ color, n, repeat: 1 }).normalMap,
    normalScaleX: 0.9, normalScaleY: 0.9,
    spec: 0.17, specPower: 46, specCut: 0.24, shadowAmt: 0.84, steps: 3,
    uv: { repeat: [Math.max(1, w / cycle), Math.max(1, d / cycle)] },
    ...extra,
  });
  const tileFront = tileMat(PAL.tileFront, 0.64, W, zM - zN);                       // 店前タイル（明るい目地・320 角）
  const tileOld = MAT.paving({ color: PAL.sidewalk, mode: 'block', cells: 5, repeat: 1, uv: { repeat: [W / 1.5, (zS - zM) / 1.5] } });   // 外側：古いインターロッキング
  const tilePatch = tileMat('#e7d8bd', 0.64, 1.3, 0.96);                            // 補修張替（ここだけ色違い）
  const tilePlat = tileMat('#d4cebe', 0.48, x1 - pX, zM - zN, 2, { sat: 0.94 });     // 抬上の細タイル
  const tileStep = tileMat(PAL.tileFront, 0.64, 0.30, zM - zN);                          // 段の踏面（目地の縮尺を合わせる）
  const tileSlope = tileMat('#d4cebe', 0.48, 0.9, 0.62, 2, { sat: 0.94 });                // スロープ面
  const conc = MAT.concrete({ base: PAL.concreteDark, repeat: 1, joints: 2 });
  const concLight = MAT.concrete({ base: PAL.concrete, repeat: 1 });
  const alu = MAT.metal('#c9cecf', { spec: 0.62, repeat: 5 });
  const steel = MAT.darkIron({ repeat: 6 });
  const galv = MAT.galvanized({ repeat: 4 });
  const rubber = MAT.rubber('#2f3238');
  const jointMat = MAT.paint('#8b8578', { steps: 2, spec: 0.05, shadowAmt: 0.98 });
  const markWhite = MAT.marking(PAL.marking, { sat: 0.9, tint: '#f4f0e2' });
  const markYellow = MAT.marking(PAL.markingYellow, { sat: 0.74, tint: '#f3e8c6' });
  const yMid = (zM + zN) / 2;

  /* ================= １. 铺面本体（路盤＋タイル帯＋取合い金物） ================= */
  const deck = grp('deck');
  g.add(deck);
  deck.add(mesh(box(W, 0.15, zS - zN), conc, { pos: [0, 0.073, (zN + zS) / 2], cast: false, name: 'sub-base' }));            // 路盤
  deck.add(mesh(box(W, 0.024, zM - zN), tileFront, { pos: [0, yB - 0.012, yMid], cast: false, name: 'band-tile' })); // 主タイル帯
  deck.add(mesh(box(W - 0.02, 0.022, zS - zM), tileOld, { pos: [0, yC - 0.011, (zM + zS) / 2], cast: false, name: 'band-outer' }));
  // B/C 取り合い：アルミ角材＋目地シール
  deck.add(mesh(box(W - 0.04, 0.013, 0.026), alu, { pos: [0, yC + 0.002, zM], cast: false }));
  deck.add(noOut(mesh(box(W - 0.04, 0.009, 0.010), jointMat, { pos: [0, yC - 0.001, zM + 0.021], cast: false })));
  // 外端の見切（歩道との取り合い）
  deck.add(mesh(box(W, 0.020, 0.030), alu, { pos: [0, yC - 0.001, zS - 0.014], cast: false }));
  deck.add(noOut(mesh(box(W, 0.010, 0.012), jointMat, { pos: [0, yC - 0.004, zS + 0.004], cast: false })));
  // 壁際の水切（サッシ下薄金物・打継目地）
  deck.add(mesh(box(W, 0.010, 0.050), galv, { pos: [0, yB + 0.002, zN + 0.026], cast: false }));
  deck.add(noOut(mesh(box(W, 0.014, 0.014), jointMat, { pos: [0, yB - 0.003, zN + 0.056], cast: false })));

  /* ================= ２. 段差 2 段＋スロープ（ゴミ置場の抬） ================= */
  const plat = grp('platform');
  g.add(plat);
  const pW = x1 - pX - 0.02, pD = zM - zN;
  plat.add(mesh(box(pW, yP - 0.02, pD), tilePlat, { pos: [pX + pW / 2, (yP - 0.02) / 2 + 0.02, yMid], name: 'platform' }));      // 抬（2 段目）
  plat.add(mesh(box(0.30, yS1 - 0.02, pD), tileStep, { pos: [pX - 0.15, (yS1 - 0.02) / 2 + 0.02, yMid], name: 'step-1' }));      // 段 1
  // 段鼻（アルミ角材・滑り止め）
  for (const [nx, ny] of [[pX - 0.30, yS1], [pX, yP]]) {
    plat.add(mesh(box(0.026, 0.016, pD - 0.02), alu, { pos: [nx + 0.009, ny + 0.002, yMid] }));
    for (let i = 0; i < 6; i++) plat.add(noOut(mesh(box(0.030, 0.004, 0.030), MAT.paint('#8d918d', { steps: 2 }), { pos: [nx + 0.011, ny + 0.011, zN + 0.10 + i * ((pD - 0.20) / 5)], cast: false })));
  }
  plat.add(mesh(box(0.012, 0.075, pD - 0.06), steel, { pos: [pX - 0.306, 0.152, yMid] }));                                       // 段の_corner_見切
  // スロープ（抬 → 外側バンド）
  const rLen = 0.44, rAng = Math.atan2(yP - yC, rLen), rW = 0.86;
  const ramp = put(grp('ramp'), 3.02, 0, zM);
  plat.add(ramp);
  const slope = put(grp('slope-face'), 0, (yP + yC) / 2 - 0.004, rLen / 2 - 0.01);
  slope.rotation.x = rAng;
  ramp.add(slope);
  slope.add(mesh(box(rW, 0.030, rLen / Math.cos(rAng) + 0.12), tileSlope, { cast: false }));
  for (const sx of [-1, 1]) slope.add(mesh(box(0.026, 0.052, rLen / Math.cos(rAng) + 0.12), alu, { pos: [sx * (rW / 2 + 0.008), 0.006, 0] }));   // 側見切
  for (let i = 0; i < 5; i++) slope.add(noOut(mesh(box(rW - 0.06, 0.004, 0.016), MAT.paint('#a6a296', { steps: 2 }), { pos: [0, 0.017, -0.16 + i * 0.085], cast: false })));  // すべり止め溝
  // 水受け（受け樋・グレーチング・暗渠）
  const ch = put(grp('drain-channel'), 3.02, 0, zS - 0.05);
  plat.add(ch);
  ch.add(mesh(box(0.94, 0.06, 0.13), conc, { pos: [0, yC - 0.038, 0] }));
  ch.add(noOut(mesh(box(0.86, 0.04, 0.09), deepMat(), { pos: [0, yC - 0.026, 0], cast: false })));
  ch.add(mesh(box(0.88, 0.014, 0.11), galv, { pos: [0, yC - 0.006, 0] }));
  noOut(grill(ch, { w: 0.78, h: 0.084, nx: 9, ny: 2, bar: 0.005, mat: steel, pos: [0, yC + 0.002, 0], rot: [-Math.PI / 2, 0, 0] }));
  ch.add(mesh(box(0.06, 0.018, 0.04), steel, { pos: [0.36, yC + 0.004, 0.02] }));                                    // 引掛け穴
  weather(plat, { w: pW * 0.62, h: pD * 0.44, pos: [pX + pW / 2, yP + 0.007, -0.16], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5c564b', opacity: 0.42, seed: seed + 301, density: 1.8, spread: 0.02 });
  weather(plat, { w: 0.62, h: 0.42, pos: [pX + 0.42, yP + 0.006, 0.04], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.4, seed: seed + 302, density: 1.6, spread: 0.02 });
  weather(plat, { w: 0.9, h: 0.06, pos: [3.02, yC + 0.006, zS - 0.20], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#4f4a40', opacity: 0.45, seed: seed + 303, density: 1.9, spread: 0.02 });

  /* ================= ３. 張替・白華・欠け・車輪痕・油染み・ガム ================= */
  const surf = grp('surface-aging');
  g.add(surf);
  surf.add(mesh(box(1.28, 0.028, 0.94), tilePatch, { pos: [-2.24, yB + 0.002, -0.24], cast: false }));                 // 色違いの張替（1 箇所だけ）
  weather(surf, { w: 1.30, h: 0.96, pos: [-2.24, yB + 0.016, -0.24], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#b9b1a1', opacity: 0.35, seed: seed + 305, density: 1.4, spread: 0.02 });
  for (const [x, z, w, h] of [[-3.3, -0.4, 1.2, 0.7], [0.70, -0.18, 1.5, 0.9], [3.90, 0.46, 1.1, 0.6]]) {              // 目地の白華
    decal(surf, { map: TEX.wear({ kind: 'chip', color: '#f6f4ec', seed: seed + Math.round(x * 100 + z * 10), density: 1.1 }), w, h, pos: [x, yB + 0.006, z], rot: [-Math.PI / 2, 0, 0], opacity: 0.5 });
  }
  // 車輪痕（台車のタイヤ跡が抬へ続く）
  // 以前は厚み 4 mm の細長い箱を最大 30 mm 浮かせて置いた → 縁の尖った「鉄筋が数本寝ている」
  // 見た目になった。面へ貼り付ける薄い筋（wear/streak）に変える。
  for (const dx of [-0.19, 0.19]) {
    const pts = [[-0.72 + dx, 0.72], [-0.2 + dx, 0.20], [0.40 + dx, -0.14], [1.16 + dx, -0.28]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      decal(surf, {
        map: TEX.wear({ kind: 'streak', color: '#6f6a5f', seed: seed + i * 7 + (dx > 0 ? 3 : 1), density: 1.5 }),
        w: len + 0.02, h: 0.055,
        pos: [(a[0] + b[0]) / 2, yB + 0.0016, (a[1] + b[1]) / 2],
        rot: [-Math.PI / 2, 0, Math.atan2(a[0] - b[0], a[1] - b[1])],
        opacity: 0.5,
      });
    }
  }
  for (const [x, z, s] of [[pX + 0.70, -0.64, 0.46], [-4.06, -0.5, 0.40], [2.30, 0.44, 0.32]]) {                        // 油染み
    decal(surf, { map: TEX.wear({ kind: 'dirt', color: '#3f3b34', seed: seed + Math.round(x * 30 + z * 7), density: 1.3 }), w: s * 1.5, h: s * 1.2, pos: [x, (z > zM ? yC : (z > 0 && x > pX ? yP : yB)) + 0.007, z], rot: [-Math.PI / 2, 0, range(rnd, -0.45, 0.45)], opacity: 0.42 });
  }
  for (let i = 0; i < 26; i++) {                                                                                        // ガムの黒点
    surf.add(noOut(mesh(cyl(range(rnd, 0.008, 0.016), range(rnd, 0.007, 0.014), 0.005, 7), MAT.rubber(rnd() > 0.5 ? '#3a3d40' : '#585f52', { steps: 2 }), {
      pos: [range(rnd, x0 + 0.3, x1 - 0.3), yB + 0.004, range(rnd, zN + 0.2, zM - 0.05)], rot: [0, rnd() * 3, 0], cast: false,
    })));
  }
  for (let i = 0; i < 8; i++) {                                                                                         // タイルの欠け（下地が覗く）
    surf.add(noOut(mesh(cyl(range(rnd, 0.030, 0.075), range(rnd, 0.030, 0.070), 0.008, 12), MAT.paint('#a9a394', { steps: 2, sat: 0.86 }), {
      pos: [range(rnd, x0 + 0.5, x1 - 0.5), yB - 0.002, range(rnd, zN + 0.15, zM - 0.10)], rot: [0, rnd() * 3, 0], cast: false,
    })));
  }
  weather(surf, { w: 1.5, h: 0.36, pos: [-0.8, yB + 0.007, 0.36], rot: [-Math.PI / 2, 0, 0], kind: 'scratch', color: '#e7e2d4', opacity: 0.3, seed: seed + 311, density: 1.6, spread: 0.03 });

  /* ================= ４. 点字ブロック（店内入口前の短冊のみ） ================= */
  const tac = grp('tactile-strip');
  g.add(tac);
  const tLine = MAT.tactile({ kind: 'line', repeat: 1 });
  for (let i = 0; i < 3; i++) {
    const m = mesh(box(0.29, 0.018, 0.29), i === 2 ? MAT.tactile({ kind: 'line', repeat: 1, base: '#cfa944', sat: 0.82 }) : tLine, {
      pos: [0, yB - 0.009, -0.56 + i * 0.30], rot: [0, range(rnd, -8e-3, 0.008), 0], cast: false,
    });
    tac.add(m);
  }
  tac.add(mesh(box(0.29, 0.018, 0.29), MAT.tactile({ kind: 'dot', repeat: 1 }), { pos: [0, yB - 0.009, 0.02], rot: [0, 0.004, 0], cast: false }));   // 分岐の警告
  weather(tac, { w: 0.34, h: 0.80, pos: [0.02, yB + 0.007, -0.24], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.3, seed: seed + 315, density: 1.5, spread: 0.02 });
  // 端部の欠けた点字（一片だけ三角に欠ける）
  tac.add(noOut(mesh(rbox(0.10, 0.016, 0.09, 0.02, 1), MAT.paint('#c9b06a', { steps: 2, sat: 0.8 }), { pos: [0.11, yB - 0.006, 0.16], rot: [0, 0.5, 0.16], cast: false })));

  /* ================= ５. 車止め（玉・丸太・U 字ボルト）＋支柱・チェーン ================= */
  const stops = grp('car-stops');
  g.add(stops);
  // (a) コンクリート玉
  const ball = put(grp('stop-ball'), -2.32, 0, 0.52);
  stops.add(ball);
  ball.add(mesh(cyl(0.152, 0.172, 0.05, 18), concLight, { pos: [0, 0.182, 0] }));
  ball.add(mesh(sph(0.150, 18, 12), concLight, { pos: [0, 0.252, 0] }));
  ball.add(noOut(mesh(box(0.205, 0.010, 0.205), markYellow, { pos: [0, 0.209, 0], cast: false })));            // 反射帯（色褪せ）
  weather(ball, { w: 0.22, h: 0.20, pos: [0, 0.25, 0.152], kind: 'chip', color: '#9c968a', opacity: 0.5, seed: seed + 321, density: 1.6, spread: 0.02 });
  weather(ball, { w: 0.26, h: 0.10, pos: [0, 0.168, 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 322, density: 1.6, spread: 0.02 });
  // (b) 丸太式
  const log = put(grp('stop-log'), 2.42, 0, 0.52);
  stops.add(log);
  log.add(mesh(cyl(0.076, 0.078, 0.72, 14), MAT.bark({ base: PAL.woodWeathered, repeat: 3 }), { pos: [0, 0.222, 0], rot: [0, 0, 90 * D2R] }));
  for (const sx of [-1, 1]) {
    log.add(mesh(cyl(0.032, 0.036, 0.19, 10), MAT.bark({ base: PAL.woodDark, repeat: 2 }), { pos: [sx * 0.30, 0.172, 0] }));
    log.add(mesh(cyl(0.014, 0.014, 0.10, 8), steel, { pos: [sx * 0.30, 0.104, 0] }));
    log.add(noOut(mesh(cyl(0.077, 0.075, 0.012, 14), MAT.bark({ base: '#b6a487', repeat: 2 }), { pos: [sx * 0.361, 0.222, 0], rot: [0, 0, 90 * D2R], cast: false })));   // 断面（浅色）
    weather(log, { w: 0.06, h: 0.14, pos: [sx * 0.30, 0.14, 0.04], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 324 + sx, density: 1.6, spread: 0.02 });
  }
  weather(log, { w: 0.66, h: 0.12, pos: [0, 0.300, 0], kind: 'dirt', color: '#5f5a4e', opacity: 0.4, seed: seed + 325, density: 1.6, spread: 0.01 });
  // (c) U 字ボルト留めブロック式
  const ub = put(grp('stop-ubolt'), -0.92, 0, 0.52);
  stops.add(ub);
  ub.add(mesh(rbox(0.56, 0.13, 0.17, 0.012, 2), concLight, { pos: [0, 0.222, 0] }));
  for (const sx of [-1, 1]) {
    for (const sz of [0.055, -0.055]) {
      ub.add(mesh(cyl(0.0115, 0.0115, 0.15, 10), galv, { pos: [sx * 0.19, 0.212, sz] }));
      ub.add(mesh(cyl(0.019, 0.019, 0.012, 6), MAT.stainless({ repeat: 8 }), { pos: [sx * 0.19, 0.148, sz] }));
    }
    ub.add(noOut(mesh(tor(0.055, 0.0115, 5, 12, Math.PI), galv, { pos: [sx * 0.19, 0.287, 0], rot: [0, Math.PI / 2, 0], cast: false })));   // タイヤ受けのアーチ
  }
  weather(ub, { w: 0.44, h: 0.10, pos: [0, 0.285, 0], rot: [-Math.PI / 2, 0, 0], kind: 'chip', color: '#a29b8c', opacity: 0.5, seed: seed + 328, density: 1.7, spread: 0.02 });
  decal(ub, { map: TEX.wear({ kind: 'rust', color: '#8a5236', seed: seed + 329, density: 1.4 }), w: 0.10, h: 0.18, pos: [0.19, 0.20, 0.072], opacity: 0.55 });
  // 支柱・チェーン（駐輪の仕切り）
  const chain = grp('chain-posts');
  g.add(chain);
  const postZ = 0.72, postY = 0.668;
  for (const x of [-4.34, -3.16]) {
    const p = put(grp('post'), x, 0, postZ);
    chain.add(p);
    p.add(mesh(cyl(0.026, 0.028, 0.60, 12), galv, { pos: [0, yC + 0.30, 0] }));
    p.add(mesh(cyl(0.042, 0.046, 0.05, 12), concLight, { pos: [0, yC + 0.026, 0] }));
    p.add(mesh(sph(0.028, 10, 7), galv, { pos: [0, yC + 0.604, 0] }));
    p.add(mesh(box(0.052, 0.012, 0.016), galv, { pos: [0, yC + 0.510, 0] }));
    weather(p, { w: 0.07, h: 0.16, pos: [0, yC + 0.09, 0.03], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 332 + Math.round(x * 10), density: 1.8, spread: 0.02 });
    decal(p, { map: TEX.wear({ kind: 'chip', color: '#c8c2b2', seed: seed + 334 + Math.round(x * 10), density: 1.2 }), w: 0.055, h: 0.24, pos: [0, yC + 0.34, 0.03], opacity: 0.5 });
  }
  const cpts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    cpts.push([-4.34 + t * 1.18, postY - Math.sin(Math.PI * t) * 0.062, postZ]);
  }
  chain.add(noOut(mesh(tubeOf(cpts, 0.0052, 16, 6), MAT.metal('#a3a8a6', { worn: 0.85, repeat: 6 }), { cast: false })));
  for (let i = 0; i <= 11; i++) {
    const t = i / 11;
    chain.add(noOut(mesh(tor(0.019, 0.0045, 4, 10), MAT.metal('#8d8f8b', { worn: 0.9, repeat: 8 }), {
      pos: [-4.34 + t * 1.18, postY - Math.sin(Math.PI * t) * 0.062, postZ], rot: [Math.PI / 2, 0, i % 2 ? 0.2 : -0.2], cast: false,
    })));
  }

  /* ================= ６. 出入口前の屋根柱の基礎（アンカーボルト・パッキン） ================= */
  for (const bx of [-1.18, 1.22]) {
    const base = put(grp('canopy-post-base'), bx, 0, -0.02);
    g.add(base);
    base.add(mesh(rbox(0.19, 0.016, 0.19, 0.004, 2), galv, { pos: [0, yB + 0.010, 0] }));                 // 土台鉄板
    base.add(noOut(mesh(box(0.164, 0.006, 0.164), rubber, { pos: [0, yB + 0.020, 0], cast: false })));      // 下パッキンゴム
    for (const [ax, az] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      base.add(mesh(cyl(0.0105, 0.0105, 0.050, 10), MAT.stainless({ repeat: 8 }), { pos: [ax * 0.062, yB + 0.044, az * 0.062] }));
      base.add(mesh(cyl(0.0165, 0.0165, 0.014, 6), steel, { pos: [ax * 0.062, yB + 0.072, az * 0.062] }));
      base.add(noOut(mesh(cyl(0.022, 0.022, 0.004, 12), galv, { pos: [ax * 0.062, yB + 0.080, az * 0.062], cast: false })));
    }
    base.add(mesh(cyl(0.048, 0.048, 0.034, 14), MAT.metalPaint(PAL.storeWallTrim, { worn: 0.9, repeat: 3 }), { pos: [0, yB + 0.034, 0] }));   // 柱仕舞（抜けた跡）
    base.add(noOut(mesh(cyl(0.040, 0.040, 0.006, 14), deepMat(), { pos: [0, yB + 0.051, 0], cast: false })));
    weather(base, { w: 0.24, h: 0.10, pos: [0, yB + 0.016, 0.09], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 341 + Math.round(bx * 10), density: 1.8, spread: 0.02 });
    weather(base, { w: 0.22, h: 0.06, pos: [0, yB + 0.022, -0.05], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.4, seed: seed + 345 + Math.round(bx * 10), density: 1.5, spread: 0.02 });
  }

  /* ================= ７. 排水マス・砂利溜まり・花びら溜まり・植木鉢の置き跡 ================= */
  const dr = put(grp('drain-manhole'), -1.72, 0, 0.56);
  g.add(dr);
  dr.add(mesh(box(0.46, 0.05, 0.46), concLight, { pos: [0, yC - 0.032, 0] }));
  dr.add(noOut(mesh(box(0.40, 0.06, 0.40), deepMat(), { pos: [0, yC - 0.052, 0], cast: false })));
  dr.add(mesh(rbox(0.42, 0.016, 0.42, 0.005, 2), steel, { pos: [0, yC + 0.002, 0] }));
  noOut(grill(dr, { w: 0.34, h: 0.34, nx: 6, ny: 6, bar: 0.009, mat: steel, pos: [0, yC + 0.011, 0], rot: [-Math.PI / 2, 0, 0.2] }));
  dr.add(mesh(box(0.10, 0.020, 0.05), steel, { pos: [0.13, yC + 0.011, 0.10], rot: [0, 0.3, 0] }));      // 開け口ノッチ
  weather(dr, { w: 0.40, h: 0.14, pos: [0, yC + 0.014, 0.17], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 351, density: 1.8, spread: 0.02 });
  decal(dr, { map: TEX.wear({ kind: 'dirt', color: '#4f4a40', seed: seed + 352, density: 1.6 }), w: 0.36, h: 0.36, pos: [0, yC + 0.016, 0], rot: [-Math.PI / 2, 0, 0], opacity: 0.45 });

  const gravel = grp('gravel-patch');
  g.add(gravel);
  for (let i = 0; i < 30; i++) {
    const a = rnd() * 6.283, rr = Math.pow(rnd(), 0.55) * 0.34;
    gravel.add(noOut(mesh(rbox(0.024 + rnd() * 0.030, 0.016, 0.022 + rnd() * 0.026, 0.007, 1), MAT.stone({ color: '#a8a29a' }), {
      pos: [x0 + 0.48 + Math.cos(a) * rr, yB - 0.004, -0.72 + Math.sin(a) * rr * 0.7], rot: [0, rnd() * 3, 0], cast: false,
    })));
  }
  decal(gravel, { map: TEX.wear({ kind: 'dirt', color: '#8d8371', seed: seed + 355, density: 1.5 }), w: 0.7, h: 0.55, pos: [x0 + 0.48, yB + 0.006, -0.72], rot: [-Math.PI / 2, 0, 0.2], opacity: 0.42 });

  const petals = grp('petal-piles');
  g.add(petals);
  for (let i = 0; i < 16; i++) {
    const s = range(rnd, 0.018, 0.032);
    petals.add(noOut(mesh(rbox(s, 0.003, s * 0.72, 0.002, 1), MAT.petal({ tone: i % 3 }), {
      pos: [range(rnd, x0 + 0.2, x1 - 0.2), yB + range(rnd, 0.004, 0.010), range(rnd, zN + 0.05, zM - 0.05)],
      rot: [range(rnd, -0.3, 0.3), range(rnd, 0, 6.283), range(rnd, -0.3, 0.3)], cast: false,
    })));
  }
  for (let i = 0; i < 5; i++) {                                    // 段の立ち上がりにも張り付く
    petals.add(noOut(mesh(rbox(0.024, 0.003, 0.017, 0.002, 1), MAT.petal({ tone: i % 3 }), {
      pos: [pX + 0.014, 0.198 + range(rnd, -0.02, 0.02), range(rnd, zN + 0.2, 0.2)], rot: [0, 1.57, range(rnd, -0.4, 0.4)], cast: false,
    })));
  }
  for (const [rx, rz, r] of [[-1.7, -0.23, 0.20], [2.20, -0.23, 0.17], [-3.86, 0.14, 0.14]]) {   // 植木鉢の置き跡の輪
    const ry = rz > zM ? yC : (rx > pX ? yP : yB);
    for (const rr2 of [r, r * 0.72]) {
      g.add(noOut(mesh(tor(rr2, 0.0035, 4, 22), MAT.paint('#8f887a', { steps: 2, sat: 0.8, opacity: 0.72, transparent: true }), {
        pos: [rx, ry + 0.002, rz], rot: [-Math.PI / 2, 0, 0], cast: false, receive: false,
      })));
    }
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#6f6759', seed: seed + Math.round(rx * 40), density: 1.3 }), w: r * 1.7, h: r * 1.7, pos: [rx, ry + 0.004, rz], rot: [-Math.PI / 2, 0, range(rnd, 0, 3)], opacity: 0.34 });
  }

  /* ================= ８. 店先の注意表示（床ステッカー・白線） ================= */
  const stick = (text, sub, x, y, z, w, h, rotDeg, bg = PAL.markingYellow, fg = '#4a4033') => {
    decal(g, { map: TEX.signboard({ text, sub, bg, fg }), w, h, pos: [x, y, z], rot: [-Math.PI / 2, 0, rotDeg * D2R], opacity: 0.94 });
    decal(g, { map: TEX.wear({ kind: 'chip', color: '#efe9d8', seed: seed + Math.round(x * 50 + z * 17), density: 1.2 }), w: w * 0.92, h: h * 0.92, pos: [x, y + 0.0015, z], rot: [-Math.PI / 2, 0, rotDeg * D2R], opacity: 0.55 });
  };
  stick('すべり注意', 'wet floor  slow', 3.02, yP + 0.008, 0.02, 0.46, 0.26, 0);            // スロープ入口
  stick('段差注意', 'mind the step', pX - 0.52, yB + 0.007, -0.3, 0.40, 0.22, 90);          // 段の手前
  stick('ゴミ持帰 願', '美化推進', pX + 1.20, yP + 0.008, 0.06, 0.44, 0.20, 0, '#f2eee1', '#4a5259');
  for (const sx of [-1, 1]) {                                                                 // 出入口前の動線矢印（色褪せた白線）
    g.add(noOut(mesh(box(0.05, 0.008, 0.30), markWhite, { pos: [sx * 0.66, yB + 0.001, -0.3], rot: [0, sx * 0.10, 0], cast: false })));
  }
  g.add(noOut(mesh(box(0.94, 0.008, 0.05), markYellow, { pos: [0, yB + 0.001, 0.08], cast: false })));       // 注意帯（色褪せ）
  weather(g, { w: 1.0, h: 0.22, pos: [0, yB + 0.006, 0.08], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6b6152', opacity: 0.45, seed: seed + 361, density: 1.8, spread: 0.02 });

  /* ================= 仕上げ ================= */
  shadowBlob(g, { r: 0.24, pos: [-2.32, yB + 0.002, 0.52], opacity: 0.30 });
  shadowBlob(g, { r: 0.26, pos: [2.42, yC + 0.002, 0.52], opacity: 0.26, ratio: 1.7 });
  shadowBlob(g, { r: 0.20, pos: [-0.92, yC + 0.002, 0.52], opacity: 0.24, ratio: 0.6 });
  weather(g, { w: W * 0.40, h: 0.24, pos: [0, yB + 0.008, zN + 0.24], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5f5a4e', opacity: 0.2, seed: seed + 371, density: 1.5, spread: 0.03 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
