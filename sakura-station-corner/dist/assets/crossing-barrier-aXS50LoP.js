import { g as grp, M as MAT, T as TEX, P as PAL, m as mesh, c as cyl, r as rbox, b as box, w as weather, W as pipe, am as hoop, a as sph, h as decal, ae as SphereGeometry, ag as CylinderGeometry, ak as RingGeometry, o as lathe, D as DoubleSide, n as range, q as finish, z as rand } from './index-CSUFndW_.js';

//  assets/station/crossing-barrier.js —— 踏切遮断機 / 警報機 / 非常ボタン
//  ---------------------------------------------------------------------------
//  ・原点 = 地面 y=0 の据付点中心。+Y 上。**正面（見られる面・表示面）= +Z**。
//    腕木は side で ±X に伸びる：'left' → +X（踏切の内側へ）、'right' → -X。
//    装配：barrier (3.26,-12.4)left / (9.54,-12.4)right、warning (3.26,-16.9)、emergency (9.54,-16.9)、rotY=0。
//  ・world/level-crossing.js が既に打っている遮断台基礎（天端 y≈0.1、アンカーボルト 4 本は
//    半径 0.13 に角度 (i/4)2π+0.4、芯スリーブ r0.075・y0.095〜0.145）と干渉しないよう、
//    本資産の固体は **y=0.19 以上** から起こす（下はモルタル筒 r≤0.088 でつなぐ）。
//  ・腕木は「降りた位置」（静止状態）で置く。左右の先端は踏切中央で 0.2m 空け、交差させない。
//  ---------------------------------------------------------------------------

const meta = {
  id: 'crossing-barrier',
  real: [3.36, 1.62, 0.42],       // kind='barrier' 時の最大寸法（警報機は [0.46,1.72,0.36]、非常ボタン [0.4,1.42,0.34]）
  origin: 'ground-center, front face = +Z, arm along ±X by side',
};
const DEFAULT_OPTIONS = { kind: 'barrier', side: 'left', seed: 623 };

const D2R = Math.PI / 180;
const BASE_TOP = 0.216;            // フランジ天端（据付ボルト 0.175 より上）
const ARM_Y = 1.02;                // 降りた腕木の芯高
const ARM_REACH = 3.02;            // 支柱芯から先端まで（左右交差しない長さに制限）

/** 共通：基礎フランジ・モルタル・ナット（world のアンカーと干渉しない高さ） */
function base(g, mat, rnd, seed, r = 0.155) {
  g.add(mesh(cyl(0.088, 0.096, 0.042, 14), mat.concGrout, { pos: [0, 0.169, 0], name: 'grout' }));
  const fl = mesh(cyl(r, r - 0.006, 0.026, 20), mat.steel, { pos: [0, 0.203, 0], name: 'base-flange' });
  g.add(fl);
  g.add(mesh(cyl(r + 0.012, r + 0.012, 0.008, 20), mat.steel, { pos: [0, 0.222, 0] }));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;      // world と同じ角度＝据付ボルトの位置
    g.add(mesh(cyl(0.019, 0.019, 0.02, 6), mat.bolt, { pos: [Math.cos(a) * 0.13, BASE_TOP + 0.01, Math.sin(a) * 0.13] }));
    g.add(mesh(cyl(0.026, 0.026, 0.006, 6), mat.bolt, { pos: [Math.cos(a) * 0.13, BASE_TOP + 0.022, Math.sin(a) * 0.13] }));
    weather(g, { w: 0.04, h: 0.09, pos: [Math.cos(a) * 0.145, 0.18, Math.sin(a) * 0.145], rot: [0, -a, 0], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + i * 7, count: 1, spread: 0.02 });
  }
  weather(g, { w: 0.3, h: 0.06, pos: [0, 0.226, r - 0.03], kind: 'dirt', color: '#6d6759', opacity: 0.4, seed: seed + 3, count: 2, spread: 0.12 });
}

