import { g as grp, M as MAT, m as mesh, r as rbox, b as box, c as cyl, w as weather, h as decal, T as TEX, P as PAL, n as range, k as tubeOf, q as finish, x as PlaneGeometry, z as rand } from './index-DD_JJZx9.js';

//  assets/store/exterior-poster-case.js —— 屋外ポスターケース / チラシ箱 / メニュー看板ケース
//  原点 = 壁面とケース下端の交点中心（局所 z=0 が壁面・+Z が外側、局所 y=0 がケース下端）

const meta = {
  id: 'exterior-poster-case',
  // kind=case（w=0.7）[0.75, 1.05, 0.15] ／ flyer [0.53, 0.61, 0.21] ／ menu [0.75, 0.75, 0.14]
  real: [0.75, 1.05, 0.15],
  origin: 'wall-bottom-center：局所 z=0 = 壁面, y=0 = ケース下端（+Z = 外側, 前面 +Z）',
};

const DEFAULT_OPTIONS = { kind: 'case', w: 0.7, seed: 12 };

const noOut = (o) => { o.userData.noOutline = true; return o; };
const D2R = Math.PI / 180;
const quad = (w, h) => new PlaneGeometry(w, h);

/** ビス頭（＋ワッシャ）：+Z 面に出る */
function screw(parent, K, x, y, z, r = 0.0058) {
  parent.add(noOut(mesh(cyl(r, r * 0.85, 0.0075, 6), K.stainless, { pos: [x, y, z], rot: [Math.PI / 2, 0, 0], cast: false })));
  parent.add(noOut(mesh(cyl(r * 1.7, r * 1.7, 0.0022, 10), K.aluDk, { pos: [x, y, z - 0.0025], rot: [Math.PI / 2, 0, 0], cast: false })));
}

