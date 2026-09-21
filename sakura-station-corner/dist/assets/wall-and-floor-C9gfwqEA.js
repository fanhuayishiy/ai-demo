import { g as grp, M as MAT, P as PAL, T as TEX, x as PlaneGeometry, v as Mesh, m as mesh, b as box, w as weather, n as range, c as cyl, h as decal, q as finish, z as rand } from './index-Dj2iGATz.js';

//  assets/interior/wall-and-floor.js —— 店内内壁・床・柱・腰壁（无空白死角，供其它设备贴靠）
//  局部坐标与店铺主体一致：轮廓 x∈[-4.7,4.7]、z∈[-2.8,2.8]，地坪 y=0.12，净高 2.85

const meta = {
  id: 'wall-and-floor',
  real: [9.4, 3.0, 5.6],
  origin: 'ground-center',
};

const X0 = -4.7, X1 = 4.7, Z0 = -2.8, Z1 = 2.8;
const FY = 0.12;
const CH = 2.85;

function build(options = {}) {
  const { seed = 901 } = options;
  const rnd = rand(seed);
  const g = grp('wall-and-floor');

  const floorMat = MAT.paint(PAL.interiorFloor, {
    map: TEX.storeFloor({ repeat: 1 }).map,
    normalMap: TEX.storeFloor({ repeat: 1 }).normalMap,
    normalScaleX: 0.35,
    normalScaleY: 0.35,
    spec: 0.3,
    specPower: 90,
    specCut: 0.14,
    sheen: 0.1,
    shadowAmt: 0.5,
    steps: 3,
    sat: 0.99,
  });
  // 内装ライニングは「商品が映る背景」で、主役ではない。ここが #ded7c6 だと
  // 蛍光灯（PAL.fluorescent #eaf6ff・強度 2.1）+ ヘミ + 寒色 fill を全部受けて
  // 大ガラスの上半分が 213-226 の青白い帯に飛んでいた（`tools/pick.mjs --px=600,300`）。
  // 外壁（PAL.storeWall）はヒーロー画の構成要素なので触らず、内側だけ落とす。
  const wallMat = MAT.paint('#c6bfae', {
    map: TEX.paper({ base: '#f2ecdf' }).map,
    spec: 0.06,
    sheen: 0.01,
    shadowAmt: 0.72,
    steps: 3,
  });
  const tileMat = MAT.paint('#cdd4d0', {
    map: TEX.tile({ color: '#e9eeea', n: 10, repeat: 1 }).map,
    normalMap: TEX.tile({ color: '#e9eeea', n: 10, repeat: 1 }).normalMap,
    normalScaleX: 0.5,
    normalScaleY: 0.5,
    spec: 0.42,
    specPower: 130,
    specCut: 0.1,
    sheen: 0.12,
    shadowAmt: 0.62,
    steps: 3,
  });
  const steelMat = MAT.metal('#c0c4c6', { worn: 0.35, repeat: 2, spec: 0.55 });

  /* ---------- 床 ---------- */
  const floorGeo = new PlaneGeometry(X1 - X0, Z1 - Z0, 4, 3);
  {
    const uv = floorGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6.2, uv.getY(i) * 3.8);
  }
  const floor = new Mesh(floorGeo, floorMat);
  floor.name = 'floor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FY, 0);
  floor.receiveShadow = true;
  g.add(floor);
  // 床の段差・目地アルミ（入口側）
  g.add(mesh(box(X1 - X0, 0.012, 0.036), steelMat, { pos: [0, FY + 0.006, Z1 - 0.06], cast: false }));
  // 摩耗・黒ズミ・タイヤ痕・水拭き残り
  for (let i = 0; i < 9; i++) {
    weather(g, {
      w: range(rnd, 0.8, 2.6),
      h: range(rnd, 0.5, 1.8),
      pos: [range(rnd, X0 + 0.8, X1 - 0.8), FY + 0.003, range(rnd, Z0 + 0.6, Z1 - 0.6)],
      rot: [-Math.PI / 2, 0, range(rnd, -0.6, 0.6)],
      kind: i % 3 === 0 ? 'scratch' : 'dirt',
      color: ['#6b6459', '#4f4a44', '#8b857a'][i % 3],
      opacity: range(rnd, 0.08, 0.2),
      seed: seed + 40 + i,
      density: 1.2,
    });
  }

  /* ---------- 内壁（北・西・東 + 南はガラス用の框のみ） ---------- */
  const wallH = CH - FY;
  const skirtH = 0.95;
  const walls = [
    { name: 'wall-north', x0: X0, x1: X1, z: Z0, face: '+z' },
    { name: 'wall-south-pier-l', x0: X0, x1: X0 + 1.5, z: Z1, face: '-z' },
    { name: 'wall-south-pier-r', x0: X1 - 1.9, x1: X1, z: Z1, face: '-z' },
  ];
  for (const w of walls) {
    const up = mesh(box(w.x1 - w.x0, wallH - skirtH, 0.03), wallMat, {
      name: w.name,
      pos: [(w.x0 + w.x1) / 2, FY + skirtH + (wallH - skirtH) / 2, w.z],
      cast: false,
      receive: true,
    });
    g.add(up);
    const sk = mesh(box(w.x1 - w.x0, skirtH, 0.036), tileMat, {
      name: w.name + '-skirt',
      pos: [(w.x0 + w.x1) / 2, FY + skirtH / 2, w.z],
      cast: false,
      receive: true,
    });
    g.add(sk);
    // 目地アルミ押え
    g.add(mesh(box(w.x1 - w.x0, 0.018, 0.05), steelMat, { pos: [(w.x0 + w.x1) / 2, FY + skirtH, w.z], cast: false }));
  }
  // 西壁（連続）
  g.add(mesh(box(0.03, wallH - skirtH, Z1 - Z0), wallMat, { name: 'wall-west', pos: [X0, FY + skirtH + (wallH - skirtH) / 2, 0], cast: false, receive: true }));
  g.add(mesh(box(0.036, skirtH, Z1 - Z0), tileMat, { name: 'wall-west-skirt', pos: [X0, FY + skirtH / 2, 0], cast: false, receive: true }));
  g.add(mesh(box(0.05, 0.018, Z1 - Z0), steelMat, { name: 'wall-west-trim', pos: [X0, FY + skirtH, 0], cast: false }));
  /* 東壁：後扉（store/backroom-door.js が世界 x=-1.9, z=+0.4 → 局所 z≈-1.6 に幅 0.9×高さ 2.0 の洞口）を空ける */
  const DOOR_Z = -1.6, DOOR_W = 0.92, DOOR_H = 2.0;
  const seg = (z0, z1) => {
    if (z1 - z0 < 0.02) return;
    const d = z1 - z0;
    g.add(mesh(box(0.03, wallH - skirtH, d), wallMat, { name: 'wall-east', pos: [X1, FY + skirtH + (wallH - skirtH) / 2, (z0 + z1) / 2], cast: false, receive: true }));
    g.add(mesh(box(0.036, skirtH, d), tileMat, { name: 'wall-east-skirt', pos: [X1, FY + skirtH / 2, (z0 + z1) / 2], cast: false, receive: true }));
    g.add(mesh(box(0.05, 0.018, d), steelMat, { name: 'wall-east-trim', pos: [X1, FY + skirtH, (z0 + z1) / 2], cast: false }));
  };
  seg(Z0, DOOR_Z - DOOR_W / 2);
  seg(DOOR_Z + DOOR_W / 2, Z1);
  // 洞口の上欄（見切り）と補強框
  g.add(mesh(box(0.05, wallH - DOOR_H - skirtH + skirtH, DOOR_W + 0.16), wallMat, {
    name: 'wall-east-lintel',
    pos: [X1, FY + DOOR_H + (wallH - DOOR_H) / 2, DOOR_Z],
    cast: false,
    receive: true,
  }));
  for (const dz of [-DOOR_W / 2 - 0.03, DOOR_W / 2 + 0.03]) {
    g.add(mesh(box(0.052, DOOR_H, 0.06), steelMat, { pos: [X1, FY + DOOR_H / 2, DOOR_Z + dz], cast: false, receive: true }));
  }
  // 洞口の裏（後場側の暗がり）：薄い影面
  g.add(mesh(box(0.006, DOOR_H, DOOR_W), MAT.paint('#2b2d2a', { spec: 0.02, steps: 2, shadowAmt: 1 }), { pos: [X1 + 0.02, FY + DOOR_H / 2, DOOR_Z], cast: false, receive: false }));

  /* ---------- 柱（構造鉄骨 2 本） ---------- */
  for (const x of [-2.1, 2.1]) {
    const col = grp('column', { pos: [x, 0, Z0 + 0.42] });
    col.add(mesh(box(0.24, wallH, 0.24), MAT.paint('#d6cfc0', { spec: 0.1, shadowAmt: 0.7, steps: 2 }), { pos: [0, FY + wallH / 2, 0], cast: true, receive: true }));
    // 柱のサイディング目地・下部アルミ・棚金物のビス穴
    for (let i = 0; i < 4; i++) col.add(mesh(box(0.25, 0.008, 0.25), steelMat, { pos: [0, FY + 0.5 + i * 0.62, 0], cast: false }));
    col.add(mesh(box(0.27, 0.1, 0.27), MAT.paint('#d8d2c4', { spec: 0.14 }), { pos: [0, FY + 0.05, 0], cast: true, receive: true }));
    weather(col, { w: 0.24, h: 1.4, pos: [0.126, FY + 0.9, 0], rot: [0, Math.PI / 2, 0], kind: 'scratch', color: '#b8b2a4', opacity: 0.34, seed: seed + x * 100, density: 1.4 });
    g.add(col);
  }

  /* ---------- 壁面の取り合い・配管・表示 ---------- */
  // 北壁上部のダクトと電灯配管
  for (const [dz, r] of [[-0.26, 0.055], [-0.4, 0.032]]) {
    g.add(mesh(cyl(0.09, 0.09, X1 - X0 - 1.2, 12), MAT.galvanized({ spec: 0.3 }), { pos: [0, FY + wallH - 0.22, Z0 - dz], rot: [0, 0, Math.PI / 2], cast: true, receive: true }));
    for (let i = 0; i < 5; i++) {
      g.add(mesh(box(0.05, 0.05, 0.2), steelMat, { pos: [-3.4 + i * 1.7, FY + wallH - 0.22, Z0 - dz + 0.11], cast: false }));
    }
  }
  // 壁面表示（店内ルール・禁煙・春のポスター）
  const posters = [
    { t: '店内禁煙', x: X0 + 0.03, y: 1.72, z: 0.6, ry: 90, w: 0.42, h: 0.3 },
    { t: 'お買い物マナー', x: X0 + 0.03, y: 1.66, z: -1.6, ry: 90, w: 0.44, h: 0.3 },
    { t: '春の味覚', x: 0.9, y: 1.9, z: Z0 + 0.03, ry: 0, w: 0.5, h: 0.36 },
    { t: '防犯カメラ作動中', x: X1 - 0.03, y: 1.86, z: 1.2, ry: -90, w: 0.4, h: 0.22 },
  ];
  for (const p of posters) {
    decal(g, {
      map: TEX.poster({ title: p.t, bg: '#f7f1e2', accent: '#d9534f', seed: seed + Math.round(p.y * 100) }),
      w: p.w,
      h: p.h,
      pos: [p.x, p.y, p.z],
      rot: [0, (p.ry * Math.PI) / 180, 0],
      opacity: 0.98,
    });
  }
  // 壁の経年：角欠け・水染み・テープ残り
  for (let i = 0; i < 7; i++) {
    weather(g, {
      w: range(rnd, 0.3, 1.1),
      h: range(rnd, 0.4, 1.3),
      pos: [i % 2 ? X0 + 0.02 : X1 - 0.02, range(rnd, 0.5, 2.3), range(rnd, Z0 + 0.4, Z1 - 0.4)],
      rot: [0, i % 2 ? Math.PI / 2 : -Math.PI / 2, 0],
      kind: i % 2 ? 'dirt' : 'chip',
      color: i % 2 ? '#7a7365' : '#cfc8b8',
      opacity: range(rnd, 0.12, 0.26),
      seed: seed + 90 + i,
      density: 1.1,
    });
  }

  return finish(g, { outline: 'thin', minSize: 0.1 });
}

export { build, build as default, meta };