function build(options = {}) {
  const kind = options.kind ?? 'barrier';
  const side = options.side ?? 'left';
  const seed = options.seed ?? 623;
  const rnd = rand(seed);
  const g = grp('crossing-barrier-' + kind);
  const dir = side === 'left' ? 1 : -1;

  /* ───────── 材質（塗装鉄・亜鉛・反射シート・磁器・ゴム） ───────── */
  const body = MAT.metalPaint('#c9564c' , { worn: 0.85, repeat: 3, base: '#e08d80' });
  const mat = {
    body,
    steel: MAT.metalPaint('#5c6360', { worn: 0.9, repeat: 3, base: '#7d8481' }),
    zinc: MAT.galvanized({ spec: 0.3, worn: 0.85 }),
    bolt: MAT.metal('#9aa0a3', { worn: 0.85 }),
    concGrout: MAT.concrete({ base: '#c2bcb0', repeat: 1 }),
    white: MAT.paint(PAL.paint, { map: TEX.metal({ base: PAL.paint, worn: 0.4, repeat: 3 }).map, spec: 0.5, specPower: 110, steps: 2 }),
    red: MAT.paint('#c5312c', { map: TEX.metal({ base: '#c5312c', worn: 0.5, repeat: 3 }).map, spec: 0.46, specPower: 100, steps: 2 }),
    rubber: MAT.rubber('#2f3238', { spec: 0.08 }),
    yellow: MAT.metalPaint('#e0b93c', { worn: 0.7, base: '#f0cd62' }),
    porcelain: MAT.paint('#efe9dc', { spec: 0.55, specPower: 140, sheen: 0.12, steps: 2 }),
  };

  base(g, mat, rnd, seed);

  /* ════════════════════ 遮断機 ════════════════════ */
  if (kind === 'barrier') {
    /* 支柱 */
    const postH = 1.0;
    g.add(mesh(cyl(0.062, 0.075, postH - BASE_TOP, 14), mat.steel, { pos: [0, (postH + BASE_TOP) / 2, 0], name: 'column' }));
    g.add(mesh(cyl(0.075, 0.082, 0.05, 14), mat.steel, { pos: [0, BASE_TOP + 0.026, 0] }));
    // 点検口（蓋・ネジ・丁番）
    {
      const hatch = grp('hatch', { pos: [0, 0.52, 0.062], rot: [0, 0, 0] });
      hatch.add(mesh(rbox(0.13, 0.22, 0.016, 0.008, 2), mat.body, { name: 'hatch-door' }));
      hatch.add(mesh(rbox(0.1, 0.19, 0.006, 0.006, 2), mat.steel, { pos: [0, 0, 0.011] }));
      for (const [hx, hy] of [[-0.045, 0.088], [0.045, -0.088]]) hatch.add(mesh(cyl(0.007, 0.007, 0.01, 6), mat.bolt, { pos: [hx, hy, 0.014], rot: [90 * D2R, 0, 0] }));
      for (const hy of [-0.06, 0.06]) hatch.add(mesh(box(0.02, 0.024, 0.014), mat.zinc, { pos: [-0.068, hy, 0.004] }));
      hatch.add(mesh(box(0.09, 0.16, 0.02), MAT.paint('#2c3134', { steps: 2, spec: 0.1, shadowAmt: 1 }), { pos: [0, 0, -0.01] }));  // 内部
      hatch.add(mesh(cyl(0.004, 0.004, 0.09, 6), MAT.rubber('#c8a24a'), { pos: [0.02, 0.03, -0.012], rot: [0, 0, 0.3] }));
      g.add(hatch);
    }
    // 柱の経年：錆・泥・打痕・再塗装
    weather(g, { w: 0.1, h: 0.4, pos: [0.07, 0.62, 0.02], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 11, density: 1.7, count: 3, spread: 0.12 });
    weather(g, { w: 0.09, h: 0.2, pos: [-0.065, 0.3, 0.02], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#cfd3cc', opacity: 0.45, seed: seed + 12, count: 3, density: 1.4 });
    g.add(mesh(rbox(0.06, 0.09, 0.02, 0.008, 2), mat.zinc, { pos: [0.03, 0.74, 0.058], rot: [0, 0.2, 0.05] }));  // 補修プレートの当て板

    /* モーター箱（支柱の裏側＝線上側とは反対） */
    {
      const mo = grp('motor', { pos: [-dir * 0.02, 0.66, -0.16] });
      mo.add(mesh(rbox(0.26, 0.32, 0.2, 0.012, 2), mat.body, { name: 'motor-case' }));
      for (let f = 0; f < 5; f++) mo.add(mesh(box(0.2, 0.012, 0.022), mat.steel, { pos: [0, 0.11 - f * 0.055, -0.104], cast: false }));
      mo.add(mesh(cyl(0.05, 0.05, 0.024, 14), mat.steel, { pos: [0.05, -0.02, -0.106], rot: [90 * D2R, 0, 0] }));   // ギアカバー
      mo.add(mesh(rbox(0.09, 0.07, 0.008, 0.006, 2), mat.zinc, { pos: [-0.06, 0.09, -0.104] }));                     // 銘板
      mo.add(mesh(cyl(0.006, 0.006, 0.02, 6), mat.bolt, { pos: [-0.06, 0.115, -0.11], rot: [90 * D2R, 0, 0] }));
      for (const bx of [-0.1, 0.1]) mo.add(mesh(cyl(0.008, 0.008, 0.03, 6), mat.bolt, { pos: [bx, 0.16, -0.06] }));
      g.add(mo);
      // 配管（モーターから基礎へ）
      g.add(pipe([[-dir * 0.02, 0.5, -0.26], [-dir * 0.06, 0.36, -0.29], [-dir * 0.09, 0.26, -0.22], [-dir * 0.1, 0.222, -0.12]], 0.019, mat.zinc, { seg: 22, radial: 7, name: 'conduit' }));
      weather(g, { w: 0.14, h: 0.26, pos: [-dir * 0.02, 0.56, -0.27], kind: 'rust', color: PAL.rust, opacity: 0.45, seed: seed + 13, count: 2, density: 1.5 });
    }

    /* 軸受＋_counterweight_（支柱頭） */
    {
      const hb = grp('bearing', { pos: [dir * 0.14, ARM_Y, 0] });
      hb.add(mesh(rbox(0.28, 0.24, 0.24, 0.014, 2), mat.steel, { name: 'bearing-box' }));
      hb.add(mesh(cyl(0.062, 0.062, 0.27, 14), mat.steel, { pos: [-dir * 0.02, 0, 0], rot: [90 * D2R, 0, 0] }));      // 軸受リング
      hb.add(hoop(0.068, 0.008, mat.zinc, { pos: [-dir * 0.02, 0, 0.1], rot: [90 * D2R, 0, 0] }));
      for (const [bx, by] of [[-0.1, 0.09], [0.1, 0.09], [-0.1, -0.09], [0.1, -0.09]]) {
        hb.add(mesh(cyl(0.009, 0.009, 0.016, 6), mat.bolt, { pos: [bx, by, 0.121], rot: [90 * D2R, 0, 0] }));
      }
      hb.add(mesh(rbox(0.16, 0.1, 0.2, 0.008, 2), mat.body, { pos: [-dir * 0.1, 0.14, 0] }));                          // 上蓋
      g.add(hb);
      // カウンター錘（腕木の反対側、下にぶら下がる鋳塊）
      const cw = grp('counterweight', { pos: [-dir * 0.52, ARM_Y - 0.1, 0] });
      cw.add(mesh(box(0.03, 0.16, 0.03), mat.steel, { pos: [0, 0.06, 0] }));
      for (let wI = 0; wI < 3; wI++) cw.add(mesh(rbox(0.19, 0.052, 0.15, 0.008, 2), MAT.metal('#4c5155', { worn: 0.8, spec: 0.3 }), { pos: [0, -0.04 - wI * 0.058, 0] }));
      cw.add(mesh(cyl(0.012, 0.012, 0.3, 8), mat.steel, { pos: [0, 0.02, 0] }));
      cw.add(mesh(rbox(0.22, 0.03, 0.18, 0.008, 2), mat.steel, { pos: [0, -0.22, 0] }));
      g.add(cw);
      weather(g, { w: 0.14, h: 0.1, pos: [-dir * 0.52, ARM_Y - 0.2, 0.075], kind: 'rust', color: '#7d4a2c', opacity: 0.55, seed: seed + 14, count: 3, density: 1.7, spread: 0.06 });
    }

    /* 腕木（降りた位置・白赤反射帯・先端灯り・LED・ゴムキャップ・曲がり・錆） */
    {
      const arm = grp('arm', { pos: [0, ARM_Y, 0] });
      const segA = 1.72, sag = 1.6 * D2R;                              // 先端側の緩い下垂（曲がり）
      arm.add(mesh(cyl(0.049, 0.049, segA - 0.05, 8), mat.white, { pos: [dir * (0.14 + (segA - 0.05) / 2), 0, 0], rot: [0, 0, 90 * D2R] }));
      const rest = ARM_REACH - segA;
      const tip = mesh(cyl(0.047, 0.045, rest, 8), mat.white, { pos: [dir * (segA + rest / 2), -Math.sin(sag) * rest / 2, 0], rot: [0, 0, 90 * D2R + dir * sag] });
      arm.add(tip);
      for (let s = 0; s < 7; s++) {
        const w = 0.28;
        const x0 = 0.2 + s * (w + 0.02);
        if (x0 + w / 2 > ARM_REACH - 0.06) break;
        const yy = -Math.sin(sag) * Math.max(0, x0 + w / 2 - segA);
        arm.add(mesh(cyl(s % 2 ? 0.053 : 0.0525, s % 2 ? 0.053 : 0.0525, w, 8), s % 2 ? mat.red : mat.white, { pos: [dir * (x0 + w / 2), yy, 0], rot: [0, 0, 90 * D2R], name: 'refl-' + s }));
      }
      // 先端：ゴムキャップ・赤灯り・LED
      const tipX = dir * ARM_REACH, tipY = -Math.sin(sag) * (ARM_REACH - segA);
      arm.add(mesh(cyl(0.05, 0.042, 0.036, 10), mat.rubber, { pos: [tipX + dir * 0.016, tipY, 0], rot: [0, 0, 90 * D2R] }));
      const tipLamp = mesh(sph(0.028, 12, 9), MAT.ledOn('#ff5348', { transparent: false }), { pos: [tipX + dir * 0.016, tipY + 0.052, 0], cast: false });
      tipLamp.userData.signalLamp = { kind: 'crossing', group: 'x', index: 2 };
      arm.add(tipLamp);
      arm.add(mesh(cyl(0.032, 0.03, 0.016, 12), mat.porcelain, { pos: [tipX + dir * 0.014, tipY + 0.036, 0], rot: [0, 0, 90 * D2R] }));
      for (const lx of [0.9, 1.9]) {                                     // 腕木 LED（下面）
        const led = mesh(rbox(0.2, 0.014, 0.05, 0.005, 2), MAT.ledOn('#ff6a52'), { pos: [dir * lx, -Math.sin(sag) * Math.max(0, lx - segA) - 0.052, 0], name: 'led-' + lx, cast: false });
        led.userData.signalLamp = { kind: 'crossing', group: 'x', index: lx > 1.5 ? 3 : 4 };
        arm.add(led);
        arm.add(mesh(box(0.22, 0.008, 0.07), mat.steel, { pos: [dir * lx, -0.044, 0], cast: false }));
      }
      // 腕木の受け金物（上げ時を受ける U 金）＋ 軸継手
      arm.add(mesh(rbox(0.1, 0.06, 0.16, 0.008, 2), mat.zinc, { pos: [dir * 0.3, 0.07, 0] }));
      arm.add(mesh(cyl(0.056, 0.056, 0.05, 8), mat.steel, { pos: [dir * 0.16, 0, 0], rot: [0, 0, 90 * D2R] }));
      g.add(arm);
      // 線路側はみ出し防止（腕木下に下げる針金と小札）
      {
        const wire = grp('keepout', { pos: [0, ARM_Y, 0] });
        wire.add(pipe([[dir * 0.55, -0.06, 0], [dir * 1.3, -0.26, 0], [dir * 2.1, -0.24, 0], [dir * 2.8, -0.07, 0]], 0.0045, MAT.metal('#8d9491', { worn: 0.85 }), { seg: 30, radial: 5 }));
        for (const hx of [0.55, 2.8]) wire.add(mesh(box(0.014, 0.07, 0.014), mat.zinc, { pos: [dir * hx, -0.03, 0] }));
        const tag = grp('keepout-tag', { pos: [dir * 1.7, -0.24, 0.0] });
        tag.add(mesh(rbox(0.26, 0.12, 0.005, 0.006, 2), mat.yellow, { cast: false }));
        decal(tag, { map: TEX.signboard({ text: 'はみだし かんきょう', bg: '#e8c446', fg: '#3a3325' }), w: 0.24, h: 0.09, pos: [0, 0, 0.004], order: 1 });
        decal(tag, { map: TEX.signboard({ text: 'はみだし かんきょう', bg: '#e8c446', fg: '#3a3325' }), w: 0.24, h: 0.09, pos: [0, 0, -4e-3], rot: [0, Math.PI, 0], order: 1 });
        wire.add(tag);
        g.add(wire);
      }
      // 錆・日焼け・擦れ（腕木全体）
      weather(g, { w: 0.5, h: 0.09, pos: [dir * 1.15, ARM_Y - 0.05, 0.05], kind: 'rust', color: '#8a5236', opacity: 0.42, seed: seed + 21, density: 1.6, count: 4, spread: 0.35 });
      weather(g, { w: 0.34, h: 0.07, pos: [dir * 2.3, ARM_Y - 0.02, -0.05], rot: [0, Math.PI, 0], kind: 'chip', color: '#d8d2c2', opacity: 0.45, seed: seed + 22, count: 3, density: 1.4 });
      weather(g, { w: 0.2, h: 0.12, pos: [dir * 0.6, ARM_Y + 0.04, 0.02], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5d564c', opacity: 0.35, seed: seed + 23, count: 3, spread: 0.4 });
    }
    // 支柱の番号札（保守点検）
    {
      const nb = grp('no-plate', { pos: [0, 0.86, 0.068] });
      nb.add(mesh(rbox(0.09, 0.07, 0.006, 0.005, 2), mat.porcelain, { cast: false }));
      decal(nb, { map: TEX.lightPanel({ text: '2L', bg: '#eee8da', fg: '#3f4448' }), w: 0.08, h: 0.055, pos: [0, 0, 0.005], order: 1 });
      g.add(nb);
    }
  }

  /* ════════════════════ 警報機 ════════════════════ */
  else if (kind === 'warning') {
    const postH = 1.5;
    // 角鋼支柱
    g.add(mesh(box(0.09, postH - BASE_TOP, 0.09), mat.steel, { pos: [0, (postH + BASE_TOP) / 2, 0], name: 'column' }));
    for (const sx of [-1, 1]) g.add(mesh(box(0.016, postH - BASE_TOP, 0.052), mat.steel, { pos: [sx * 0.046, (postH + BASE_TOP) / 2, 0.024] }));
    // ジャンク箱と配管
    g.add(mesh(rbox(0.18, 0.22, 0.14, 0.01, 2), mat.steel, { pos: [0, 0.42, -0.1] }));
    g.add(mesh(rbox(0.14, 0.18, 0.008, 0.006, 2), mat.zinc, { pos: [0, 0.42, -0.028] }));
    g.add(mesh(cyl(0.006, 0.006, 0.016, 6), mat.bolt, { pos: [0.05, 0.5, -0.026], rot: [90 * D2R, 0, 0] }));
    g.add(pipe([[0.05, 0.54, -0.1], [0.075, 0.72, -0.13], [0.078, 1.1, -0.12], [0.05, 1.36, -0.07]], 0.017, mat.zinc, { seg: 26, radial: 7, name: 'conduit' }));
    // 頭部：警報機箱・赤 LED 2 灯・遮光フード・ベル
    const head = grp('head', { pos: [0, postH + 0.06, 0] });
    head.add(mesh(rbox(0.42, 0.2, 0.16, 0.012, 2), mat.body, { name: 'alarm-case' }));
    head.add(mesh(box(0.44, 0.02, 0.18), mat.body, { pos: [0, 0.105, 0] }));
    for (const sx of [-1, 1]) {
      const lx = sx * 0.115;
      // 磁器口金＋レンズ（+Z 張り出し球冠）
      head.add(mesh(cyl(0.062, 0.062, 0.014, 16), mat.porcelain, { pos: [lx, 0, 0.078], rot: [90 * D2R, 0, 0] }));
      const R = 0.16, th = Math.asin(0.055 / R);
      const lens = mesh(new SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, th),
        MAT.paint('#ff5348', { steps: 2, spec: 0.7, specPower: 150, emissive: '#ff4a3c', emissiveIntensity: 0.4, shadowAmt: 0.6 }), { pos: [lx, 0, 0.086 - R * Math.cos(th)], rot: [90 * D2R, 0, 0], cast: false, name: 'lamp-' + (sx > 0 ? 'r' : 'l') });
      lens.userData.signalLamp = { kind: 'crossing', group: 'x', index: sx > 0 ? 0 : 1 };
      head.add(lens);
      // 遮光フード（半円殼＋前立ち上がり）
      const hr = 0.072;
      head.add(mesh(new CylinderGeometry(hr, hr, 0.13, 16, 1, true, 0, Math.PI), mat.body, { pos: [lx, 0.012, 0.12], rot: [Math.PI / 2 - 0.32, 0, 0] }));
      head.add(mesh(new RingGeometry(hr - 0.004, hr + 0.014, 16, 1, 0, Math.PI), mat.body, { pos: [lx, 0.012, 0.183], rot: [0, 0, 0], cast: false }));
      head.add(hoop(hr, 0.006, mat.steel, { pos: [lx, 0, 0.072], rot: [0, 0, 0] }));
      weather(head, { w: 0.1, h: 0.05, pos: [lx, -0.075, 0.1], kind: 'dirt', color: '#5d564c', opacity: 0.4, seed: seed + (sx > 0 ? 31 : 32), count: 2 });
    }
    // ベル（支柱頭上の傘鐘）
    {
      const bell = grp('bell', { pos: [0, -0.18, -0.12] });
      bell.add(mesh(cyl(0.018, 0.022, 0.1, 10), mat.steel, { pos: [0, 0.07, 0] }));
      bell.add(mesh(lathe([[0, 0.06], [0.05, 0.05], [0.1, 0.02], [0.12, 0.0], [0.115, -0.012], [0.05, -0.02], [0, -0.024]], 18), MAT.metal('#b09a5e', { worn: 0.75, spec: 0.6, specPower: 130 }), { name: 'bell-dome' }));
      bell.add(mesh(cyl(0.008, 0.008, 0.03, 8), mat.steel, { pos: [0, -0.03, 0] }));
      head.add(bell);
      weather(head, { w: 0.16, h: 0.08, pos: [0, -0.2, -0.12], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 33, count: 2, density: 1.5 });
    }
    g.add(head);
    // 反射縁・注意札
    g.add(mesh(box(0.44, 0.03, 0.01), mat.white, { pos: [0, postH - 0.08, 0.052], cast: false }));
    {
      const tag = grp('notice', { pos: [0, 1.06, 0.052] });
      tag.add(mesh(rbox(0.22, 0.13, 0.006, 0.006, 2), mat.white, { cast: false }));
      decal(tag, { map: TEX.signboard({ text: 'ふみきり', bg: '#f4f1ea', fg: '#c5312c', ar: 2 }), w: 0.2, h: 0.1, pos: [0, 0, 0.005], order: 1 });
      g.add(tag);
    }
    weather(g, { w: 0.1, h: 0.62, pos: [0.052, 0.78, 0.052], rot: [0, Math.PI / 2, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.45, seed: seed + 41, density: 1.7, count: 3, spread: 0.16 });
    weather(g, { w: 0.08, h: 0.24, pos: [-0.05, 0.34, 0.05], rot: [0, -Math.PI / 2, 0], kind: 'chip', color: '#cfd3cc', opacity: 0.4, seed: seed + 42, count: 3 });
    decal(g, { map: TEX.wear({ kind: 'dirt', color: '#4f4a3f', seed: seed + 43, density: 1.4 }), w: 0.34, h: 0.16, pos: [0, 1.42, 0.086], opacity: 0.34, order: 2 });   // 雨だれ
  }

  /* ════════════════════ 非常ボタン ════════════════════ */
  else {
    const postH = 0.98;
    g.add(mesh(cyl(0.045, 0.055, postH - BASE_TOP, 12), mat.steel, { pos: [0, (postH + BASE_TOP) / 2, 0], name: 'column' }));
    // 配管（基礎から箱へ）
    g.add(pipe([[0.06, 0.222, -0.06], [0.085, 0.44, -0.11], [0.08, 0.78, -0.12], [0.03, 0.96, -0.06]], 0.018, mat.zinc, { seg: 24, radial: 7, name: 'conduit' }));
    const boxg = grp('box', { pos: [0, postH + 0.19, 0] });
    boxg.add(mesh(rbox(0.3, 0.36, 0.2, 0.014, 2), mat.yellow, { name: 'emergency-case' }));
    boxg.add(mesh(box(0.32, 0.024, 0.22), mat.yellow, { pos: [0, 0.186, 0] }));                    // 上蓋
    // 赤カバー（半球ドーム）とボタン
    boxg.add(mesh(new SphereGeometry(0.085, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.metalPaint('#d43a2f', { worn: 0.6, base: '#e8615a', side: DoubleSide }), { pos: [0, 0.02, 0.1], rot: [Math.PI, 0, 0], name: 'red-cover' }));
    boxg.add(mesh(cyl(0.05, 0.052, 0.03, 14), MAT.paint('#8f2a22', { spec: 0.35, steps: 2 }), { pos: [0, -0.01, 0.104], rot: [90 * D2R, 0, 0] }));
    boxg.add(mesh(cyl(0.058, 0.058, 0.008, 16), mat.steel, { pos: [0, -0.01, 0.098], rot: [90 * D2R, 0, 0] }));
    // 注意表示（両面）
    for (const s of [1, -1]) {
      const pl = grp('label', { pos: [0, -0.11, s * 0.101], rot: [0, s > 0 ? 0 : Math.PI, 0] });
      pl.add(mesh(rbox(0.24, 0.11, 0.005, 0.005, 2), mat.white, { cast: false }));
      decal(pl, { map: TEX.signboard({ text: '非常ボタン', bg: '#f4f1ea', fg: '#c5312c', sub: 'EMERGENCY' }), w: 0.22, h: 0.085, pos: [0, 0, 0.004], order: 1 });
      boxg.add(pl);
    }
    // 鍵（シリンダ・つまみ）と点検蝶番
    boxg.add(mesh(cyl(0.016, 0.016, 0.02, 12), MAT.metal('#b9bdc0', { worn: 0.6, spec: 0.7, specPower: 150 }), { pos: [0.1, 0.11, 0.102], rot: [90 * D2R, 0, 0] }));
    boxg.add(mesh(box(0.006, 0.024, 0.006), MAT.metal('#8b9092', { worn: 0.7 }), { pos: [0.1, 0.11, 0.113], cast: false }));
    for (const hy of [0.1, -0.12]) boxg.add(mesh(box(0.026, 0.022, 0.016), mat.steel, { pos: [-0.156, hy, 0.02] }));
    for (const bx of [-0.1, 0.1]) for (const by of [0.14, -0.14]) boxg.add(mesh(cyl(0.007, 0.007, 0.012, 6), mat.bolt, { pos: [bx, by, 0.1], rot: [90 * D2R, 0, 0] }));
    g.add(boxg);
    // 下部の注意矢印（踏切側を向く）
    {
      const ar = grp('arrow', { pos: [0, 0.7, 0.048] });
      ar.add(mesh(box(0.03, 0.1, 0.006), mat.white, { pos: [0, 0.02, 0], cast: false }));
      for (const s of [-1, 1]) ar.add(mesh(box(0.026, 0.06, 0.006), mat.white, { pos: [s * 0.024, -0.05, 0], rot: [0, 0, s * 0.6], cast: false }));
      g.add(ar);
    }
    // 誘導灯（上部：非常ボタンの位置を示す青白灯。breathe で柔らかく明暗）
    {
      const gd = grp('guide-lamp', { pos: [0, postH + 0.42, 0.005], rot: [0, 0, -2 * D2R] });
      gd.userData.breathe = { speed: 0.3, amount: 0.09, phase: 1.15 };
      gd.add(mesh(cyl(0.013, 0.014, 0.08, 8), mat.steel, { pos: [0, -0.045, 0], name: 'guide-stem' }));
      gd.add(mesh(rbox(0.13, 0.11, 0.055, 0.014, 2), mat.zinc, { name: 'guide-case' }));
      gd.add(mesh(box(0.15, 0.02, 0.07), mat.zinc, { pos: [0, 0.062, 0], cast: false }));            // 笠
      gd.add(mesh(cyl(0.036, 0.036, 0.012, 14), MAT.lampShade({ color: '#dceefc', emissive: '#5fa0d8', emissiveIntensity: 0.7, steps: 2 }), {
        pos: [0, -4e-3, 0.031], rot: [90 * D2R, 0, 0], name: 'guide-lens', cast: false,
      }));
      for (const s of [-1, 1]) gd.add(mesh(cyl(0.006, 0.006, 0.01, 6), mat.bolt, { pos: [s * 0.05, 0.04, 0.028], rot: [90 * D2R, 0, 0] }));
      weather(gd, { w: 0.1, h: 0.06, pos: [0.02, -0.05, 0.03], kind: 'dirt', color: '#8d8774', opacity: 0.4, seed: seed + 61, density: 1.3, spread: 0.01 });
      g.add(gd);
    }
    weather(g, { w: 0.16, h: 0.3, pos: [0.09, 1.06, 0.02], rot: [0, Math.PI / 2, 0], kind: 'chip', color: '#f6efdc', opacity: 0.5, seed: seed + 51, count: 3, density: 1.5 });   // 黄色退色・剥がれ
    weather(g, { w: 0.1, h: 0.5, pos: [-0.05, 0.5, 0.05], rot: [0, -Math.PI / 2, 0], kind: 'rust', color: '#7d4a2c', opacity: 0.45, seed: seed + 52, density: 1.6, count: 3, spread: 0.25 });
    weather(g, { w: 0.22, h: 0.1, pos: [0, 0.85, 0.11], kind: 'dirt', color: '#5d564c', opacity: 0.4, seed: seed + 53, count: 2 });
  }

  /* 全 kind 共通：足元の泥・コケ・落ち葉 */
  weather(g, { w: 0.3, h: 0.09, pos: [0, 0.245, 0.09], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: PAL.moss, opacity: 0.34, seed: seed + 91, density: 1.4, count: 2, spread: 0.03 });
  for (let i = 0; i < 5; i++) {
    g.add(mesh(rbox(range(rnd, 0.04, 0.06), 0.004, range(rnd, 0.03, 0.045), 0.004, 1), MAT.leaf({ color: '#9c8a5e' }), {
      pos: [range(rnd, -0.26, 0.26), 0.108, range(rnd, -0.24, 0.24)], rot: [0, rnd() * 3, 0], cast: false,
    }));
  }
  return finish(g, { outline: 'normal', minSize: 0.045 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
