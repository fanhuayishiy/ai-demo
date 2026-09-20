import { g as grp, M as MAT, P as PAL, m as mesh, c as cyl, t as tor, w as weather, a as sph, b as box, o as lathe, n as range, r as rbox, D as DoubleSide, T as TEX, h as decal, p as shadowBlob, q as finish, z as rand, ag as CylinderGeometry } from './index-CNQWoZB0.js';

//  assets/street/post-box.js —— 郵便ポスト（丸型・赤の退色、差出口フラップ、収集時間札、鍵穴、根元の錆と泥）
//  原点 = 地面接触中心 / +Y 上 / 正面（差出口）+Z ／ 収集口は背面 -Z

const meta = {
  id: 'post-box',
  real: [0.40, 1.31, 0.40],      // 丸型（基礎込み）。+Z が差出口面
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

/** 円筒に添う曲面シェル（+Z 中心に angle だけ展開、a0 で開始角をずらせる） */
function shell(r, h, angle, mat, { seg = 18, a0 = null, inner = false } = {}) {
  const start = a0 == null ? -angle / 2 : a0;
  const geo = new CylinderGeometry(r, r, h, seg, 1, true, start, angle);
  const m = mesh(geo, inner ? MAT.paint('#1b1d20', { steps: 2, shadowAmt: 1, side: DoubleSide }) : mat, { cast: !inner, receive: true });
  m.userData.noOutline = true;                       // 薄片シェルは描边を付けない
  return m;
}

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);

  const g = grp('post-box');

  /* ---------------- 寸法 ---------------- */
  const R = 0.163;                                   // 胴半径
  const yBody0 = 0.155, yBody1 = 1.050, yDome = 1.255;

  /* ---------------- 材質 ---------------- */
  // 日焼けで退色した赤（PAL.vendingRed を色褪せた指定色）
  const redPaint = MAT.metalPaint(PAL.vendingRed, { worn: 0.65, repeat: 2, sat: 0.78, tint: '#ffe6d8' });
  const redDeep = MAT.metalPaint('#a9382f', { worn: 0.85, repeat: 3, sat: 0.82 });
  const aluTrim = MAT.metal('#c6cbcd', { spec: 0.62, repeat: 4 });
  const darkIron = MAT.darkIron({ worn: 0.9, repeat: 5 });
  const concrete = MAT.concrete({ repeat: 3 });
  const whiteEnamel = MAT.paint(PAL.marking, { steps: 2, sat: 0.88, tint: '#f6f1e2' });

  /* ================= 基礎・根元 ================= */
  const foot = grp('footing');
  g.add(foot);
  foot.add(mesh(cyl(0.196, 0.212, 0.052, 24), concrete, { pos: [0, 0.026, 0] }));
  foot.add(mesh(cyl(0.176, 0.184, 0.020, 22), MAT.concrete({ repeat: 3, tint: '#d8d2c6' }), { pos: [0, 0.062, 0] }));
  foot.add(mesh(tor(0.197, 0.0075, 6, 24), MAT.paint('#8d8a86', { steps: 2 }), { pos: [0, 0.050, 0], rot: [Math.PI / 2, 0, 0] }));
  // 根元の錆と泥はね
  foot.add(mesh(cyl(R + 0.011, R + 0.018, 0.13, 22), redDeep, { pos: [0, 0.128, 0] }));
  weather(foot, { w: 0.30, h: 0.10, pos: [0, 0.115, R + 0.014], kind: 'rust', color: PAL.rust, opacity: 0.66, seed: seed + 3, density: 1.9, spread: 0.008 });
  weather(foot, { w: 0.26, h: 0.07, pos: [0.03, 0.070, R + 0.012], kind: 'dirt', color: '#5d5346', opacity: 0.62, seed: seed + 4, density: 2.0, spread: 0.006 });
  weather(foot, { w: 0.16, h: 0.06, pos: [-0.09, 0.058, 0.16], kind: 'moss', color: PAL.moss, opacity: 0.55, seed: seed + 5, density: 1.5, spread: 0.005 });
  weather(foot, { w: 0.22, h: 0.05, pos: [0.04, 0.030, 0.19], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a7161', opacity: 0.5, seed: seed + 6, spread: 0.006 });

  /* ================= 胴 ================= */
  const body = grp('body');
  g.add(body);
  body.add(mesh(cyl(R - 0.004, R, yBody1 - yBody0, 26), redPaint, { pos: [0, (yBody0 + yBody1) / 2, 0] }));
  // 上下のビード（絞りリング）
  for (const [y, rr, hh] of [[yBody0 + 0.006, R + 0.005, 0.014], [yBody1 - 0.010, R + 0.002, 0.012]]) {
    body.add(mesh(cyl(rr, rr, hh, 26), redDeep, { pos: [0, y, 0] }));
  }
  body.add(mesh(tor(R + 0.004, 0.0065, 6, 26), aluTrim, { pos: [0, yBody1 - 0.001, 0], rot: [Math.PI / 2, 0, 0] }));
  // 胴のリベット 2 列
  for (let ring = 0; ring < 2; ring++) {
    const y = yBody0 + 0.10 + ring * 0.68;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + ring * 0.31;
      body.add(mesh(sph(0.0055, 6, 5), aluTrim, { pos: [Math.sin(a) * (R + 0.001), y, Math.cos(a) * (R + 0.001)], cast: false }));
    }
  }
  // 側面の溶接シーム（縦）
  body.add(mesh(box(0.010, yBody1 - yBody0 - 0.03, 0.008), redDeep, { pos: [-R + 0.002, (yBody0 + yBody1) / 2, -0.03], rot: [0, 0.18, 0] }));

  /* ================= 肩ドームと上部 ================= */
  const dome = grp('dome');
  g.add(dome);
  dome.add(mesh(lathe([
    [R + 0.004, yBody1 - 0.004],
    [R + 0.002, yBody1 + 0.030],
    [R - 0.008, yBody1 + 0.075],
    [R - 0.034, yBody1 + 0.124],
    [0.096, yDome - 0.024],
    [0.060, yDome - 0.004],
    [0.052, yDome + 0.006],
    [0.020, yDome + 0.010],
    [0, yDome + 0.012],
  ], 26), redPaint, { pos: [0, 0, 0] }));
  dome.add(mesh(tor(R + 0.006, 0.0085, 6, 26), redDeep, { pos: [0, yBody1 + 0.002, 0], rot: [Math.PI / 2, 0, 0] }));
  // 頂部の通気キャップ
  dome.add(mesh(cyl(0.050, 0.054, 0.016, 16), aluTrim, { pos: [0, yDome + 0.018, 0] }));
  dome.add(mesh(sph(0.046, 14, 9), redDeep, { pos: [0, yDome + 0.026, 0], scale: [1, 0.62, 1] }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    dome.add(mesh(box(0.010, 0.010, 0.014), darkIron, { pos: [Math.sin(a) * 0.040, yDome + 0.014, Math.cos(a) * 0.040], rot: [0, a, 0], cast: false }));
  }
  // 鳥フン（上部）
  weather(dome, { w: 0.14, h: 0.10, pos: [0.02, yDome + 0.028, 0.05], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#eae6da', opacity: 0.6, seed: seed + 11, density: 0.9, spread: 0.006 });
  for (let i = 0; i < 3; i++) {
    dome.add(mesh(sph(0.013 + rnd() * 0.008, 8, 6), MAT.paint('#e6e2d4', { steps: 2, shadowAmt: 0.6 }), {
      pos: [range(rnd, -0.06, 0.07), yDome + 0.030 + rnd() * 0.004, range(rnd, -0.05, 0.07)], scale: [1, 0.34, 1.5], rot: [0, range(rnd, 0, 3), 0], cast: false,
    }));
  }

  /* ================= 差出口（正面 +Z／曲面フレームの重ね造り） ================= */
  const mouth = grp('mouth');
  g.add(mouth);
  const yM = 0.856, HA = 0.58;                              // 開口の半角
  const put = (o, y) => { o.position.set(0, y, 0); mouth.add(o); return o; };
  put(shell(R + 0.004, 0.168, 1.30, redDeep, { seg: 20 }), yM);                       // 押さえ段（胴から立ち上がる板）
  put(shell(R + 0.010, 0.112, 1.16, null, { seg: 18, inner: true }), yM - 0.004);      // 暗い投入口
  const rimR = R + 0.016;
  put(shell(rimR, 0.038, 1.44, aluTrim, { seg: 22 }), yM + 0.0735);                    // 上枠
  put(shell(rimR, 0.038, 1.44, aluTrim, { seg: 22 }), yM - 0.0735);                    // 下枠
  put(shell(rimR, 0.118, 0.10, aluTrim, { seg: 3, a0: HA - 0.05 }), yM - 0.004);       // 右枠
  put(shell(rimR, 0.118, 0.10, aluTrim, { seg: 3, a0: -HA - 0.05 }), yM - 0.004);      // 左枠
  put(shell(rimR + 0.003, 0.010, 1.44, MAT.paint('#8f9497', { worn: 0.9 }), { seg: 22 }), yM + 0.094);   // 枠上の水切り
  // フラップ（上端で蝶番、8°開く）
  const flap = grp('flap', { pos: [0, yM + 0.052, rimR + 0.002] });
  mouth.add(flap);
  flap.rotation.x = 8 * D2R;
  flap.add(mesh(rbox(0.206, 0.104, 0.008, 0.003, 2), MAT.metalPaint('#c0453c', { worn: 0.6, repeat: 3, sat: 0.8, tint: '#ffe8dc' }), { pos: [0, -0.052, 0] }));
  flap.add(mesh(box(0.196, 0.010, 0.012), aluTrim, { pos: [0, -1e-3, 0.002] }));                 // 蝶番側バー
  flap.add(mesh(box(0.176, 0.008, 0.010), aluTrim, { pos: [0, -0.101, 0] }));                      // 前縁
  for (const x of [-0.072, 0.072]) flap.add(mesh(cyl(0.0062, 0.0062, 0.030, 8), darkIron, { pos: [x, 0.004, 0.002], rot: [Math.PI / 2, 0, 0] }));
  flap.add(mesh(rbox(0.046, 0.014, 0.010, 0.004, 2), MAT.plastic('#efeadd'), { pos: [0, -0.098, 0.008] }));   // 引き手
  // 「郵便」標記（曲面バンド）
  const band = shell(R + 0.014, 0.050, 0.92, MAT.poster({ map: TEX.signboard({ text: '郵便', sub: 'POST', bg: '#f6f2e6', fg: '#a9382f' }), side: DoubleSide }), { seg: 18 });
  band.position.set(0, yM + 0.150, 0);
  mouth.add(band);
  // 収集時間札（下部の曲面プレート・アルミ押え付き）
  const time = shell(R + 0.013, 0.070, 1.02, MAT.poster({ map: TEX.signboard({ text: '収集 17:00', sub: '平日 1 回・土曜 2 回', bg: '#f4efe0', fg: '#3a4448' }), side: DoubleSide }), { seg: 20 });
  time.position.set(0, 0.624, 0);
  mouth.add(time);
  mouth.add(mesh(tor(R + 0.015, 0.0045, 5, 22), aluTrim, { pos: [0, 0.664, 0], rot: [Math.PI / 2, 0, 0] }));
  mouth.add(mesh(tor(R + 0.015, 0.0045, 5, 22), aluTrim, { pos: [0, 0.584, 0], rot: [Math.PI / 2, 0, 0] }));
  // 〒 標記（上部・肩の下）
  const mark = shell(R + 0.014, 0.058, 0.44, MAT.poster({ map: TEX.lightPanel({ text: '〒', bg: '#f6f2e6', fg: '#a9382f', mode: 'sign' }), side: DoubleSide }), { seg: 10 });
  mark.position.set(0, 0.982, 0);
  mouth.add(mark);
  weather(mouth, { w: 0.16, h: 0.06, pos: [0.02, yM - 0.108, R + 0.018], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 18, density: 1.6, spread: 0.005 });   // 差出口下の錆・手あか
  weather(mouth, { w: 0.12, h: 0.05, pos: [-0.04, 0.556, R + 0.016], kind: 'dirt', color: '#6b6152', opacity: 0.5, seed: seed + 19, spread: 0.004 });

  /* ================= 背面：収集扉・鍵穴・蝶番 ================= */
  const back = grp('collector-door');
  g.add(back);
  const yD = 0.520;
  back.add(mesh(box(0.206, 0.286, 0.012), aluTrim, { pos: [0, yD, -R - 0.006], rot: [0, Math.PI, 0] }));   // 扉
  back.add(mesh(box(0.170, 0.248, 0.008), redDeep, { pos: [0, yD, -R - 0.013] }));                          // 扉の内側押え
  for (const y of [0.128, -0.128]) back.add(mesh(box(0.170, 0.010, 0.006), aluTrim, { pos: [0, yD + y, -R - 0.017] }));
  for (const x of [-0.082, 0.082]) back.add(mesh(cyl(0.0075, 0.0075, 0.034, 8), darkIron, { pos: [x, yD + 0.148, -R - 0.012], rot: [0, 0, Math.PI / 2] }));   // 蝶番ピン
  // 鍵穴（レーバー錠）
  const lock = grp('lock');
  lock.position.set(0, yD - 0.030, -R - 0.019);
  back.add(lock);
  lock.add(mesh(rbox(0.050, 0.064, 0.010, 0.004, 2), MAT.metal('#b9bec1', { repeat: 6 })));
  lock.add(mesh(cyl(0.0072, 0.0072, 0.010, 12), darkIron, { pos: [0, 0.012, 0.006], rot: [Math.PI / 2, 0, 0] }));
  lock.add(mesh(box(0.0050, 0.013, 0.008), darkIron, { pos: [0, 0.004, 0.006] }));
  lock.add(mesh(cyl(0.0105, 0.0105, 0.004, 12), MAT.metal('#8f9497', { worn: 0.9, repeat: 6 }), { pos: [0, -0.018, 0.005], rot: [Math.PI / 2, 0, 0] }));
  weather(lock, { w: 0.05, h: 0.05, pos: [0, -0.03, 0.008], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 21, density: 1.4, spread: 0.004 });
  // 収集扉まわりの錆
  weather(back, { w: 0.22, h: 0.14, pos: [0, yD - 0.16, -R - 0.014], rot: [0, Math.PI, 0], kind: 'rust', color: '#8a5236', opacity: 0.6, seed: seed + 22, density: 1.7, spread: 0.006 });

  /* ================= 側面の銘板・貼紙剥がし跡 ================= */
  const plate = grp('plate');
  g.add(plate);
  plate.add(mesh(rbox(0.126, 0.048, 0.008, 0.003, 2), whiteEnamel, { pos: [R - 0.004, 0.356, 0.052], rot: [0, Math.PI / 2 - 0.28, 0] }));
  decal(plate, { map: TEX.signboard({ text: '春風台 12', bg: '#f6f2e6', fg: '#4a5259' }), w: 0.118, h: 0.030, pos: [R + 0.002, 0.356, 0.052], rot: [0, Math.PI / 2 - 0.28, 0] });
  // 貼紙を剥がした跡（長方形の糊残り）
  decal(g, { map: TEX.wear({ kind: 'chip', color: '#f3e7d3', seed: seed + 31, density: 1.1 }), w: 0.10, h: 0.13, pos: [-R + 0.002, 0.44, -0.06], rot: [0, -Math.PI / 2 + 0.2, 0], opacity: 0.72 });
  decal(g, { map: TEX.adStrip({ text: '便覧', bg: '#e8e2d0', seed: seed + 32 }), w: 0.09, h: 0.022, pos: [-R - 0.001, 0.30, -0.02], rot: [0, -Math.PI / 2, 0], opacity: 0.6 });

  /* ================= 経年：退色・雨筋・苔 ================= */
  // 前面（日向）の退色 band
  decal(g, { map: TEX.gradient({ stops: [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,246,230,0.4)'], [1, 'rgba(255,255,255,0)']] }), w: 0.22, h: 0.40, pos: [0, 0.94, R + 0.004], opacity: 0.30 });
  // 雨樋のような水滴筋（上から下へ）
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    weather(g, { w: 0.020, h: 0.34, pos: [Math.sin(a) * (R + 0.004), 0.62 - (i % 3) * 0.05, Math.cos(a) * (R + 0.004)], rot: [0, a, 0], kind: 'rust', color: i % 3 === 0 ? '#7f8f74' : '#8b8578', opacity: 0.36, seed: seed + 41 + i, density: 0.6, spread: 0.004 });
  }
  // 胴の掉漆・こすり傷
  weather(g, { w: 0.16, h: 0.10, pos: [0.06, 0.30, R + 0.003], kind: 'chip', color: '#d8cbb8', opacity: 0.55, seed: seed + 51, density: 1.7, spread: 0.005 });
  weather(g, { w: 0.12, h: 0.16, pos: [-R - 0.003, 0.66, 0.02], rot: [0, -Math.PI / 2, 0], kind: 'scratch', color: '#f2e6da', opacity: 0.32, seed: seed + 52, density: 1.4, spread: 0.005 });
  weather(g, { w: 0.18, h: 0.10, pos: [-0.02, 0.20, -R - 0.003], rot: [0, Math.PI, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 53, density: 1.5, spread: 0.005 });

  shadowBlob(g, { r: 0.26, pos: [0, 0.004, 0], opacity: 0.3, ratio: 1 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
