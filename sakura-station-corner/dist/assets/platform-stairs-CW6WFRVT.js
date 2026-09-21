import { g as grp, M as MAT, J as shape, K as extrude, m as mesh, k as tubeOf, b as box, n as range, r as rbox, h as decal, P as PAL, T as TEX, E as inst, x as PlaneGeometry, c as cyl, w as weather, a as sph, q as finish, N as makeCanvas, Q as toTexture, O as jpText, z as rand } from './index-Dv-C_8Uh.js';

//  assets/station/platform-stairs.js —— ホーム端の階段（5 段・手すり・滑り止め・矢印・段差灯・車椅子スロープ）
//  ---------------------------------------------------------------------------
//  原点 = 地面（ホーム下側の地盤 y=0）接触中心 / +Y 上 / **下り方向を +Z** とする。
//  ホーム天（+0.72）に接するので、装配層では
//    group.position = [ 階段中心x, 0, ホーム南端z + 奥行/2 ]
//  のように「上端がホーム端面に来る」よう置く。LAYOUT では x∈[−0.2,1.4], z=−9.4 の開口部。
//  build({ steps = 5, width = 1.6, rise = 0.72, seed })

const meta = {
  id: 'platform-stairs',
  real: [2.70, 1.88, 2.86],
  origin: 'ground-center, down direction = +Z',
};
const DEFAULT_OPTIONS = { steps: 5, width: 1.6, rise: 0.72, seed: 6701 };

const D2R = Math.PI / 180;

