import { g as grp, M as MAT, P as PAL, s as shade, m as mesh, b as box, c as cyl, w as weather, k as tubeOf, r as rbox, n as range, am as hoop, o as lathe, h as decal, T as TEX, q as finish, N as makeCanvas, O as jpText, Q as toTexture, z as rand } from './index-DD_JJZx9.js';

//  assets/station/ticket-machine.js —— 簡易券売機 + 乗車整理券箱（硬貨受け・表示・ボタン・屋根）
//  原点 = 床面（ホーム top y=+0.72 の上）接触中心 / +Y 上 / 操作面を +Z とする。
//  装配例：ホーム西端 (−15.2, −10.2) rotY=180、または駅舎側 (0.4, −9.9)。
//  build({ seed, withTicketBox = true })

const meta = {
  id: 'ticket-machine',
  real: [1.30, 1.95, 0.60],
  origin: 'deck-center',
};
const DEFAULT_OPTIONS = { seed: 5505, withTicketBox: true };

const D2R = Math.PI / 180;

/** 券売機の操作面板（運賃表・路線図・硬貨投入口回り） */
function panelTex() {
  const cv = makeCanvas(512, 512);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#dcdad2'; g.fillRect(0, 0, w, h);
  // 上部：路線図（架空）
  g.fillStyle = '#f2efe2'; g.fillRect(w * 0.06, h * 0.05, w * 0.88, h * 0.2);
  g.strokeStyle = PAL.trainStripe; g.lineWidth = 8;
  g.beginPath(); g.moveTo(w * 0.12, h * 0.17); g.lineTo(w * 0.88, h * 0.17); g.stroke();
  for (let i = 0; i < 5; i++) {
    const x = w * (0.14 + i * 0.18);
    g.fillStyle = '#f6f4ea'; g.beginPath(); g.arc(x, h * 0.17, 7, 0, 7); g.fill(); g.stroke();
    jpText(g, ['富士見', '桜ヶ丘', '河合原', '松崎', '梅ノ木'][i], { x, y: h * 0.235, size: h * 0.038, color: '#4a5560', weight: 700 });
  }
  jpText(g, 'きっぷうりば', { x: w * 0.5, y: h * 0.09, size: h * 0.05, color: '#3d4a52', weight: 800, spacing: 6 });
  // 運賃表
  g.fillStyle = '#efe9d6'; g.fillRect(w * 0.06, h * 0.28, w * 0.5, h * 0.18);
  g.strokeStyle = 'rgba(70,66,54,0.35)'; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const y = h * (0.3 + i * 0.05); g.beginPath(); g.moveTo(w * 0.08, y); g.lineTo(w * 0.54, y); g.stroke(); }
  jpText(g, '大人 170  小人 90', { x: w * 0.31, y: h * 0.41, size: h * 0.04, color: '#4b4640', weight: 700 });
  // タイムカード欄
  g.fillStyle = '#f7f3e4'; g.fillRect(w * 0.6, h * 0.28, w * 0.34, h * 0.18);
  jpText(g, '乗車整理券', { x: w * 0.77, y: h * 0.33, size: h * 0.042, color: '#8a5b3a', weight: 800 });
  jpText(g, '1 円', { x: w * 0.77, y: h * 0.41, size: h * 0.05, color: '#3f4a52', weight: 800 });
  // 下部：注意点書き
  g.fillStyle = 'rgba(140,130,110,0.18)'; g.fillRect(w * 0.06, h * 0.9, w * 0.88, h * 0.06);
  jpText(g, '硬貨はゆっくり投入  /  両替は駅員さんへ', { x: w * 0.5, y: h * 0.93, size: h * 0.032, color: '#6b6458', weight: 600 });
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.02 + rnd() * 0.07;
    g.fillStyle = rnd() > 0.5 ? '#fff' : '#5e584a';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  return toTexture(cv, { repeat: 1 });
}
/** 小さな液晶表示（発券金額・案内） */
function screenTex(txt) {
  const cv = makeCanvas(512, 192);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#0e1416'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(255,255,255,0.02)'; g.fillRect(0, y, w, 2); }
  jpText(g, txt, { x: w * 0.5, y: h * 0.42, size: h * 0.34, color: '#8ff0c8', weight: 800, spacing: 6 });
  jpText(g, '硬貨を いれて ください', { x: w * 0.5, y: h * 0.78, size: h * 0.15, color: '#69c9a2', weight: 600, spacing: 2 });
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const seed = options.seed ?? 5505;
  const withBox = options.withTicketBox !== false;
  const rnd = rand(seed);
  const g = grp('ticket-machine');

  const BW = 0.76, BH = 1.36, BD = 0.46;          // 本体
  const LEG = 0.3;                                 // 脚高（床下の配線空間）

  const mShell = MAT.metalPaint('#d9d5c8', { worn: 1.15, base: '#e6e2d5', uv: { repeat: [0.4, 0.4] } });
  const mTrim = MAT.metalPaint(PAL.signBlue, { worn: 1.2, base: shade(PAL.signBlue, 1.25), uv: { repeat: [0.5, 1.2] } });
  const mPanel = MAT.hardPlastic('#cfd0ca', { repeat: 4, map: panelTex(), uv: { repeat: [1, 1] } });
  const mDark = MAT.darkIron({ worn: 1.2, uv: { repeat: [0.5, 0.5] } });
  const mSteel = MAT.metal('#a6a8a4', { worn: 0.9, uv: { repeat: [0.5, 0.5] } });
  const mChrome = MAT.chrome({});
  const mRubber = MAT.rubber('#2f3234', { steps: 2 });
  const mPaper = MAT.paper({ color: '#f4eeda' });

  /* ══════════════════════════════════════════ 脚・基礎（床面のアンカー） */
  const legG = grp('legs');
  g.add(legG);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (BW / 2 - 0.08), z = sz * (BD / 2 - 0.07);
    legG.add(mesh(box(0.07, LEG, 0.07), mDark, { pos: [x, LEG / 2, z], name: 'leg' }));
    legG.add(mesh(cyl(0.026, 0.03, 0.024, 8), mSteel, { pos: [x, 0.012, z], cast: false }));
    legG.add(mesh(cyl(0.012, 0.013, 0.05, 6), mSteel, { pos: [x, 0.04, z], cast: false }));
    weather(legG, { w: 0.07, h: 0.14, pos: [x + 0.036, 0.11, z], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + Math.round(x * 100 + z * 13), density: 1.5, spread: 0.02 });
  }
  legG.add(mesh(box(BW - 0.06, 0.03, BD - 0.05), mDark, { pos: [0, LEG - 0.015, 0], name: 'under-plate' }));
  // 配線（床の穴へ）
  legG.add(mesh(tubeOf([[BW / 2 - 0.14, LEG - 0.04, -0.02], [BW / 2 - 0.2, 0.12, 0.04], [BW / 2 - 0.24, 0.02, 0.09]], 0.017, 10, 6), mRubber));

  /* ══════════════════════════════════════════ 本体 */
  const body = grp('body', { pos: [0, LEG, 0] });
  g.add(body);
  body.add(mesh(box(BW, BH, BD), mShell, { pos: [0, BH / 2, 0], name: 'main-shell' }));
  // 前面のパネル（操作面・5 mm 張り出し）
  const faceZ = BD / 2 + 0.004;
  body.add(mesh(box(BW - 0.04, 0.86, 0.012), mPanel, { pos: [0, BH - 0.52, faceZ], name: 'operate-panel' }));
  // 表示器（液晶）
  {
    const sc = grp('screen', { pos: [-BW * 0.22, BH - 0.22, faceZ + 0.008] });
    sc.add(mesh(rbox(0.26, 0.13, 0.016, 0.006, 2), mDark, { name: 'screen-bezel' }));
    sc.add(mesh(box(0.23, 0.1, 0.006), MAT.screen({ map: screenTex('170 円'), color: '#dff6ea' }), { pos: [0, 0, 0.011], name: 'screen-face', cast: false }));
    body.add(sc);
  }
  // ボタン（数字・金額・硬質プラスチック、指紋の磨耗）
  {
    const bs = grp('buttons', { pos: [BW * 0.06, BH - 0.44, faceZ + 0.012] });
    for (let i = 0; i < 12; i++) {
      const cx = (i % 4) * 0.062 - 0.093, cy = -Math.floor(i / 4) * 0.056;
      bs.add(mesh(cyl(0.021, 0.023, 0.014, 12), i > 8 ? MAT.hardPlastic('#c8c3b2', { repeat: 5 }) : MAT.hardPlastic('#efece0', { repeat: 5 }), {
        pos: [cx, cy, 0], rot: [90 * D2R - range(rnd, 0, 0.05), 0, 0], name: `button-${i}`, cast: false,
      }));
      bs.add(mesh(cyl(0.024, 0.024, 0.004, 12), mDark, { pos: [cx, cy, -6e-3], rot: [90 * D2R, 0, 0], cast: false }));
    }
    // 確認ランプ
    bs.add(mesh(box(0.02, 0.008, 0.006), MAT.lampShade({ color: '#e9c66f', emissive: '#f2b23c', emissiveIntensity: 0.6 }), { pos: [0.1, 0.04, 0.002], cast: false }));
    body.add(bs);
  }
  // 紙幣投入口・硬貨投入口・釣銭受け・切符出口
  {
    const slots = grp('slots');
    body.add(slots);
    const bill = grp('bill-slot', { pos: [-BW * 0.24, BH - 0.44, faceZ + 0.01] });
    bill.add(mesh(rbox(0.2, 0.05, 0.018, 0.005, 2), mSteel, { name: 'bill-plate' }));
    bill.add(mesh(box(0.16, 0.014, 0.02), MAT.paint('#1c1f20', { steps: 2, shadowAmt: 1 }), { pos: [0, 0.004, 0], cast: false }));
    bill.add(mesh(box(0.17, 0.006, 0.024), mChrome, { pos: [0, 0.021, 0.002], cast: false }));
    slots.add(bill);
    // 硬貨投入口（スリット + ゴム）
    const coin = grp('coin-slot', { pos: [BW * 0.3, BH - 0.3, faceZ + 0.01] });
    coin.add(mesh(rbox(0.06, 0.09, 0.016, 0.005, 2), mSteel, {}));
    coin.add(mesh(box(0.012, 0.055, 0.02), MAT.paint('#1c1f20', { steps: 2, shadowAmt: 1 }), { pos: [0, 0.006, 0], cast: false }));
    coin.add(hoop(0.014, 0.004, mRubber, { pos: [0, 0.006, 0.01], rot: [0, 0, 0], cast: false }));
    slots.add(coin);
    // 釣銭受け（カップ受け・中に 10 円が 2 枚）
    const cup = grp('coin-cup', { pos: [BW * 0.26, BH - 0.62, faceZ + 0.03] });
    cup.add(mesh(lathe([[0, 0], [0.062, 0.004], [0.07, 0.03], [0.066, 0.036], [0.056, 0.03], [0.05, 0.006], [0, 0.004]], 18), mSteel, { name: 'cup' }));
    for (let i = 0; i < 2; i++) {
      cup.add(mesh(cyl(0.011, 0.011, 0.0017, 12), MAT.metal('#c9a45c', { worn: 0.6, dir: 'h' }), { pos: [i ? 0.012 : -0.01, 0.008 + i * 0.002, i ? -8e-3 : 0.006], rot: [range(rnd, -0.1, 0.1), 0, range(rnd, -0.2, 0.2)] }));
    }
    cup.add(mesh(box(0.14, 0.008, 0.02), mDark, { pos: [0, -6e-3, -0.05], cast: false }));
    slots.add(cup);
    // 券出口（カバー付き）
    const out = grp('ticket-out', { pos: [-BW * 0.2, BH - 0.66, faceZ + 0.012] });
    out.add(mesh(rbox(0.2, 0.06, 0.02, 0.006, 2), mDark, {}));
    out.add(mesh(box(0.17, 0.01, 0.024), MAT.paint('#15181a', { steps: 2, shadowAmt: 1 }), { pos: [0, -6e-3, 0.004], cast: false }));
    const flap = mesh(box(0.17, 0.02, 0.006), mRubber, { pos: [0, 0.012, 0.012], rot: [22 * D2R, 0, 0], name: 'flap', cast: false });
    out.add(flap);
    slots.add(out);
  }
  // 上部の行先運賃表示灯箱 + 屋根
  {
    const top = grp('top', { pos: [0, BH + 0.13, 0] });
    top.add(mesh(rbox(BW - 0.02, 0.26, BD - 0.04, 0.014, 2), mTrim, { name: 'header' }));
    decal(top, { map: TEX.signboard({ text: 'きっぷうりば', sub: 'TICKETS  6:40 - 19:05', bg: PAL.signBlue, fg: '#f6f4e8' }), w: BW - 0.14, h: 0.2, pos: [0, 0, BD / 2 - 0.013], order: 1 });
    decal(top, { map: TEX.signboard({ text: 'きっぷうりば', sub: 'TICKETS', bg: PAL.signBlue, fg: '#e4e9ee' }), w: BW - 0.14, h: 0.2, pos: [0, 0, -0.217], rot: [0, Math.PI, 0], order: 1 });
    top.add(mesh(box(BW + 0.08, 0.022, BD + 0.12), mSteel, { pos: [0, 0.148, 0.02], name: 'rain-hood' }));
    top.add(mesh(box(BW + 0.08, 0.03, 0.02), mSteel, { pos: [0, 0.13, BD / 2 + 0.06] }));
    body.add(top);
  }
  // 側板リブ・ネジ・下枠の帯
  for (const sx of [-1, 1]) {
    body.add(mesh(box(0.012, BH - 0.1, 0.012), mSteel, { pos: [sx * (BW / 2 + 0.002), BH * 0.5, BD / 2 - 0.09], cast: false }));
    for (let i = 0; i < 4; i++) body.add(mesh(cyl(0.006, 0.006, 0.008, 6), mDark, { pos: [sx * (BW / 2 + 0.003), 0.2 + i * 0.34, 0.1], rot: [0, 90 * D2R, 0], cast: false }));
  }
  body.add(mesh(box(BW - 0.02, 0.05, 0.014), mTrim, { pos: [0, 0.12, faceZ], cast: false }));

  /* ══════════════════════════════════════════ 乗車整理券箱（隣に据え置き） */
  if (withBox) {
    const tb = grp('ticket-box', { pos: [BW / 2 + 0.24, LEG, 0.02] });
    g.add(tb);
    // 支柱
    for (const sx of [-1, 1]) {
      tb.add(mesh(box(0.05, 1.02, 0.05), mDark, { pos: [sx * 0.14, 0.51, -0.09], name: 'box-post' }));
      tb.add(mesh(cyl(0.02, 0.022, 0.02, 8), mSteel, { pos: [sx * 0.14, 0.01, -0.09] }));
    }
    const kbx = grp('box', { pos: [0, 1.14, 0] });
    kbx.add(mesh(rbox(0.36, 0.3, 0.24, 0.014, 2), MAT.metalPaint('#e6e2d2', { worn: 1.3, base: '#efe9d8', uv: { repeat: [0.5, 0.5] } }), { name: 'ticket-case' }));
    kbx.add(mesh(box(0.4, 0.02, 0.28), MAT.galvanized({ uv: { repeat: [0.5, 0.5] } }), { pos: [0, 0.16, 0], name: 'case-lid' }));
    // 前面窓（中の整理券が見える）
    kbx.add(mesh(rbox(0.24, 0.15, 0.012, 0.006, 2), mDark, { pos: [0, 0.02, 0.121] }));
    kbx.add(mesh(box(0.21, 0.12, 0.008), MAT.glassLite({ color: '#dde9ea', opacity: 0.3 }), { pos: [0, 0.02, 0.128], cast: false }));
    // 中に積んだ整理券（1 円硬貨で受け取る紙券）
    for (let i = 0; i < 7; i++) {
      kbx.add(mesh(box(0.19, 0.006, 0.1), mPaper, { pos: [range(rnd, -0.01, 0.01), -0.04 + i * 0.007, range(rnd, -5e-3, 0.005)], rot: [0, range(rnd, -0.03, 0.03), range(rnd, -0.02, 0.02)], cast: false }));
    }
    // 取出ノブ・ばね口
    kbx.add(mesh(cyl(0.028, 0.03, 0.045, 12), MAT.hardPlastic('#3f4a52', { repeat: 5 }), { pos: [0, -0.09, 0.135], rot: [0, 0, 90 * D2R] }));
    kbx.add(mesh(box(0.22, 0.012, 0.02), mSteel, { pos: [0, -0.055, 0.125], cast: false }));
    decal(kbx, { map: TEX.signboard({ text: '乗車整理券', sub: '1円 を お入れください', bg: '#e9e3cf', fg: '#5b4a32' }), w: 0.3, h: 0.09, pos: [0, 0.1, 0.128], order: 2 });
    // 硬貨投入口（箱の天）
    kbx.add(mesh(box(0.05, 0.014, 0.014), mDark, { pos: [0.1, 0.166, 0.04], cast: false }));
    kbx.add(mesh(cyl(0.02, 0.022, 0.03, 10), mSteel, { pos: [-0.1, 0.175, 0] }));
    tb.add(kbx);
    weather(tb, { w: 0.3, h: 0.2, pos: [0, 1.02, 0.14], kind: 'dirt', color: '#8d8571', opacity: 0.4, seed: seed + 71, density: 1.4, spread: 0.03 });
    weather(tb, { w: 0.1, h: 0.5, pos: [0.15, 0.3, 0.03], kind: 'rust', color: PAL.rust, opacity: 0.5, seed: seed + 72, density: 1.6, spread: 0.05 });
  }

  /* ══════════════════════════════════════════ 経年：錆・いたずら書き除去・日晒み */
  weather(body, { w: BW * 0.8, h: 0.28, pos: [0, 0.3, faceZ + 0.012], kind: 'chip', color: '#f2eee0', opacity: 0.5, seed: seed + 81, density: 1.6, spread: 0.03 });
  weather(body, { w: 0.24, h: 0.6, pos: [-BW / 2 + 0.06, 0.5, faceZ + 0.013], kind: 'dirt', color: '#6d6553', opacity: 0.4, seed: seed + 82, density: 1.5, spread: 0.04 });
  weather(body, { w: 0.3, h: 0.18, pos: [BW * 0.3, BH - 0.8, faceZ + 0.012], kind: 'scratch', color: '#b9b3a2', opacity: 0.35, seed: seed + 83, density: 1.2, spread: 0.02 });
  // 落書きを消した残り（マジックインの輪郭）
  decal(body, { map: TEX.wear({ kind: 'scratch', color: '#5d5a52', seed: seed + 84, density: 0.8 }), w: 0.3, h: 0.16, pos: [-BW * 0.22, 0.44, faceZ + 0.013], opacity: 0.4, order: 1 });
  decal(body, { map: TEX.wear({ kind: 'scratch', color: '#efeade', seed: seed + 85, density: 0.7 }), w: 0.34, h: 0.2, pos: [-BW * 0.22, 0.46, faceZ + 0.014], opacity: 0.5, order: 2 });
  // 貼紙（他の駅のものを剥がした跡）
  decal(body, { map: TEX.wear({ kind: 'chip', color: '#efe6cc', seed: seed + 86, density: 0.6 }), w: 0.12, h: 0.16, pos: [BW / 2 - 0.05, BH - 0.9, faceZ + 0.013], opacity: 0.65, order: 3 });
  // 天板の雨だれ
  weather(body, { w: BW * 0.7, h: 0.22, pos: [0, BH + 0.01, BD / 2 - 0.02], kind: 'rust', color: '#8a5f3c', opacity: 0.35, seed: seed + 87, density: 1.5, spread: 0.03 });

  return finish(g, { outline: 'normal', minSize: 0.04 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
