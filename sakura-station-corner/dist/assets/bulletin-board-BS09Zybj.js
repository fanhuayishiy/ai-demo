import { g as grp, M as MAT, P as PAL, T as TEX, D as DoubleSide, m as mesh, b as box, r as rbox, c as cyl, w as weather, h as decal, n as range, t as tor, p as shadowBlob, q as finish, z as rand } from './index-BqvI026L.js';

//  assets/street/bulletin-board.js —— 公告掲示板（アルミ枠＋黄変アクリル、重ねPoster、チラシ投函口）
//  原点 = 地面接触中心 / +Y 上 / 正面（表示面）+Z ／ 建物の壁際は -Z 側

const meta = {
  id: 'bulletin-board',
  real: [1.80, 1.60, 0.20],      // options.w で幅可变（既定 1.8m、天端 1.62m）
  origin: 'ground-center',
};

const D2R = Math.PI / 180;

function build(options = {}) {
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const W = Math.max(0.9, Math.min(2.6, options.w ?? 1.8));

  const g = grp('bulletin-board');

  /* ---------------- 寸法 ---------------- */
  const caseY0 = 0.62, caseY1 = 1.46, caseD = 0.10;
  const cw = W - 0.10, chh = caseY1 - caseY0;
  const postX = W / 2 - 0.12;

  /* ---------------- 材質 ---------------- */
  const alu = MAT.metal('#c2c7ca', { spec: 0.6, specPower: 120, repeat: 3 });
  const aluDark = MAT.metal('#a7adb1', { worn: 0.6, repeat: 4 });
  const green = MAT.metalPaint(PAL.signGreen, { worn: 0.7, repeat: 2, tint: '#f0f0e2', sat: 0.82 });      // 色褪せた緑塗装鉄
  const concretePost = MAT.concrete({ repeat: 3, uv: { repeat: [1.6, 4] } });
  const boardBack = MAT.paint('#e3d9c2', { steps: 2, map: TEX.paper({ base: '#e3d9c2' }).map, shadowAmt: 0.9 });
  const cork = MAT.paint('#b99b6a', { steps: 3, map: TEX.wood({ light: '#c8a877', dark: '#9d7a4c', repeat: 2 }).map, spec: 0.08 });
  const acrylic = MAT.glassLite({ color: '#e2ecea', opacity: 0.30, side: DoubleSide });             // 黄変し気味のアクリル
  const gasket = MAT.rubber('#3a3d40');
  const paperWhite = MAT.paint(PAL.marking, { steps: 2 });

  /* ================= 支柱とコンクリート基礎 ================= */
  const posts = grp('posts');
  g.add(posts);
  for (const sx of [-1, 1]) {
    const px = sx * postX;
    posts.add(mesh(box(0.086, caseY1 - 0.02, 0.086), concretePost, { pos: [px, (caseY1 - 0.02) / 2, 0] }));
    posts.add(mesh(rbox(0.086, 0.012, 0.086, 0.004, 2), aluDark, { pos: [px, caseY1 - 0.026, 0] }));      // 上キャップ
    // 基礎（地面より少し盛り上がったコンクリート）
    posts.add(mesh(rbox(0.24, 0.052, 0.24, 0.014, 2), MAT.concrete({ repeat: 3, tint: '#e6e2d8' }), { pos: [px, 0.026, 0] }));
    posts.add(mesh(box(0.19, 0.012, 0.19), MAT.concrete({ repeat: 3, tint: '#cfc9bd' }), { pos: [px, 0.056, 0] }));
    // 柱脚金物＋アンカー 4 本
    posts.add(mesh(box(0.12, 0.010, 0.12), green, { pos: [px, 0.066, 0] }));
    for (let i = 0; i < 4; i++) {
      const dx = i % 2 ? 0.044 : -0.044, dz = i < 2 ? -0.044 : 0.044;
      posts.add(mesh(cyl(0.0075, 0.0075, 0.014, 6), MAT.stainless({ repeat: 8 }), { pos: [px + dx, 0.076, dz] }));
    }
    weather(posts, { w: 0.14, h: 0.16, pos: [px + 0.045, 0.30, 0.045], rot: [0, Math.PI / 4, 0], kind: 'moss', color: PAL.moss, opacity: 0.5, seed: seed + 3 + sx, density: 1.5, spread: 0.006 });
    weather(posts, { w: 0.10, h: 0.12, pos: [px, 0.13, 0.0452], kind: 'dirt', color: '#8d8574', opacity: 0.5, seed: seed + 7 + sx, density: 1.5, spread: 0.005 });
    weather(posts, { w: 0.16, h: 0.04, pos: [px, 0.062, 0.075], kind: 'moss', color: '#6d8a52', opacity: 0.55, seed: seed + 11 + sx, spread: 0.004 });
  }

  /* ================= 箱体（背板・側板・底・上） ================= */
  const body = grp('case-body');
  g.add(body);
  body.add(mesh(box(cw, chh, 0.014), green, { pos: [0, (caseY0 + caseY1) / 2, -caseD / 2 + 0.007] }));      // 背板（外面）
  body.add(mesh(box(cw - 0.02, chh - 0.02, 0.006), boardBack, { pos: [0, (caseY0 + caseY1) / 2, -caseD / 2 + 0.017] }));   // 内壁（白）
  body.add(mesh(box(cw - 0.10, chh - 0.10, 0.005), cork, { pos: [-0.02, (caseY0 + caseY1) / 2 + 0.01, -caseD / 2 + 0.022] }));  // コルク下地
  for (const sx of [-1, 1]) body.add(mesh(box(0.014, chh, caseD), green, { pos: [sx * (cw / 2 - 0.007), (caseY0 + caseY1) / 2, 0] }));
  body.add(mesh(box(cw, 0.014, caseD), green, { pos: [0, caseY1 - 0.007, 0] }));                            // 天
  body.add(mesh(box(cw, 0.016, caseD + 0.01), green, { pos: [0, caseY0 + 0.008, 0] }));                     // 底（少し張り出す）
  // 背面のリブ（板金補強）
  for (const y of [0.86, 1.05, 1.24]) body.add(mesh(box(cw - 0.04, 0.010, 0.008), aluDark, { pos: [0, y, -caseD / 2 - 0.001] }));

  /* ================= アルミ枠（前面）＋アクリル ================= */
  const frame = grp('alu-frame');
  g.add(frame);
  const fg = caseD / 2 - 0.004;                              // 枠の前面位置
  const rim = 0.052, rimT = 0.020;
  frame.add(mesh(rbox(cw, rim, rimT, 0.004, 2), alu, { pos: [0, caseY1 - rim / 2, fg - 0.004] }));
  frame.add(mesh(rbox(cw, rim, rimT, 0.004, 2), alu, { pos: [0, caseY0 + rim / 2, fg - 0.004] }));
  for (const sx of [-1, 1]) frame.add(mesh(rbox(rim, chh - rim * 2, rimT, 0.004, 2), alu, { pos: [sx * (cw / 2 - rim / 2), (caseY0 + caseY1) / 2, fg - 0.004] }));
  // 中央仕切（w が広めのとき）
  if (W > 1.35) {
    const nMid = W > 2.1 ? 2 : 1;
    for (let i = 0; i < nMid; i++) {
      const mx = nMid === 1 ? 0 : (i ? 0.42 : -0.42) * (cw / 1.8);
      frame.add(mesh(rbox(0.036, chh - rim * 2, rimT, 0.004, 2), alu, { pos: [mx, (caseY0 + caseY1) / 2, fg - 0.004] }));
      frame.add(mesh(box(0.014, 0.010, 0.006), MAT.stainless({ repeat: 8 }), { pos: [mx, caseY1 - rim - 0.03, fg + 0.006] }));
    }
  }
  // パッキン（枠の内周）
  frame.add(mesh(box(cw - rim * 2 + 0.01, 0.008, 0.010), gasket, { pos: [0, caseY1 - rim, fg - 0.014] }));
  frame.add(mesh(box(cw - rim * 2 + 0.01, 0.008, 0.010), gasket, { pos: [0, caseY0 + rim, fg - 0.014] }));
  for (const sx of [-1, 1]) frame.add(mesh(box(0.008, chh - rim * 2, 0.010), gasket, { pos: [sx * (cw / 2 - rim), (caseY0 + caseY1) / 2, fg - 0.014] }));
  // アクリル板（厚み 5mm・黄変と拭き傷）
  const gz = fg - 0.009;
  frame.add(mesh(box(cw - rim * 2 + 0.006, chh - rim * 2 + 0.006, 0.005), acrylic, { pos: [0, (caseY0 + caseY1) / 2, gz], cast: false, receive: false }));
  // 枠のネジ（上下左右に、幅に応じて）
  for (const [fx, ny] of [[-0.36, 1.435], [0.36, 1.435], [-0.36, 0.645], [0.36, 0.645], [-0.85, 1.04], [0.85, 1.04]]) {
    const fxp = fx * (cw / 1.70);
    frame.add(mesh(cyl(0.0058, 0.0058, 0.008, 6), MAT.stainless({ repeat: 8 }), { pos: [fxp, ny, fg + 0.006], rot: [Math.PI / 2, 0, 0] }));
    weather(frame, { w: 0.026, h: 0.030, pos: [fxp, ny - 0.020, fg + 0.0062], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 21 + Math.round(ny * 10 + fx), density: 0.8, spread: 0.003 });   // ネジ周囲の錆
  }

  /* ================= 上部：屋根（雨よけ）と「広報紙」表示 ================= */
  const roof = grp('roof');
  g.add(roof);
  roof.add(mesh(rbox(cw + 0.10, 0.016, caseD + 0.14, 0.005, 2), green, { pos: [0, caseY1 + 0.036, 0.020], rot: [-5 * D2R, 0, 0] }));
  roof.add(mesh(box(cw + 0.10, 0.024, 0.012), green, { pos: [0, caseY1 + 0.048, (caseD + 0.14) / 2 + 0.018], rot: [-5 * D2R, 0, 0] }));   // 水切り
  roof.add(mesh(box(cw + 0.06, 0.010, 0.014), aluDark, { pos: [0, caseY1 + 0.020, -caseD / 2 - 0.004] }));
  // 看板帯「広報紙」
  const header = grp('header');
  roof.add(header);
  header.add(mesh(rbox(0.60, 0.086, 0.020, 0.005, 2), paperWhite, { pos: [0, caseY1 + 0.108, 0.010] }));
  header.add(mesh(box(0.62, 0.010, 0.024), green, { pos: [0, caseY1 + 0.156, 0.010] }));
  decal(header, { map: TEX.signboard({ text: '広報紙', sub: '春風台自治会', bg: '#f6f2e6', fg: '#2f5a48' }), w: 0.56, h: 0.078, pos: [0, caseY1 + 0.108, 0.0208] });
  for (const sx of [-1, 1]) header.add(mesh(box(0.014, 0.060, 0.014), alu, { pos: [sx * 0.24, caseY1 + 0.062, 0.0], rot: [0, 0, sx * 6 * D2R] }));

  /* ================= 中の海报（重ね貼り・角の折れ・セロテープ） ================= */
  const posters = grp('posters');
  g.add(posters);
  const bz = -caseD / 2 + 0.026;                                // 掲示面の z
  const kx = cw / 1.70;                                         // 幅に合わせて水平方向を圧縮
  const ks = Math.max(0.74, Math.min(1, kx + 0.16));            // 用紙も少し小さく
  const narrow = cw < 1.30;                                     // 狭い掲示板では段を減らす
  const sheet = (x, y, w, h, map, tilt = -2, twist = 0, lay = 0) => {
    const p = grp('poster');
    p.position.set(x * kx, y, bz + lay * 0.005);
    p.rotation.set(tilt * D2R, twist * D2R, range(rnd, -1.2, 1.2) * D2R);
    posters.add(p);
    p.add(mesh(rbox(w * ks, h * ks, 0.0016, 0.0006, 2), MAT.poster({ map }), { pos: [0, -h * ks / 2, 0] }));
    // セロテープ（4 隅、残り糊・よれ）
    for (let k = 0; k < 4; k++) {
      const tx = (k % 2 ? 1 : -1) * (w * ks / 2 - 0.010), ty = -h * ks / 2 + (k < 2 ? h * ks - 0.008 : 0.008);
      p.add(mesh(rbox(0.030, 0.014, 0.0012, 0.0006, 1), MAT.hardPlastic('#efeada', { transparent: true, opacity: 0.62 }), {
        pos: [tx, ty, 0.0016], rot: [0, 0, range(rnd, -34, 34) * D2R],
      }));
    }
    return p;
  };
  const P = (title, sub, bg, accent, s) => TEX.poster({ title, sub, bg, accent, seed: seed + s });
  // 左列
  sheet(-0.6, caseY1 - 0.10, 0.30, 0.42, P('春の運動会', '4月12日 グランド集合', '#f6e9d2', '#d9534f', 1), -2.2, 1.5, 0);
  sheet(-0.6, caseY1 - 0.56, 0.26, 0.34, P('防災訓練', '消化器・水道点検', '#e7eef5', '#2b6fb5', 2), -1.2, -2, 1);
  if (!narrow) sheet(-0.62, caseY1 - 0.86, 0.22, 0.24, P('子どもらの会', '春の遠足', '#fdeaf1', '#e2685e', 3), -3.4, 2.5, 2);
  // 中央
  sheet(-0.1, caseY1 - 0.11, 0.34, 0.46, P('広報紙 4月号', '春の限定メニュー', '#eef2e4', '#3f7a52', 4), -1.6, 0.8, 1);
  sheet(-0.06, caseY1 - 0.62, 0.28, 0.38, P('健康相談', '血圧・栄養', '#f7ecd8', '#8d6fb0', 5), -2.8, -1.6, 2);
  sheet(0.04, caseY1 - 0.94, 0.20, 0.22, P('猫の譲渡会', '日曜 13時～', '#fff2d6', '#c5312c', 6), -4, 3.2, 3);
  // 右列
  sheet(0.50, caseY1 - 0.12, 0.30, 0.44, P('図書館だより', '春の新着書目', '#e9f0f4', '#2c6cb0', 7), -1, -1, 0);
  sheet(0.52, caseY1 - 0.60, 0.26, 0.36, P('ゴミ出し案内', '資源・可燃 週2回', '#f4f0e2', '#f0b23c', 8), -2, 2.2, 1);
  if (!narrow) sheet(0.46, caseY1 - 0.90, 0.24, 0.28, P('春の募集', '役員・清掃当番', '#f6dfe6', '#c2564a', 9), -3, -2.6, 2);
  // 古い剥がし残り（破れた下貼り）
  const rem = grp('leftover');
  posters.add(rem);
  rem.add(mesh(rbox(0.20 * ks, 0.13 * ks, 0.0014, 0.0006, 1), MAT.poster({ map: TEX.wear({ kind: 'chip', color: '#efe7d3', seed: seed + 31, density: 1.1 }), transparent: true, opacity: 0.9 }), { pos: [0.16 * kx, caseY0 + 0.19, bz + 0.001] }));
  rem.add(mesh(rbox(0.055, 0.036, 0.0014, 0.0006, 1), MAT.paper({ color: '#e8dfc6' }), { pos: [0.24 * kx, caseY0 + 0.25, bz + 0.002], rot: [0, 0, 14 * D2R] }));
  // 角の折れ（めくれた一角を別 Mesh で）
  const curl = grp('corner-curl');
  curl.position.set(-0.755 * kx, caseY1 - 0.52, bz + 0.011);
  curl.rotation.set(-18 * D2R, 6 * D2R, 40 * D2R);
  posters.add(curl);
  curl.add(mesh(rbox(0.048, 0.036, 0.0014, 0.0006, 1), MAT.paper({ color: '#f6efdc' }), { pos: [0, 0, 0] }));
  // 日付スタンプ風の紙片
  posters.add(mesh(rbox(0.086, 0.030, 0.0014, 0.0008, 1), MAT.paint(PAL.markingYellow, { sat: 0.72, tint: '#fdf3d8' }), { pos: [0.78 * kx, caseY0 + 0.24, bz + 0.008], rot: [0, 0, -6 * D2R] }));
  decal(posters, { map: TEX.signboard({ text: '4/12 掲示', bg: '#f0c353', fg: '#4a3a22' }), w: 0.080, h: 0.020, pos: [0.78 * kx, caseY0 + 0.24, bz + 0.0096], rot: [0, 0, -6 * D2R] });

  /* ================= 下部：チラシ投函口（アルミ箱＋スリット＋フラップ） ================= */
  const slot = grp('flyer-box');
  g.add(slot);
  const boxY = 0.30, boxZ = 0.0;
  const bw = 0.42, bh = 0.20, bd = 0.075;
  slot.add(mesh(box(bw, bh, bd), alu, { pos: [-0.02, boxY, boxZ] }));                                    // 箱（厚みあり）
  slot.add(mesh(box(bw - 0.03, bh - 0.05, 0.006), aluDark, { pos: [-0.02, boxY, bd / 2 + 0.004] }));      // 前面インサート
  // 投函スリット（上下プレートの隙間＝暗部）
  slot.add(mesh(box(bw - 0.06, 0.020, 0.010), MAT.paint('#1e2124', { steps: 2, shadowAmt: 1 }), { pos: [-0.02, boxY + 0.036, bd / 2 + 0.006] }));
  slot.add(mesh(box(bw - 0.05, 0.014, 0.012), alu, { pos: [-0.02, boxY + 0.052, bd / 2 + 0.008] }));      // 上唇
  slot.add(mesh(box(bw - 0.05, 0.012, 0.014), alu, { pos: [-0.02, boxY + 0.020, bd / 2 + 0.010] }));      // 下唇
  // アクリルのフラップ（少し開いている）
  const flap = grp('slot-flap', { pos: [-0.02, boxY + 0.052, bd / 2 + 0.012] });
  flap.rotation.x = 16 * D2R;
  slot.add(flap);
  flap.add(mesh(rbox(bw - 0.07, 0.060, 0.003, 0.0015, 2), acrylic, { pos: [0, -0.03, 0], cast: false }));
  // 中のチラシ（数束、口から覗く）
  for (const [fx, fw, fh] of [[-0.1, 0.115, 0.150], [0.03, 0.100, 0.140], [0.13, 0.090, 0.130]]) {
    slot.add(mesh(rbox(fw, fh, 0.020 + rnd() * 0.012, 0.003, 2), MAT.paper({ color: fx < 0 ? '#f7f2e4' : '#eef3ee' }), { pos: [fx - 0.02, boxY - 0.010, -8e-3], rot: [3 * D2R, 0, range(rnd, -3, 3) * D2R] }));
  }
  // 蓋（後ろへ開いた状態＝中身が見える）・錠前・ラベル
  slot.add(mesh(rbox(bw + 0.01, 0.010, bd * 0.55, 0.004, 2), alu, { pos: [-0.02, boxY + bh / 2 + 0.014, -0.0515], rot: [-32 * D2R, 0, 0] }));
  slot.add(mesh(box(0.030, 0.020, 0.012), aluDark, { pos: [0.16, boxY - 0.070, bd / 2 + 0.006] }));
  slot.add(mesh(tor(0.0075, 0.0025, 5, 12), MAT.metal('#8f9497', { worn: 0.8 }), { pos: [0.16, boxY - 0.086, bd / 2 + 0.008] }));
  slot.add(mesh(rbox(0.30, 0.026, 0.004, 0.0015, 2), MAT.paint(PAL.marking, { steps: 2, sat: 0.9, tint: '#f6f0e0' }), { pos: [-0.04, boxY - 0.038, bd / 2 + 0.008] }));
  decal(slot, { map: TEX.signboard({ text: 'ご自由にお取りください', bg: '#f6f2e6', fg: '#3f5a48' }), w: 0.29, h: 0.022, pos: [-0.04, boxY - 0.038, bd / 2 + 0.0108] });
  // 支持金物（箱体と支柱を結ぶ）
  for (const sx of [-1, 1]) slot.add(mesh(box(0.050, 0.014, 0.13), aluDark, { pos: [sx * (bw / 2 + 0.030), boxY, -0.02] }));
  weather(slot, { w: 0.18, h: 0.06, pos: [-0.06, boxY - 0.078, bd / 2 + 0.012], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 41, density: 1.6, spread: 0.005 });   // 投函口の錆（経年）
  weather(slot, { w: 0.12, h: 0.08, pos: [0.10, boxY + 0.060, bd / 2 + 0.013], kind: 'dirt', color: '#8a8272', opacity: 0.45, seed: seed + 42, spread: 0.005 });

  /* ================= アクリル面の経年（黄変・拭き傷・雨だれ） ================= */
  decal(frame, { map: TEX.gradient({ stops: [[0, 'rgba(255,238,196,1)'], [0.55, 'rgba(255,242,214,0.35)'], [1, 'rgba(255,255,255,0)']] }), w: cw - rim * 2, h: chh * 0.55, pos: [0, caseY1 - chh * 0.30, gz + 0.004], opacity: 0.30 });   // 黄変
  weather(frame, { w: cw * 0.5, h: 0.30, pos: [-0.2, 1.06, gz + 0.0045], kind: 'scratch', color: '#ffffff', opacity: 0.20, seed: seed + 46, density: 1.6, spread: 0.006 });   // 拭き傷
  weather(frame, { w: 0.24, h: 0.18, pos: [0.40, 0.86, gz + 0.0045], kind: 'scratch', color: '#f2f6f2', opacity: 0.18, seed: seed + 47, density: 1.2, spread: 0.005 });
  for (let i = 0; i < 7; i++) {   // 屋根からの雨だれ（枠面いっぱい）
    const dx = -cw / 2 + 0.10 + (i / 6) * (cw - 0.20) + range(rnd, -0.02, 0.02);
    weather(frame, { w: 0.020, h: 0.24, pos: [dx, 0.72, fg + 0.0065], kind: 'rust', color: '#8b8578', opacity: 0.35, seed: seed + 51 + i, density: 0.6, spread: 0.004 });
  }
  // 枠・箱全体の錆と掉漆
  weather(body, { w: 0.30, h: 0.10, pos: [-0.3, caseY0 + 0.06, fg + 0.002], kind: 'chip', color: '#cfc9b8', opacity: 0.5, seed: seed + 61, density: 1.6, spread: 0.005 });
  weather(body, { w: 0.24, h: 0.16, pos: [0.44, 1.00, -0.052000000000000005], rot: [0, Math.PI, 0], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 62, density: 1.5, spread: 0.006 });
  weather(roof, { w: 0.34, h: 0.08, pos: [0.10, caseY1 + 0.046, 0.06], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7d7a6a', opacity: 0.45, seed: seed + 63, density: 1.5, spread: 0.005 });   // 屋根の汚れ
  weather(roof, { w: 0.12, h: 0.06, pos: [-0.3, caseY1 + 0.045, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.42, seed: seed + 64, spread: 0.004 });

  /* ================= 足元の接地 ================= */
  shadowBlob(g, { r: 0.20, pos: [-postX, 0.003, 0], opacity: 0.3, ratio: 1 });
  shadowBlob(g, { r: 0.20, pos: [postX, 0.003, 0], opacity: 0.3, ratio: 1 });
  shadowBlob(g, { r: 0.52, pos: [-0.02, 0.0035, 0.02], opacity: 0.20, ratio: 0.20 });

  return finish(g, { outline: 'normal' });
}

export { build, build as default, meta };
