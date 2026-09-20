import { g as grp, M as MAT, P as PAL, T as TEX, m as mesh, b as box, w as weather, c as cyl, t as tor, n as range, r as rbox, h as decal, q as finish, z as rand } from './index-D8uBk-tk.js';

//  assets/store/convenience-store.js —— 便利店外壳（基礎・外壁・陸屋根・女墙・雨樋・屋根上設備・外部配管）
//  轮廓 9.4(X) × 5.6(Z)，原点 = 轮廓中心 = 地面 y=0，正面（ガラス面）朝 +Z。
//  室内地坪 y=0.12、净高 2.85、屋版 0.22、女墙顶 3.42。内壁/床/柱は interior/wall-and-floor.js が担当。

const meta = {
  id: 'convenience-store',
  real: [9.4, 3.42, 5.6],
  origin: 'footprint-center-ground',
};

const W = 9.4, D = 5.6;
const HX = W / 2, HZ = D / 2;
const FY = 0.12;          // 室内地坪
const CH = 2.85;          // 内法
const SLAB = 0.22;        // 屋面板厚
const PARA = 0.45;        // 女墙高
const WT = 0.24;          // 外壁厚
const DOOR_H = 2.32;

function build(options = {}) {
  const { seed = 201, name = 'サクラ・マート' } = options;
  const rnd = rand(seed);
  const g = grp('convenience-store');

  /* ---------------- 材质 ---------------- */
  const M = {
    foundation: MAT.concrete({ base: '#a49e93', repeat: 1, cracked: true }),
    skirt: MAT.tile({ color: '#cfc8b8', n: 6, repeat: 1 }),
    wall: MAT.paint(PAL.storeWall, {
      map: TEX.concrete({ base: PAL.storeWall, repeat: 1, joints: 0 }).map,
      normalMap: TEX.concrete({ base: PAL.storeWall, repeat: 1 }).normalMap,
      normalScaleX: 0.7, normalScaleY: 0.7, spec: 0.1, sheen: 0.02, shadowAmt: 0.86, steps: 3,
    }),
    panel: MAT.paint(PAL.storeWallTrim, { map: TEX.metal({ base: PAL.storeWallTrim, dir: 'h', worn: 0.3, repeat: 1 }).map, spec: 0.2, specPower: 40, sheen: 0.04 }),
    alu: MAT.metal('#c3c7c9', { worn: 0.35, repeat: 2, spec: 0.55, specPower: 110 }),
    aluDark: MAT.metal('#8d9295', { worn: 0.6, spec: 0.4 }),
    steel: MAT.metalPaint('#9aa0a2', { worn: 0.8, repeat: 2 }),
    roof: MAT.concrete({ base: '#8f8b82', repeat: 1, cracked: true }),
    waterproof: MAT.paint('#7f7d78', { map: TEX.concrete({ base: '#7f7d78', repeat: 1, joints: 3 }).map, spec: 0.16, specPower: 24, sheen: 0.03, shadowAmt: 0.8, steps: 3 }),
    gutter: MAT.metal('#a8adad', { worn: 0.7, dir: 'h', spec: 0.42 }),
    pipe: MAT.plastic('#d9d5cb', { spec: 0.28, specPower: 40, sheen: 0.04 }),
    band: MAT.paint(PAL.storeBand, { spec: 0.26, specPower: 60, sheen: 0.05, shadowAmt: 0.72, steps: 3 }),
    band2: MAT.paint(PAL.storeBand2, { spec: 0.26, specPower: 60, sheen: 0.05, shadowAmt: 0.72, steps: 3 }),
    band3: MAT.paint(PAL.storeBand3, { spec: 0.26, specPower: 60, sheen: 0.05, shadowAmt: 0.72, steps: 3 }),
    unit: MAT.metal('#b3b7b9', { worn: 0.75, repeat: 2 }),
    dark: MAT.paint('#3d4247', { spec: 0.2, steps: 2, shadowAmt: 0.95 }),
  };

  /* ---------------- 1. 布基礎・鉄板水切 ---------------- */
  const fnd = grp('foundation');
  fnd.add(mesh(box(W + 0.1, 0.46, D + 0.1), M.foundation, { pos: [0, 0.23 - 0.06, 0], name: 'footing' }));
  fnd.add(mesh(box(W + 0.06, 0.1, D + 0.06), MAT.concrete({ base: '#b6b0a4', repeat: 1 }), { pos: [0, 0.44, 0], name: 'base-top' }));
  // 鉄板水切（基礎と立ち上がりの取り合い）
  fnd.add(mesh(box(W + 0.05, 0.055, D + 0.05), M.aluDark, { pos: [0, 0.5, 0], name: 'damp-course' }));
  // 打継目地・沈下・コケ
  for (let i = 0; i < 5; i++) {
    fnd.add(mesh(box(0.016, 0.42, D + 0.08), MAT.paint('#8d8779', { spec: 0.04, steps: 2 }), { pos: [-HX + 1.1 + i * 2.1, 0.2, 0], cast: false }));
  }
  weather(fnd, { w: W * 0.9, h: 0.34, pos: [0, 0.2, HZ + 0.055], kind: 'moss', color: '#63804e', opacity: 0.42, seed: seed + 3, density: 1.8, count: 3, spread: 0.2 });
  weather(fnd, { w: D * 0.9, h: 0.3, pos: [-4.755, 0.2, 0], rot: [0, Math.PI / 2, 0], kind: 'dirt', color: '#4f4a3e', opacity: 0.4, seed: seed + 5, density: 1.6, count: 2, spread: 0.18 });
  g.add(fnd);

  /* ---------------- 2. 床スラブ + 室内地坪 ---------------- */
  g.add(mesh(box(W, FY - 0.06, D), MAT.concrete({ base: '#c8c2b6', repeat: 1 }), { pos: [0, 0.06 + (FY - 0.06) / 2, 0], name: 'floor-slab', cast: false, receive: true }));
  g.add(mesh(box(W - 0.5, 0.02, D - 0.5), MAT.paint(PAL.interiorFloor, { map: TEX.storeFloor({ repeat: 1 }).map, spec: 0.3, specPower: 90, shadowAmt: 0.6 }), { pos: [0, FY + 0.005, 0], name: 'interior-floor', cast: false, receive: true }));

  /* ---------------- 3. 外壁（北・西・東 + 南は柱と袖壁のみ） ---------------- */
  const wallH = CH - 0.5;
  const solidWall = (name, x0, x1, z0, z1) => {
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
    const m = mesh(box(w, wallH, d), M.wall, {
      name,
      pos: [(x0 + x1) / 2, 0.5 + wallH / 2, (z0 + z1) / 2],
      cast: true,
      receive: true,
    });
    g.add(m);
    // 腰タイル（外側下半分）
    return m;
  };
  solidWall('wall-north', -HX, HX, -HZ, -HZ + WT);
  solidWall('wall-west', -HX, -HX + WT, -HZ, HZ);
  solidWall('wall-east', HX - WT, HX, -HZ, HZ);
  // 南側：両袖壁 + 上部梁（ガラス面は別モジュール）
  solidWall('wall-south-pier-w', -HX, -HX + 1.7, HZ - WT, HZ);
  solidWall('wall-south-pier-e', HX - 1.7, HX, HZ - WT, HZ);
  g.add(mesh(box(W, CH - DOOR_H, WT), M.wall, { pos: [0, DOOR_H + (CH - DOOR_H) / 2, HZ - WT / 2], name: 'wall-south-head', cast: true, receive: true }));
  // 上部アルミパネル帯（カセット帯）+ 三色ライン
  g.add(mesh(box(W - 3.3, 0.62, 0.05), M.panel, { pos: [0, 2.5, HZ + 0.005], name: 'fascia-panel', cast: true, receive: true }));
    for (let i = 0; i < 3; i++) {
    const mat = [M.band, M.band2, M.band3][i];
    g.add(mesh(box(W - 3.3, 0.075, 0.055), mat, { pos: [0, 2.24 + i * 0.078, HZ + 0.012], name: 'band-' + i, cast: false, receive: true }));
  }
  // 外壁の目地・打ち増し・補修
  for (let i = 0; i < 7; i++) {
    const x = -HX + 0.8 + i * 1.32;
    g.add(mesh(box(0.014, wallH - 0.1, 0.014), MAT.paint('#cdc7ba', { spec: 0.06, steps: 2 }), { pos: [x, 0.5 + wallH / 2, -HZ - 0.002], cast: false }));
  }
  // 腰タイル（北・東・西の外面、下 0.9m）
  for (const [name, geo, pos, ry] of [
    ['skirt-north', box(W, 0.9, 0.02), [0, 0.95, -HZ - 0.012], 0],
    ['skirt-west', box(0.02, 0.9, D), [-HX - 0.012, 0.95, 0], 0],
    ['skirt-east', box(0.02, 0.9, D), [HX + 0.012, 0.95, 0], 0],
  ]) {
    const m = mesh(geo, M.skirt, { name, pos, cast: false, receive: true });
    g.add(m);
  }
  // 目地押え（アルミ）
  for (const [geo, pos] of [
    [box(W + 0.02, 0.02, 0.032), [0, 1.41, -HZ - 0.014]],
    [box(0.032, 0.02, D + 0.02), [-HX - 0.014, 1.41, 0]],
    [box(0.032, 0.02, D + 0.02), [HX + 0.014, 1.41, 0]],
  ]) g.add(mesh(geo, M.alu, { pos, cast: false }));

  /* ---------------- 4. 陸屋根・女墙・笠木・防水 ---------------- */
  g.add(mesh(box(W, SLAB, D), M.roof, { pos: [0, CH + SLAB / 2, 0], name: 'roof-slab', cast: true, receive: true }));
  g.add(mesh(box(W - 0.3, 0.018, D - 0.3), M.waterproof, { pos: [0, CH + SLAB + 0.009, 0], name: 'waterproofing', cast: false, receive: true }));
  // 女墙 4 面（ALC + 笠木）
  const para = (name, x0, x1, z0, z1) => {
    const w = Math.abs(x1 - x0) || 0.16, d = Math.abs(z1 - z0) || 0.16;
    g.add(mesh(box(w, PARA, d), M.wall, { name, pos: [(x0 + x1) / 2, CH + SLAB + PARA / 2, (z0 + z1) / 2], cast: true, receive: true }));
    const cw = Math.abs(x1 - x0) + 0.07, cd = Math.abs(z1 - z0) + 0.07;
    g.add(mesh(box(cw, 0.038, cd), M.alu, { name: name + '-coping', pos: [(x0 + x1) / 2, CH + SLAB + PARA + 0.019, (z0 + z1) / 2], cast: true, receive: true }));
  };
  para('parapet-north', -HX, HX, -HZ, -HZ + 0.16);
  para('parapet-south', -HX, HX, HZ - 0.16, HZ);
  para('parapet-west', -HX, -HX + 0.16, -HZ, HZ);
  para('parapet-east', HX - 0.16, HX, -HZ, HZ);
  // 女墙のジョイント・コーキング・雨染み
  for (let i = 0; i < 9; i++) {
    const x = -HX + 0.6 + i * 1.15;
    g.add(mesh(box(0.012, PARA - 0.06, 0.014), M.aluDark, { pos: [x, CH + SLAB + PARA / 2, HZ - 0.08], cast: false }));
    g.add(mesh(box(0.012, PARA - 0.06, 0.014), M.aluDark, { pos: [x, CH + SLAB + PARA / 2, -HZ + 0.08], cast: false }));
  }
  // ドレン（防水層からの排水）
  for (const [x, z] of [[-HX + 0.3, -HZ + 0.28], [HX - 0.3, HZ - 0.28]]) {
    g.add(mesh(cyl(0.045, 0.045, 0.1, 10), M.steel, { pos: [x, CH + SLAB - 0.02, z], cast: false }));
    g.add(mesh(tor(0.055, 0.012, 6, 12), M.steel, { pos: [x, CH + SLAB + 0.02, z], rot: [Math.PI / 2, 0, 0], cast: false }));
  }

  /* ---------------- 5. 雨樋・竪管 ---------------- */
  const gutterY = CH + SLAB + 0.06;
  for (const [name, z, dir] of [['gutter-south', HZ + 0.04, 1], ['gutter-north', -HZ - 0.04, -1]]) {
    const gg = grp(name);
    gg.add(mesh(cyl(0.062, 0.062, W + 0.1, 12, false), M.gutter, { pos: [0, gutterY, z], rot: [0, 0, Math.PI / 2], cast: true, receive: true }));
    gg.add(mesh(box(W + 0.1, 0.012, 0.02), M.gutter, { pos: [0, gutterY + 0.055, z], cast: false }));
    for (let i = 0; i < 9; i++) {
      const x = -HX + 0.35 + i * 1.08;
      gg.add(mesh(box(0.026, 0.11, 0.026), M.steel, { pos: [x, gutterY + 0.03, z - dir * 0.02], cast: false }));
    }
    g.add(gg);
  }
  // 竪管（南東隅）
  const down = grp('downpipe', { pos: [HX - 0.02, 0, HZ - 0.02] });
  down.add(mesh(cyl(0.055, 0.055, CH + SLAB + 0.1, 12), M.pipe, { pos: [0, (CH + SLAB) / 2, 0], cast: true, receive: true }));
  for (let i = 0; i < 4; i++) {
    down.add(mesh(box(0.02, 0.05, 0.13), M.steel, { pos: [-0.05, 0.6 + i * 0.62, -0.02], cast: false }));
  }
  down.add(mesh(cyl(0.075, 0.06, 0.1, 12), M.pipe, { pos: [0, 0.14, 0], cast: false }));
  g.add(down);

  /* ---------------- 6. 屋根上設備 ---------------- */
  const roofY = CH + SLAB + 0.02;
  // エアコン用室外機据付台 2 + ファンユニット
  for (const x of [-2.6, 1.4]) {
    const st = grp('roof-mount', { pos: [x, roofY, -1.1] });
    st.add(mesh(box(0.9, 0.16, 0.62), M.alu, { pos: [0, 0.08, 0], cast: true, receive: true }));
    for (const [dx, dz] of [[-0.38, -0.24], [0.38, -0.24], [-0.38, 0.24], [0.38, 0.24]]) {
      st.add(mesh(box(0.08, 0.1, 0.08), MAT.rubber('#3a3d40'), { pos: [dx, 0.21, dz], cast: false }));
    }
    st.add(mesh(box(0.86, 0.5, 0.58), M.unit, { pos: [0, 0.5, 0], cast: true, receive: true }));
    st.add(mesh(cyl(0.19, 0.19, 0.03, 18), M.dark, { pos: [0, 0.5, 0.3], rot: [Math.PI / 2, 0, 0], cast: false }));
    for (let i = 0; i < 9; i++) {
      st.add(mesh(box(0.7, 0.012, 0.012), M.aluDark, { pos: [0, 0.34 + i * 0.028, 0.295], cast: false }));
    }
    st.add(mesh(cyl(0.035, 0.035, 0.5, 8), M.pipe, { pos: [0.44, 0.3, -0.1], rot: [0, 0, 0.5], cast: false }));
    g.add(st);
  }
  // 換気フード・点検口・アンテナ・避雷
  const vents = grp('roof-vents');
  for (const [x, z, r] of [[-0.6, 1.5, 0.16], [2.9, -0.4, 0.13], [-3.4, 0.6, 0.13]]) {
    vents.add(mesh(cyl(r, r * 1.15, 0.34, 14), M.unit, { pos: [x, roofY + 0.17, z], cast: true, receive: true }));
    vents.add(mesh(cyl(r * 1.5, r * 1.5, 0.05, 14), M.steel, { pos: [x, roofY + 0.36, z], cast: true, receive: true }));
    vents.add(mesh(tor(r * 1.2, 0.012, 6, 14), M.aluDark, { pos: [x, roofY + 0.3, z], rot: [Math.PI / 2, 0, 0], cast: false }));
  }
  g.add(vents);
  const hatch = grp('hatch', { pos: [1.0, roofY, 1.4] });
  hatch.add(mesh(box(0.72, 0.06, 0.72), M.alu, { pos: [0, 0.03, 0], cast: true, receive: true }));
  hatch.add(mesh(box(0.62, 0.03, 0.62), M.unit, { pos: [0, 0.075, 0], rot: [-0.22, 0, 0], cast: true, receive: true }));
  hatch.add(mesh(box(0.1, 0.02, 0.02), M.aluDark, { pos: [0.2, 0.09, -0.2], cast: false }));
  g.add(hatch);
  // TV/無線アンテナ
  const ant = grp('antenna', { pos: [-3.6, roofY, -1.6] });
  ant.add(mesh(cyl(0.03, 0.04, 0.5, 8), M.steel, { pos: [0, 0.25, 0], cast: true }));
  ant.add(mesh(box(0.05, 0.02, 0.62), M.alu, { pos: [0, 0.52, 0], rot: [0, 0, 0.2], cast: true }));
  for (let i = 0; i < 6; i++) ant.add(mesh(box(0.02, 0.016, 0.3 - i * 0.03), M.alu, { pos: [0, 0.56 + i * 0.006, -0.02], cast: false }));
  g.add(ant);
  // 避雷針・支持金物
  const rod = grp('lightning-rod', { pos: [HX - 0.3, roofY, -HZ + 0.3] });
  rod.add(mesh(cyl(0.014, 0.014, 1.05, 8), M.steel, { pos: [0, 0.52, 0], cast: true }));
  rod.add(mesh(cyl(0.03, 0.03, 0.06, 8), M.aluDark, { pos: [0, 1.02, 0], cast: false }));
  rod.add(mesh(box(0.16, 0.05, 0.16), MAT.concrete({ base: '#b6b0a4', repeat: 1 }), { pos: [0, 0.025, 0], cast: true, receive: true }));
  g.add(rod);
  // 屋根上の落ち葉・土・コケ（女墙際）
  for (let i = 0; i < 16; i++) {
    const x = range(rnd, -HX + 0.3, HX - 0.3);
    const z = range(rnd, -HZ + 0.25, HZ - 0.25);
    g.add(mesh(rbox(range(rnd, 0.05, 0.14), 0.012, range(rnd, 0.04, 0.1), 0.01, 1), rnd() > 0.5 ? MAT.paper('#a8895c') : MAT.paper('#7d8a5c'), { pos: [x, roofY + 0.03, z], rot: [0, range(rnd, 0, 3), 0], cast: false, receive: true }));
  }
  weather(g, { w: W * 0.8, h: 0.02, pos: [0, roofY + 0.028, 0], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#6d8152', opacity: 0.3, seed: seed + 31, density: 1.4 });

  /* ---------------- 7. 外部配管・メーター・換気 ---------------- */
  // 北壁の給排水・ダクト
  const pipes = grp('ext-pipes');
  for (const [x, r, col] of [[-3.1, 0.05, '#d9d5cb'], [-2.75, 0.036, '#cfcabf'], [3.4, 0.045, '#d9d5cb']]) {
    const p = mesh(cyl(r, r, wallH + 0.3, 12), MAT.plastic(col, { spec: 0.24, sheen: 0.03 }), { pos: [x, 0.5 + (wallH + 0.3) / 2, -HZ - 0.06], cast: true, receive: true });
    pipes.add(p);
    for (let i = 0; i < 3; i++) pipes.add(mesh(box(r * 2.6, 0.03, r * 2.2), M.steel, { pos: [x, 0.9 + i * 0.72, -HZ - 0.06], cast: false }));
  }
  // 凍結防止巻（一部ほどけた表現）
  pipes.add(mesh(cyl(0.062, 0.062, 0.62, 10), MAT.paint('#e6e2d4', { map: TEX.fabric({ base: '#e6e2d4', repeat: 6 }).map, spec: 0.06, shadowAmt: 0.9 }), { pos: [-3.1, 1.1, -HZ - 0.06], cast: true, receive: true }));
  pipes.add(mesh(cyl(0.052, 0.052, 0.2, 10), MAT.paint('#c9c3b3', { spec: 0.08 }), { pos: [-3.1, 1.52, -HZ - 0.06], cast: true }));
  g.add(pipes);
  // 換気ガラリ（北壁）
  for (const x of [-1.2, 2.2]) {
    const v = grp('vent', { pos: [x, 2.2, -HZ - 0.012] });
    v.add(mesh(box(0.44, 0.34, 0.05), M.alu, { cast: true, receive: true }));
    for (let i = 0; i < 6; i++) v.add(mesh(box(0.38, 0.026, 0.03), M.aluDark, { pos: [0, 0.13 - i * 0.05, 0.03], rot: [0.4, 0, 0], cast: false }));
    v.add(mesh(box(0.5, 0.06, 0.1), M.alu, { pos: [0, 0.2, 0.02], rot: [-0.25, 0, 0], cast: true }));
    g.add(v);
  }
  // 電気メーター箱（東壁）
  const meter = grp('meter-box', { pos: [HX + 0.03, 1.5, -1.4] });
  meter.add(mesh(rbox(0.06, 0.5, 0.38, 0.01, 2), M.alu, { cast: true, receive: true }));
  meter.add(mesh(box(0.012, 0.3, 0.24), MAT.plastic('#cfd6d8', { transparent: true, opacity: 0.5, spec: 0.5 }), { pos: [0.032, 0.04, 0], cast: false }));
  meter.add(mesh(box(0.02, 0.03, 0.03), M.aluDark, { pos: [0.036, -0.16, 0.09], cast: false }));
  g.add(meter);
  // 幹線引き込み（東壁から屋根へ）
  g.add(mesh(cyl(0.026, 0.026, 1.9, 8), M.dark, { pos: [HX + 0.05, 1.9, -0.4], rot: [0, 0, 0.1], cast: true }));

  /* ---------------- 8. 看板下地・取り合い・経年 ---------------- */
  // 看板バンド（南ファシア上のアルミ見切）
  g.add(mesh(box(W - 3.2, 0.04, 0.06), M.alu, { pos: [0, 2.83, HZ + 0.02], cast: false }));
  g.add(mesh(box(W - 3.2, 0.04, 0.06), M.alu, { pos: [0, 2.19, HZ + 0.02], cast: false }));
  // 壁の経年：水洟・退色・補修・落書き除去・テープ跡
  const faces = [
    { pos: [0, 2.1, -HZ - 0.008], rot: [0, Math.PI, 0], w: W, h: 2.2 },
    { pos: [-HX - 0.008, 2.0, 0], rot: [0, -Math.PI / 2, 0], w: D, h: 2.2 },
    { pos: [HX + 0.008, 2.0, 0], rot: [0, Math.PI / 2, 0], w: D, h: 2.2 },
    { pos: [0, 2.9, HZ + 0.02], rot: [0, 0, 0], w: W, h: 0.6 },
  ];
  faces.forEach((f, i) => {
    for (let k = 0; k < 5; k++) {
      weather(g, {
        w: f.w * range(rnd, 0.12, 0.3),
        h: f.h * range(rnd, 0.4, 0.95),
        pos: [f.pos[0] + (i < 2 ? range(rnd, -f.w / 3, f.w / 3) : 0), f.pos[1] + range(rnd, -0.2, 0.3), f.pos[2] + (i === 1 || i === 3 ? range(rnd, -f.w / 3, f.w / 3) : 0)],
        rot: f.rot,
        kind: ['dirt', 'chip', 'scratch', 'moss'][(k + i) % 4],
        color: ['#6b6152', '#cfc8b8', '#b8b2a4', '#63804e'][(k + i) % 4],
        opacity: range(rnd, 0.14, 0.32),
        seed: seed + 100 + i * 17 + k,
        density: 1.2,
      });
    }
  });
  // 落書き除去跡・貼紙
  decal(g, { map: TEX.wear({ kind: 'scratch', color: '#d8d2c4', seed: seed + 71, density: 1.6 }), w: 0.5, h: 0.34, pos: [-HX - 0.014, 1.1, 1.2], rot: [0, -Math.PI / 2, 0], opacity: 0.5 });
  decal(g, { map: TEX.poster({ title: '注意', bg: '#f0e8d6', accent: '#b8a98f', seed: seed + 73 }), w: 0.18, h: 0.24, pos: [HX + 0.014, 1.6, -0.6], rot: [0, Math.PI / 2, 0.03], opacity: 0.85 });

  return finish(g, { outline: 'normal', minSize: 0.06 });
}

export { build, build as default, meta };