function build(options = {}) {
  const kind = options.kind ?? 'case';
  const W0 = options.w ?? 0.7;
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const g = grp('poster-case:' + kind);

  /* ---------------- 寸法 ---------------- */
  const W = kind === 'flyer' ? W0 * 0.68 : W0;
  const H = kind === 'case' ? W0 * 1.40 : kind === 'flyer' ? W0 * 0.78 : W0 * 0.98;
  const DP = kind === 'case' ? 0.074 : kind === 'flyer' ? 0.116 : 0.064;
  const FW = 0.026;                                  // 枠の見付幅
  const zF = DP / 2 - 0.014;                         // 枠の中心 z
  const fFace = zF + DP * 0.31;                      // 枠の前端面
  const az = fFace - 0.012;                          // アクリルの中心 z（枠より 12mm 引っ込む）
  const acW = W - FW * 1.15, acH = H - FW * 1.15;
  const zBase = 0.0148;                              // 最奥のポスター面

  /* ---------------- 材質 ---------------- */
  const K = {
    alu: MAT.metal('#c5c9c5', { worn: 0.5, repeat: 6 }),
    aluDk: MAT.metal('#a3a8aa', { worn: 0.85, repeat: 8 }),
    galv: MAT.galvanized({ repeat: 5 }),
    iron: MAT.darkIron({ repeat: 6 }),
    stainless: MAT.stainless({ repeat: 9 }),
    back: MAT.hardPlastic('#e9e4d6', { repeat: 3, sat: 0.9, tint: '#f3ecd9' }),
    rubber: MAT.rubber('#2f3238'),
    pvc: MAT.plastic('#d2cec0', { steps: 2 }),
    acrylic: MAT.glassLite({ color: '#ece2c4', opacity: 0.28 }),   // 黄変したアクリル板
  };
  const paperM = (map) => MAT.poster({ map, sat: 0.94 });

  /* ================ 1. 背板・壁固定金物・シール跡 ================ */
  const back = grp('back-panel');
  g.add(back);
  back.add(mesh(rbox(W, H, 0.012, 0.003, 2), K.back, { pos: [0, H / 2, 0.007] }));
  back.add(mesh(box(W - 0.02, 0.010, 0.006), K.aluDk, { pos: [0, H - 0.022, 0.014] }));
  back.add(mesh(box(W - 0.02, 0.010, 0.006), K.aluDk, { pos: [0, 0.024, 0.014] }));
  const brk = grp('wall-brackets');
  g.add(brk);
  for (const sx of [-1, 1]) {
    const bx = sx * (W / 2 - 0.075);
    brk.add(mesh(box(0.044, 0.092, 0.010), K.galv, { pos: [bx, H * 0.76, 0.004] }));
    brk.add(mesh(box(0.044, 0.010, 0.050), K.galv, { pos: [bx, H * 0.76 - 0.048, 0.028] }));
    brk.add(mesh(box(0.036, 0.060, 0.010), K.galv, { pos: [bx, H * 0.26, 0.004] }));
    for (const by of [H * 0.76 + 0.026, H * 0.26]) {
      brk.add(noOut(mesh(cyl(0.0072, 0.0072, 0.026, 6), K.iron, { pos: [bx, by, 0.008], rot: [Math.PI / 2, 0, 0] })));
      brk.add(noOut(mesh(cyl(0.0125, 0.0125, 0.004, 12), K.rubber, { pos: [bx, by, 0.0016], rot: [Math.PI / 2, 0, 0] })));
    }
    weather(brk, { w: 0.07, h: 0.09, pos: [bx + sx * 0.024, H * 0.30, 0.011], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + Math.round(11 + sx * 3), density: 1.6, spread: 0.010 });
  }
  // 壁際の古い接着剤残り（背板の側面）
  decal(back, { map: TEX.wear({ kind: 'chip', color: '#c9c2b0', seed: seed + 20, density: 1.0 }), w: 0.05, h: H * 0.16, pos: [W / 2 + 0.0022, H * 0.10, zF], rot: [0, Math.PI / 2, 0], opacity: 0.5 });

  /* ================ 2. 中のポスター（重ね・日付） ================ */
  const posters = grp('posters');
  g.add(posters);
  if (kind === 'menu') {
    const pw = (W - FW * 2 - 0.032) / 3;
    for (let i = 0; i < 3; i++) {
      const x = -(W - FW * 2 - 0.032) / 2 + pw * (i + 0.5);
      posters.add(noOut(mesh(box(pw - 0.004, H - FW * 2 - 0.018, 0.0012), paperM(TEX.poster({
        title: ['café', 'おべんとう', 'アイス'][i],
        sub: ['4/1 まで', '毎週 火・金 入荷', '期間限定 4/1〜'][i],
        bg: ['#f7f0e2', '#fdf6e6', '#f4efe4'][i],
        accent: [PAL.storeBand3, PAL.storeBand, PAL.storeBand2][i], seed: seed + 21 + i,
      })), { pos: [x, H / 2, zBase + 0.004 * i], rot: [0, 0, (i - 1) * 0.6 * D2R], cast: false })));
    }
    posters.add(noOut(mesh(box(pw * 1.6, 0.085, 0.0012), paperM(TEX.poster({ title: '3 月の品書き', sub: '2026 3/31 まで', bg: '#eae4d6', accent: PAL.register, seed: seed + 27 })), { pos: [-W * 0.10, 0.052, zBase + 0.0015], rot: [0, 0, -2.4 * D2R], cast: false })));
  } else if (kind === 'flyer') {
    const pw = W - FW * 2 - 0.018, ph = H * 0.60;
    posters.add(noOut(mesh(box(pw, ph, 0.0012), paperM(TEX.poster({ title: '地域だより', sub: '4 月号 三丁目自治会', bg: '#f6f1e4', accent: PAL.signGreen, seed: seed + 31 })), { pos: [0, H * 0.40, zBase + 0.002], cast: false })));
    posters.add(noOut(mesh(box(pw * 0.90, ph * 0.92, 0.0012), paperM(TEX.poster({ title: '春の健康教室', sub: '4/12（日）10 時〜', bg: '#fdf6e8', accent: PAL.storeBand3, seed: seed + 32 })), { pos: [0.014, H * 0.42, zBase + 0.006], rot: [0, 0, 2.6 * D2R], cast: false })));
    // 下部の取り出し棚に積まれたチラシ（ずれて段差になる）
    for (let i = 0; i < 5; i++) {
      posters.add(noOut(mesh(box(W - FW * 2 - 0.030, 0.0032, 0.060), MAT.paper({ color: i % 2 ? '#f6f1e3' : '#efe9da' }), {
        pos: [range(rnd, -0.014, 0.014), H * 0.13 + i * 0.0038, DP * 0.40], rot: [0, range(rnd, -0.06, 0.06), 0], cast: false,
      })));
    }
  } else {
    const pw = W - FW * 2 - 0.016, ph = H - FW * 2 - 0.016;
    posters.add(noOut(mesh(box(pw, ph, 0.0012), paperM(TEX.poster({ title: '春の限定商品', sub: '2026 4/1 〜 4/30', bg: '#f7f0df', accent: PAL.storeBand, seed: seed + 35 })), { pos: [0, H / 2, zBase + 0.002], cast: false })));
    posters.add(noOut(mesh(box(pw * 0.86, ph * 0.42, 0.0012), paperM(TEX.poster({ title: 'お花見弁当', sub: '4/3 予約開始', bg: '#fdf4e6', accent: PAL.storeBand3, seed: seed + 36 })), { pos: [-pw * 0.05, H * 0.30, zBase + 0.006], rot: [0, 0, -2.2 * D2R], cast: false })));
    posters.add(noOut(mesh(box(pw * 0.38, ph * 0.22, 0.0012), paperM(TEX.poster({ title: 'スタッフ募集', sub: '4/20まで 面接実施', bg: '#f2eee2', accent: PAL.storeBand2, seed: seed + 37 })), { pos: [pw * 0.24, H * 0.84, zBase + 0.010], rot: [0, 0, 4.5 * D2R], cast: false })));
    // 前回の貼り残し（下辺からはみ出す）
    posters.add(noOut(mesh(box(pw * 1.02, ph * 0.075, 0.0010), paperM(TEX.poster({ title: '越冬おでん', sub: '2/28 終了', bg: '#e6e0d2', accent: PAL.register, seed: seed + 38 })), { pos: [0.010, 0.052, zBase - 0.001], rot: [0, 0, 1.6 * D2R], cast: false })));
  }
  // 日焼けて反ったポスターの下端（浮き）
  posters.add(noOut(mesh(box(W - FW * 2 - 0.05, 0.0016, 0.012), K.pvc, { pos: [0.018, 0.038, zBase + 0.010], rot: [0, 0, 1.4 * D2R], cast: false })));

  /* ================ 3. アルミ枠・アクリル・金物 ================ */
  const frame = grp('alu-frame');
  g.add(frame);
  frame.add(mesh(rbox(W, FW, DP * 0.62, 0.005, 2), K.alu, { pos: [0, H - FW / 2, zF] }));
  frame.add(mesh(rbox(W, FW, DP * 0.62, 0.005, 2), K.alu, { pos: [0, FW / 2, zF] }));
  frame.add(mesh(rbox(FW, H - FW * 2, DP * 0.62, 0.005, 2), K.alu, { pos: [-(W - FW) / 2, H / 2, zF] }));
  frame.add(mesh(rbox(FW, H - FW * 2, DP * 0.62, 0.005, 2), K.alu, { pos: [(W - FW) / 2, H / 2, zF] }));
  // メニューは中央にマドリオン
  if (kind === 'menu') for (const mx of [-1, 1]) frame.add(mesh(rbox(0.010, H - FW * 2, DP * 0.5, 0.003, 2), K.aluDk, { pos: [mx * (W - FW * 2) / 6, H / 2, zF] }));
  // 45° 取り合いのシーム
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    frame.add(noOut(mesh(box(0.0032, FW * 1.6, DP * 0.66), K.aluDk, {
      pos: [sx * (W - FW) / 2, H / 2 + sy * (H / 2 - FW / 2), zF], rot: [0, 0, sy * 45 * D2R], cast: false,
    })));
  }
  // ゴムパッキン（アクリルの押えまわり・アクリルの 5mm 後ろ）
  const gz = az - 0.006;
  frame.add(mesh(box(acW + 0.012, 0.007, 0.006), K.rubber, { pos: [0, H / 2 + acH / 2 + 0.006, gz] }));
  frame.add(mesh(box(acW + 0.012, 0.007, 0.006), K.rubber, { pos: [0, H / 2 - acH / 2 - 0.006, gz] }));
  for (const sx of [-1, 1]) frame.add(mesh(box(0.007, acH + 0.012, 0.006), K.rubber, { pos: [sx * (acW / 2 + 0.006), H / 2, gz] }));
  // 枠ビス（4 隅＋上下中間）と周りの錆
  for (const sx of [-1, 1]) {
    screw(frame, K, sx * (W / 2 - FW * 0.5), H - FW * 0.5, fFace + 0.002);
    screw(frame, K, sx * (W / 2 - FW * 0.5), FW * 0.5, fFace + 0.002);
    weather(frame, { w: 0.05, h: 0.075, pos: [sx * (W / 2 - FW * 0.5), H - FW * 0.5 - 0.050, fFace + 0.0022], kind: 'rust', color: '#96602f', opacity: 0.6, seed: seed + Math.round(41 + sx * 2), density: 1.3, spread: 0.004 });
  }
  for (const bx of [-W * 0.18, W * 0.18]) {
    screw(frame, K, bx, H - FW * 0.5, fFace + 0.002, 0.0048);
    screw(frame, K, bx, FW * 0.5, fFace + 0.002, 0.0048);
  }
  // 角の打ち痕（欠け）
  frame.add(noOut(mesh(rbox(0.024, 0.020, DP * 0.48, 0.005, 2), K.aluDk, { pos: [W / 2 - FW * 0.5, H * 0.63, zF + 0.003], rot: [0, 0, 9 * D2R] })));
  // 剥がした税込表示・管理番号ステッカーの残り（下枠の見付）
  for (let i = 0; i < 3; i++) {
    decal(frame, {
      map: TEX.wear({ kind: 'chip', color: i === 1 ? '#efe6cd' : '#dcd6c6', seed: seed + 15 + i, density: 1.1 }),
      w: 0.062 + i * 0.010, h: 0.017, pos: [(i - 1) * 0.10 + 0.03, FW * 0.5, fFace + 0.0024], opacity: 0.75, order: i,
    });
  }
  decal(frame, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 19, density: 1.0 }), w: DP * 0.5, h: H * 0.22, pos: [W / 2 + 0.0024, H * 0.42, zF], rot: [0, Math.PI / 2, 0], opacity: 0.30 });

  // アクリル前面（黄変・拭き傷・雨染み）
  const ac = grp('acrylic');
  g.add(ac);
  const panel = mesh(rbox(acW, acH, 0.005, 0.002, 2), K.acrylic, { pos: [0, H / 2, az], renderOrder: 12, name: 'acrylic' });
  panel.castShadow = false;
  ac.add(panel);
  decal(ac, { map: TEX.gradient({ stops: [[0, 'rgba(244,220,150,1)'], [0.5, 'rgba(250,236,190,0.5)'], [1, 'rgba(255,255,255,0)']] }), w: acW, h: acH, pos: [0, H / 2 + 0.02, az + 0.004], opacity: 0.34, order: 9 });
  decal(ac, { map: TEX.wear({ kind: 'scratch', color: '#ffffff', seed: seed + 48, density: 1.6 }), w: acW * 0.88, h: acH * 0.78, pos: [0, H / 2 - acH * 0.06, az + 0.0042], opacity: 0.42, order: 10 });
  for (let i = 0; i < 4; i++) {
    decal(ac, { map: TEX.wear({ kind: 'dirt', color: '#8d8471', seed: seed + 51 + i, density: 0.8 }), w: 0.030, h: acH * range(rnd, 0.28, 0.55), pos: [-acW / 2 + 0.035 + i * (acW / 3.6), H / 2 - acH * 0.10, az + 0.0044], opacity: 0.48, order: 10 + i });
  }
  // 落書きを消した跡（アクリル面に残るghost）
  decal(ac, { map: TEX.wear({ kind: 'chip', color: '#f0ead8', seed: seed + 57, density: 1.0 }), w: acW * 0.30, h: acH * 0.13, pos: [-acW * 0.20, acH * 0.30, az + 0.0046], opacity: 0.5, order: 14 });

  // 蝶番・施錠・ワイヤ
  const hg = grp('hardware');
  g.add(hg);
  for (const hy of [H * 0.74, H * 0.30]) {
    hg.add(mesh(rbox(0.020, 0.048, 0.030, 0.004, 2), K.aluDk, { pos: [-W / 2 + 0.008, hy, zF + 0.004] }));
    hg.add(noOut(mesh(cyl(0.0062, 0.0062, 0.050, 8), K.stainless, { pos: [-W / 2 + 0.002, hy, zF + 0.004], rot: [0, 0, Math.PI / 2] })));
  }
  const lock = grp('lock');
  lock.position.set(0, FW * 0.5, fFace + 0.004);
  hg.add(lock);
  lock.add(mesh(rbox(0.034, 0.030, 0.010, 0.003, 2), K.stainless, { pos: [0, 0, 0.004] }));
  lock.add(noOut(mesh(cyl(0.0068, 0.0068, 0.007, 10), K.iron, { pos: [0, 0, 0.011], rot: [Math.PI / 2, 0, 0] })));
  lock.add(noOut(mesh(box(0.0032, 0.011, 0.004), K.iron, { pos: [0, 0, 0.013] })));
  lock.add(noOut(mesh(tubeOf([[0.014, -6e-3, 0.004], [0.030, 0.000, -8e-3], [0.036, 0.012, -0.02]], 0.0026, 10, 5), K.stainless)));

  /* ================ 4. チラシ投入口（kind=flyer） ================ */
  if (kind === 'flyer') {
    const slot = grp('flyer-slot');
    g.add(slot);
    const sw = W * 0.58, tdep = DP * 0.60, topY = H + 0.004, tz0 = zF;
    // 切り欠きの肩（左右に残るアルミ）＋ 前後リム
    for (const sx of [-1, 1]) slot.add(mesh(box((W - sw) / 2 + 0.008, 0.016, tdep), K.alu, { pos: [sx * (sw / 2 + (W - sw) / 4 + 0.004), topY + 0.006, tz0] }));
    slot.add(mesh(box(sw, 0.012, 0.010), K.aluDk, { pos: [0, topY + 0.004, tz0 - tdep / 2 + 0.005] }));
    slot.add(mesh(box(sw, 0.010, 0.008), K.aluDk, { pos: [0, topY + 0.002, tz0 + tdep / 2 - 0.004] }));
    slot.add(mesh(box(sw, 0.004, tdep - 0.014), K.rubber, { pos: [0, topY - 0.004, tz0] }));      // 投入口の暗部
    // 少し開いた押えフラップ
    const fp = grp('slot-flap');
    fp.position.set(0, topY + 0.006, tz0 - tdep / 2 + 0.006);
    fp.rotation.x = -26 * D2R;
    slot.add(fp);
    fp.add(mesh(rbox(sw - 0.006, 0.0022, tdep - 0.010, 0.001, 2), K.aluDk, { pos: [0, 0.003, (tdep - 0.010) / 2] }));
    fp.add(noOut(mesh(cyl(0.0038, 0.0038, sw - 0.010, 6), K.stainless, { pos: [0, 0.005, 0.002], rot: [0, 0, Math.PI / 2] })));
    // 投入口から出るチラシ（3 枚・ずれて浮く）
    for (let i = 0; i < 3; i++) {
      slot.add(noOut(mesh(box(sw * 0.86 - i * 0.014, 0.0014, 0.13), MAT.paper({ color: ['#fbf7ea', '#f4eee0', '#efe9db'][i] }), {
        pos: [range(rnd, -0.014, 0.014), topY + 0.008 + i * 0.0024, tz0 + 0.004 - i * 0.008],
        rot: [(-14 + i * 3) * D2R, 0, 0], cast: false,
      })));
    }
    weather(slot, { w: 0.16, h: 0.05, pos: [0, topY + 0.014, tz0 + tdep * 0.30], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6f6858', opacity: 0.5, seed: seed + 61, density: 1.5, spread: 0.005 });
  }

  /* ================ 5. 上部の防水カバー（笠金物・コケ・雨だれ） ================ */
  const hood = grp('rain-hood');
  g.add(hood);
  const hwd = DP + 0.075;
  hood.add(mesh(rbox(W + 0.050, 0.012, hwd, 0.004, 2), K.alu, { pos: [0, H + 0.032, hwd / 2 - 0.018], rot: [-6 * D2R, 0, 0] }));
  hood.add(mesh(box(W + 0.050, 0.020, 0.010), K.aluDk, { pos: [0, H + 0.026, hwd - 0.020] }));                    // 滴下
  for (const sx of [-1, 1]) hood.add(mesh(box(0.012, 0.046, hwd * 0.88), K.alu, { pos: [sx * ((W + 0.050) / 2 - 0.006), H + 0.042, hwd / 2 - 0.020] }));
  hood.add(mesh(box(W + 0.02, 0.018, 0.014), K.galv, { pos: [0, H + 0.014, 0.014] }));                            // 壁際押え
  hood.add(noOut(mesh(cyl(0.0055, 0.0055, 0.020, 6), K.iron, { pos: [W * 0.30, H + 0.014, 0.020], rot: [Math.PI / 2, 0, 0] })));
  // コケの定着（カバー上・壁側）
  for (const [hx, hz] of [[-W * 0.28, 0.036], [W * 0.10, 0.042], [W * 0.34, 0.030]]) {
    hood.add(noOut(mesh(quad(0.10, 0.052), MAT.grass({ base: PAL.moss, repeat: 6 }), { pos: [hx, H + 0.0405, hz + 0.024], rot: [-Math.PI / 2 + 6 * D2R, 0, 0], cast: false })));
  }
  weather(hood, { w: W * 0.55, h: 0.06, pos: [0, H + 0.040, hwd * 0.42], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#5f7f4a', opacity: 0.5, seed: seed + 63, density: 1.8, spread: 0.005 });
  // カバー下を伝う雨染み（アクリル前面の縦筋）
  for (let i = 0; i < 5; i++) {
    decal(ac, { map: TEX.wear({ kind: 'dirt', color: '#8b8574', seed: seed + 65 + i, density: 0.7 }), w: 0.020, h: acH * range(rnd, 0.30, 0.58), pos: [-acW / 2 + 0.03 + i * (acW / 5), H * 0.52, az + 0.0048], opacity: 0.48, order: 12 + i });
  }
  weather(frame, { w: W * 0.26, h: 0.036, pos: [W * 0.22, 0.042, fFace + 0.0026], kind: 'dirt', color: '#6f6858', opacity: 0.5, seed: seed + 73, density: 1.7, spread: 0.004 });
  // 枠下部の錆の垂れ・アルミの白錆
  weather(frame, { w: FW * 1.1, h: H * 0.20, pos: [-(W - FW) / 2, H * 0.24, fFace + 0.0026], kind: 'rust', color: '#9a7f5c', opacity: 0.42, seed: seed + 75, density: 1.3, spread: 0.008 });

  /* ================ 6. 春の花びら（カバー上に 1 枚） ================ */
  g.add(noOut(mesh(quad(0.030, 0.026), MAT.petal({ tone: 1, glow: 0.18, alphaTest: 0.2, map: TEX.petal({ tone: 1, mode: 'single' }) }), {
    pos: [-W * 0.22, H + 0.0415, DP * 0.62], rot: [-Math.PI / 2 + 6 * D2R, 0.5, 0.3], cast: false,
  })));

  return finish(g, { outline: 'thin', minSize: 0.026 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