/** 矢印・注意の表示テクスチャ（段に貼る黄帯） */
function arrowTex(dir = 1) {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#f0d35a';
  const cx = w / 2, cy = h / 2, s = h * 0.34;
  g.beginPath();
  g.moveTo(cx - s * 1.5 * dir, cy - s * 0.34);
  g.lineTo(cx + s * 0.2 * dir, cy - s * 0.34);
  g.lineTo(cx + s * 0.2 * dir, cy - s * 0.9);
  g.lineTo(cx + s * 1.6 * dir, cy);
  g.lineTo(cx + s * 0.2 * dir, cy + s * 0.9);
  g.lineTo(cx + s * 0.2 * dir, cy + s * 0.34);
  g.lineTo(cx - s * 1.5 * dir, cy + s * 0.34);
  g.closePath(); g.fill();
  g.globalAlpha = 0.35;
  for (let i = 0; i < 500; i++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#7a6c3a'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2); }
  return toTexture(cv, { repeat: 1 });
}
/** のぼり／くだりの小さな標識 */
function signTex(jp, en) {
  const cv = makeCanvas(512, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = '#f5f2e4'; g.fillRect(0, 0, w, h);
  g.fillStyle = PAL.signBlue; g.fillRect(0, 0, w, h * 0.3);
  jpText(g, jp, { x: w / 2, y: h * 0.62, size: h * 0.34, color: '#39434c', weight: 800, spacing: 8 });
  jpText(g, en, { x: w / 2, y: h * 0.16, size: h * 0.14, color: '#f4f2e6', weight: 700, spacing: 5 });
  g.globalAlpha = 0.2;
  for (let i = 0; i < 600; i++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#6a6353'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 2); }
  return toTexture(cv, { repeat: 1 });
}

function build(options = {}) {
  const steps = Math.max(3, Math.round(options.steps ?? 5));
  const width = options.width ?? 1.6;
  const rise = options.rise ?? 0.72;
  const seed = options.seed ?? 6701;
  const rnd = rand(seed);

  const R = rise / steps;               // 段立 0.144
  const TD = 0.285;                     // 段踏
  const run = (steps - 1) * TD;         // 段の転び幅（上端はホーム面）
  const zBack = -(run / 2 + 0.24);      // ホーム側（上端）
  const zFront = run / 2 + 0.34;        // 下り先端
  const g = grp('platform-stairs');

  /* 材質 */
  const mConc = MAT.concrete({ base: '#c6c0b3', repeat: 1, joints: 2, cracked: true });
  const mConcSide = MAT.concrete({ base: '#b3ada0', repeat: 1, cracked: true });
  const mTread = MAT.stone({ color: '#b6b0a2' });
  const mNosing = MAT.metalPaint('#7c8279', { worn: 1.2, base: '#a3a9a0', uv: { repeat: [0.4, 1.2] } });
  const mSteel = MAT.metal('#a5a8a3', { worn: 0.95, uv: { repeat: [0.4, 0.4] } });
  const mIron = MAT.darkIron({ worn: 1.3, uv: { repeat: [0.5, 0.5] } });
  const mAlu = MAT.metal('#c0c4c6', { worn: 0.6, dir: 'h', spec: 0.7, uv: { repeat: [0.3, 1.1] } });
  const mRubber = MAT.rubber('#3a3d3a', { steps: 2 });
  const mLens = MAT.lampShade({ color: '#f6ecc8', emissive: '#ffd782', emissiveIntensity: 0.85, steps: 2 });

  /* ══════════════════════════════════════════ 段本体（刻んだ断面を押し出し） */
  const body = grp('stair-body');
  g.add(body);
  const prof = shape((s) => {
    s.moveTo(zBack, -0.06);
    s.lineTo(zBack, rise);
    for (let i = 0; i < steps; i++) {
      const zTop = zBack + 0.02 + i * TD;
      const y = rise - i * R;
      s.lineTo(zTop, y);
      s.lineTo(zTop, y - R);
    }
    s.lineTo(zFront, 0);
    s.lineTo(zFront, -0.06);
    s.closePath();
  });
  const geo = extrude(prof, { depth: width, bevelEnabled: false, curveSegments: 3, steps: 1 });
  geo.translate(0, 0, -width / 2);
  const flight = mesh(geo, mConc, { rot: [0, 90 * D2R, 0], name: 'flight' });
  body.add(flight);
  // 側壁（袖壁：上から下へ下る控え壁）
  for (const sx of [-1, 1]) {
    const sw = shape((s) => {
      s.moveTo(zBack, -0.06); s.lineTo(zBack, rise + 0.26);
      s.lineTo(zBack + 0.5, rise + 0.06);
      for (let i = 0; i < steps; i++) {
        const zTop = zBack + 0.02 + i * TD;
        const y = rise - i * R;
        s.lineTo(zTop + 0.06, y - 0.06);
      }
      s.lineTo(zFront + 0.02, -0.02); s.lineTo(zFront + 0.02, -0.06);
      s.closePath();
    });
    const sg = extrude(sw, { depth: 0.14, bevelEnabled: false, curveSegments: 2, steps: 1 });
    sg.translate(0, 0, -0.07);
    const wall = mesh(sg, mConcSide, { pos: [sx * (width / 2 + 0.07), 0, 0], rot: [0, 90 * D2R, 0], name: `side-wall-${sx}` });
    body.add(wall);
    // 袖壁の笠（木製・日焼け）：勾配に沿って角材を一本
    body.add(mesh(tubeOf([[sx * (width / 2 + 0.07), rise + 0.3, zBack - 0.02], [sx * (width / 2 + 0.07), 0.06, zFront + 0.02]], 0.062, 8, 4), MAT.wood({ light: '#9b7a52', dark: '#5f4a30', uv: { repeat: [0.5, 0.9] } }), { name: 'wall-cap' }));
  }

  /* ══════════════════════════════════════════ 段の表面（石張り・金物・滑り止め・矢印・段差灯） */
  for (let i = 0; i < steps; i++) {
    const zTop = zBack + 0.02 + i * TD;
    const y = rise - i * R;
    const st = grp(`step-${i}`, { pos: [0, y - 0.014, zTop + TD / 2 - 0.02] });
    body.add(st);
    // 踏面（石板）
    st.add(mesh(box(width - 0.02, 0.026, TD - 0.02), mTread, { pos: [0, 0.006, 0], name: 'tread-stone' }));
    // 段鼻（金属アングル・少し摩耗）
    st.add(mesh(box(width - 0.01, 0.026, 0.028), mNosing, { pos: [0, 0.008, -0.11249999999999999], name: 'nosing' }));
    st.add(mesh(box(width - 0.01, 0.012, 0.05), mNosing, { pos: [0, -8e-3, -0.12249999999999998], cast: false }));
    // 滑り止め（ゴム縞 3 本）
    for (let k = 0; k < 3; k++) st.add(mesh(box(width - 0.1, 0.005, 0.016), mRubber, { pos: [0, 0.021, -TD / 2 + 0.06 + k * 0.055], cast: false }));
    // 側面の打痕・欠け
    if (i % 2 === 0) st.add(mesh(rbox(0.05, 0.012, 0.04, 0.006, 2), MAT.stone({ color: '#d5cfc0' }), { pos: [range(rnd, -0.5, 0.5), 0.006, range(rnd, -0.06, 0.06)], cast: false }));
    // 段差灯（上 3 段の段鼻下）
    if (i < 3) {
      for (const sx of [-1, 1]) {
        const lg = grp(`step-lamp-${i}-${sx}`, { pos: [sx * (width / 2 - 0.24), -0.036, -0.12249999999999998] });
        lg.userData.breathe = { speed: 0.4 + i * 0.04, amount: 0.1, phase: (i * 2.1 + (sx + 1)) % 6.28 };
        lg.add(mesh(rbox(0.1, 0.03, 0.04, 0.008, 2), mSteel, { name: 'lamp-frame' }));
        lg.add(mesh(box(0.072, 0.008, 0.026), mLens, { pos: [0, -0.016, 0], cast: false, name: 'lamp-lens' }));
        st.add(lg);
      }
    }
    // 矢印（上から 2 段目に「くだり」矢印、最上段にのぼり矢印）
    if (i === 0 || i === 1) {
      decal(st, { map: arrowTex(i === 0 ? -1 : 1), w: 0.34, h: 0.17, pos: [i === 0 ? -0.36 : 0.36, 0.0215, 0.01], rot: [-Math.PI / 2, 0, 0], opacity: 0.85, order: 2 });
    }
    // 黄帯（1 段目の端）
    if (i === 0) st.add(mesh(box(width - 0.04, 0.006, 0.09), MAT.marking(PAL.markingYellow, { repeat: 1 }), { pos: [0, 0.022, TD / 2 - 0.09], cast: false }));
  }
  // 地面際の最後段の周りに土砂・落ち葉
  {
    const leafTex = TEX.leafCluster({ base: '#9b8455', seed: seed + 3 });
    const leafMat = MAT.leaf({ map: leafTex, alphaMap: leafTex, alphaTest: 0.34 });
    g.add(inst(new PlaneGeometry(0.06, 0.06), leafMat, 22, (i, d, r) => {
      d.position.set((r() - 0.5) * (width + 0.6), 0.006 + r() * 0.006, zFront - 0.1 + r() * 0.5);
      d.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6.283);
      d.scale.setScalar(0.65 + r() * 0.7);
    }, { name: 'leaves', cast: false, receive: true }));
  }

  /* ══════════════════════════════════════════ 手すり（両側・二段・笠木は木） */
  for (const sx of [-1, 1]) {
    const hr = grp(`handrail-${sx > 0 ? 'e' : 'w'}`, { pos: [sx * (width / 2 + 0.06), 0, 0] });
    g.add(hr);
    const nPost = 3;
    const slope = Math.atan2(rise, run + 0.4);
    for (let i = 0; i < nPost; i++) {
      const t = i / (nPost - 1);
      const z = zBack + 0.2 + t * (run + 0.5);
      const yTop = rise - t * rise * 0.92;
      const hgt = 0.95;
      hr.add(mesh(cyl(0.022, 0.026, hgt, 10), mSteel, { pos: [0, yTop + hgt / 2 - 0.04, z], name: 'hr-post' }));
      // 柱脚（ベースプレート + アンカー 2 本）
      hr.add(mesh(box(0.09, 0.014, 0.09), mIron, { pos: [0, yTop - 0.03, z], cast: false }));
      for (const [ox, oz] of [[-0.03, -0.03], [0.03, 0.03]]) {
        hr.add(mesh(cyl(0.008, 0.009, 0.03, 6), mSteel, { pos: [ox, yTop - 0.012, z + oz], cast: false }));
      }
      weather(hr, { w: 0.06, h: 0.28, pos: [0.024, yTop + 0.24, z], kind: 'rust', color: '#7d4a2c', opacity: 0.55, seed: seed + i * 7 + (sx + 1) * 31, density: 1.7, spread: 0.03 });
    }
    // 笠木（木製・角材）と中桟（鋼管）— 勾配に沿って 2 点結ぶ
    const rz = (i) => zBack + 0.16 + i * ((run + 0.6) / 2);
    const ry = (i) => rise - i * ((run + 0.6) / 2) * Math.tan(slope) + 0.93;
    const mk = (off, thick, mat, seg) => hr.add(mesh(tubeOf([[0, ry(0) + off, rz(0)], [0, ry(1) + off, rz(1)], [0, ry(2) + off, rz(2)]], thick, 10, seg), mat, { name: seg === 4 ? 'top-rail' : 'mid-rail' }));
    mk(0, 0.03, MAT.wood({ light: '#a07c52', dark: '#664c30', uv: { repeat: [0.55, 1.2] } }), 4);
    mk(-0.28, 0.014, mSteel, 8);
    mk(-0.56, 0.014, mSteel, 8);
    // 端部の袖（垂直に落ちるアーム）
    for (const t of [0, 1]) {
      const z = t ? zFront - 0.05 : zBack + 0.2;
      const yTop = t ? rise * 0.06 : rise + 0.02;
      hr.add(mesh(cyl(0.014, 0.014, 0.36, 8), mSteel, { pos: [0, yTop + 0.72 + 0.18, z], rot: [0, 0, 0] }));
    }
  }
  // 手すりに取り付けた標識（くだり／のぼり）
  {
    const sg = grp('direction-sign', { pos: [-(width / 2 + 0.06) - 0.035, rise + 0.66, zBack + 0.55], rot: [0, -90 * D2R, -4 * D2R] });
    sg.add(mesh(rbox(0.3, 0.16, 0.012, 0.006, 2), MAT.paint('#f5f2e4', { steps: 3, spec: 0.12 }), { name: 'sign-plate' }));
    decal(sg, { map: signTex('くだり', 'DOWN'), w: 0.28, h: 0.14, pos: [0, 0, 0.008], order: 1 });
    decal(sg, { map: signTex('のぼり', 'UP'), w: 0.28, h: 0.14, pos: [0, 0, -8e-3], rot: [0, Math.PI, 0], order: 1 });
    g.add(sg);
  }

  /* ══════════════════════════════════════════ 車椅子スロープ（仮設アルミ・段の端に立て掛け） */
  {
    const ramp = grp('wheelchair-ramp');
    g.add(ramp);
    const dropY = rise + 0.02;
    const footZ = zFront + 1.02;
    const topZ = zBack + 0.34;
    const ang = Math.atan2(dropY, footZ - topZ);
    const len = Math.hypot(dropY, footZ - topZ);
    ramp.position.set(width / 2 + 0.52, 0, (topZ + footZ) / 2);
    for (let k = 0; k < 2; k++) {
      const tx = (k - 0.5) * 0.34;
      const tr = grp(`ramp-track-${k}`, { pos: [tx, dropY / 2, 0], rot: [-ang, 0, 0] });
      tr.add(mesh(rbox(0.28, 0.028, len, 0.008, 2), mAlu, { name: 'ramp-deck' }));
      // 立ち上がりサイドリップ
      for (const sx of [-1, 1]) tr.add(mesh(box(0.02, 0.05, len), mAlu, { pos: [sx * 0.145, 0.03, 0], cast: false }));
      // 滑り止め縞
      for (let i = 0; i < 14; i++) tr.add(mesh(box(0.26, 0.006, 0.018), mIron, { pos: [0, 0.017, -len / 2 + 0.12 + i * (len / 15)], cast: false }));
      // 段差への噛み合い（上端のフック）
      tr.add(mesh(box(0.26, 0.05, 0.03), mAlu, { pos: [0, 0.04, len / 2 - 0.02], rot: [40 * D2R, 0, 0], cast: false }));
      tr.add(mesh(box(0.28, 0.014, 0.1), mRubber, { pos: [0, -0.02, -len / 2 + 0.06], cast: false }));
      ramp.add(tr);
    }
    // 手すりの代わりにロープ（支柱 2 本 + 張線）
    for (const t of [0, 1]) {
      const z = t ? len * 0.36 : -len * 0.42;
      const y = dropY / 2 - t * dropY * 0.42 + (t ? 0.1 : -0.1);
      ramp.add(mesh(cyl(0.014, 0.014, 0.5, 8), mSteel, { pos: [0, y + 0.2, z] }));
    }
    ramp.add(mesh(tubeOf([[0, rise * 0.42, len * 0.36], [0, rise * 0.62, 0], [0, rise * 0.86, -len * 0.42]], 0.008, 12, 5), MAT.fabric({ color: '#c9b98a', repeat: 6 })));
    // 車椅子マークの小さな札
    {
      const c = grp('ramp-mark', { pos: [-0.2, rise * 0.52, len * 0.3], rot: [0, -90 * D2R, 0] });
      c.add(mesh(rbox(0.16, 0.16, 0.01, 0.006, 2), MAT.paint(PAL.trainStripe, { steps: 2, spec: 0.14 }), { name: 'mark-plate' }));
      decal(c, { map: TEX.signboard({ text: '车椅子', bg: PAL.trainStripe, fg: '#f4f2e8', ar: 1 }), w: 0.13, h: 0.13, pos: [0, 0, 0.007], order: 1 });
      ramp.add(c);
    }
    // 擦り傷・錆・土ぼこり
    weather(ramp, { w: 0.5, h: 0.2, pos: [0, rise * 0.2, -len * 0.3], kind: 'dirt', color: '#7d7461', opacity: 0.45, seed: seed + 61, density: 1.6, spread: 0.04 });
    weather(ramp, { w: 0.2, h: 0.3, pos: [0.34, rise * 0.5, 0.1], kind: 'scratch', color: '#e5e7e6', opacity: 0.35, seed: seed + 62, density: 1.4, spread: 0.05 });
  }

  /* ══════════════════════════════════════════ 経年：コンクリートの欠け・苔・補修・ガム */
  weather(body, { w: 0.5, h: 0.3, pos: [-width / 2 + 0.2, rise * 0.4, zBack + 0.3], rot: [0, 90 * D2R, 0], kind: 'chip', color: '#ddd7c7', opacity: 0.5, seed: seed + 71, density: 1.8, spread: 0.05 });
  weather(body, { w: 0.4, h: 0.5, pos: [width / 2 - 0.1, rise * 0.3, zFront - 0.2], rot: [0, -90 * D2R, 0], kind: 'moss', color: PAL.moss, opacity: 0.45, seed: seed + 72, density: 1.6, spread: 0.06 });
  weather(body, { w: 0.9, h: 0.3, pos: [0, -0.045, 0.2], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6f6653', opacity: 0.4, seed: seed + 73, density: 1.6, spread: 0.04 });
  // 補修モルタル（色だけ違うパテ）
  for (let i = 0; i < 3; i++) {
    body.add(mesh(rbox(range(rnd, 0.16, 0.4), 0.01, range(rnd, 0.1, 0.24), 0.04, 2), MAT.concrete({ base: '#ddd8ca', repeat: 1 }), {
      pos: [range(rnd, -width / 2 + 0.2, width / 2 - 0.2), -0.05 + 0.012, range(rnd, zBack + 0.4, zFront - 0.2)], rot: [0, range(rnd, -0.4, 0.4), 0], cast: false,
    }));
  }
  // 段の角に噛んだガム・吸い殻
  for (let i = 0; i < 5; i++) {
    body.add(mesh(sph(range(rnd, 0.007, 0.013), 6, 5), MAT.hardPlastic('#e2dcc8', { repeat: 4, steps: 2 }), {
      pos: [range(rnd, -0.7, 0.7), rise - i * R * 0.9 + 0.02, zBack + 0.1 + i * TD], scale: [1, 0.4, 1], cast: false,
    }));
  }
  body.add(mesh(cyl(0.0045, 0.0045, 0.032, 7), MAT.paper({ color: '#e6e0ca' }), { pos: [0.52, 0.02, zFront - 0.16], rot: [Math.PI / 2, 0, 0.7], cast: false }));
  body.add(mesh(cyl(0.0046, 0.0046, 0.009, 7), MAT.paint('#b5563f', { steps: 2 }), { pos: [0.52 + 0.016, 0.024, zFront - 0.165], rot: [Math.PI / 2, 0, 0.7], cast: false }));

  return finish(g, { outline: 'normal', minSize: 0.05 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
