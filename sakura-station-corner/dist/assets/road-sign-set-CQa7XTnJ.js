import { P as PAL, g as grp, m as mesh, M as MAT, r as rbox, c as cyl, w as weather, b as box, s as shade, K as extrude, N as makeCanvas, Q as toTexture, ap as FrontSide, H as plane, D as DoubleSide, aq as ShapeGeometry, J as shape, h as decal, T as TEX, ah as ConeGeometry, p as shadowBlob, q as finish, O as jpText, z as rand, a6 as rr } from './index-ROCNX270.js';

//  assets/street/road-sign-set.js —— 道路標識群（一時停止・注意信号・速度制限・自転車専用・駐停車禁止・踏切注意・儿童注意・一方通行）
//  Each kind is its OWN geometry (octagon / diamond / triangle / circle / rectangle extrusion) —
//  板 face は TEX 風の自作 canvas（日本語文字・図記）で描き、反射材の退色／剥がれ／角の凹み／貼紙剥がし跡を盛る。

const meta = {
  id: 'road-sign-set',
  real: [0.5, 2.16, 0.1],          // kind により変わる（sizeOf() を参照）
  origin: 'ground-center',
};
const DEFAULT_OPTIONS = { kind: 'stop', seed: 21 };

const D2R = Math.PI / 180;

/* ------------------------------- 標板形状 ------------------------------- */
function polyShape(n, r, rot = 0) {
  return shape((s) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
    }
    s.closePath();
  });
}
function circleShape(r) {
  return shape((s) => s.absarc(0, 0, r, 0, Math.PI * 2, false));
}
function rectShape(w, h, r = 0.02) {
  return shape((s) => {
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  });
}
/** 三角形（注意標識：頂点上・丸打ち角） */
function triShape(side) {
  const h = (side * Math.sqrt(3)) / 2;
  const p = [[0, h * 0.62], [-side / 2, -h * 0.38], [side / 2, -h * 0.38]];
  return shape((s) => {
    const r = side * 0.075;
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = p[i], [bx, by] = p[(i + 1) % 3];
      const d = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / d, uy = (by - ay) / d;
      const p0x = ax + ux * r, p0y = ay + uy * r;
      i === 0 ? s.moveTo(p0x, p0y) : s.lineTo(p0x, p0y);
      s.lineTo(bx - ux * r, by - uy * r);
      s.quadraticCurveTo(bx, by, bx - uy * r * 0.9, by + ux * r * 0.9);
    }
  });
}

/* ------------------------------- 図記画法 ------------------------------- */
function drawSignalGlyph(g, cx, cy, s) {
  g.fillStyle = '#2b2b2b';
  rr(g, cx - s * 0.34, cy - s * 0.62, s * 0.68, s * 1.24, s * 0.14); g.fill();
  g.fillStyle = '#f2efe4';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, cy - s * 0.38 + i * s * 0.38, s * 0.14, 0, 7); g.fill(); }
  // 地面線
  g.fillStyle = '#2b2b2b'; g.fillRect(cx - s * 0.7, cy + s * 0.72, s * 1.4, s * 0.1);
}
function drawBikeGlyph(g, cx, cy, s, color = '#f4f2ea') {
  g.strokeStyle = color; g.lineWidth = s * 0.09; g.lineCap = 'round';
  for (const dx of [-0.36, 0.36]) { g.beginPath(); g.arc(cx + dx * s, cy + 0.3 * s, 0.28 * s, 0, 7); g.stroke(); }
  g.beginPath();
  g.moveTo(cx - 0.36 * s, cy + 0.3 * s); g.lineTo(cx - 0.1 * s, cy - 0.18 * s); g.lineTo(cx + 0.22 * s, cy - 0.18 * s);
  g.lineTo(cx + 0.36 * s, cy + 0.3 * s); g.moveTo(cx - 0.1 * s, cy - 0.18 * s); g.lineTo(cx + 0.05 * s, cy + 0.3 * s);
  g.moveTo(cx + 0.22 * s, cy - 0.18 * s); g.lineTo(cx + 0.14 * s, cy - 0.42 * s);
  g.stroke();
  g.beginPath(); g.moveTo(cx + 0.02 * s, cy - 0.44 * s); g.lineTo(cx + 0.24 * s, cy - 0.44 * s); g.stroke();
}
function drawTrainGlyph(g, cx, cy, s, color = '#3a3630') {
  g.fillStyle = color;
  rr(g, cx - 0.34 * s, cy - 0.5 * s, 0.68 * s, 0.86 * s, 0.12 * s); g.fill();
  g.fillStyle = '#efeadd';
  g.fillRect(cx - 0.24 * s, cy - 0.4 * s, 0.48 * s, 0.2 * s);
  g.fillStyle = color;
  g.beginPath(); g.arc(cx - 0.16 * s, cy + 0.2 * s, 0.07 * s, 0, 7); g.fill();
  g.beginPath(); g.arc(cx + 0.16 * s, cy + 0.2 * s, 0.07 * s, 0, 7); g.fill();
  // 踏切の枠（X 型と柱）
  g.strokeStyle = color; g.lineWidth = s * 0.07;
  g.beginPath();
  g.moveTo(cx - 0.62 * s, cy - 0.34 * s); g.lineTo(cx - 0.4 * s, cy - 0.34 * s);
  g.moveTo(cx + 0.4 * s, cy - 0.34 * s); g.lineTo(cx + 0.62 * s, cy - 0.34 * s);
  g.moveTo(cx - 0.52 * s, cy - 0.5 * s); g.lineTo(cx - 0.52 * s, cy + 0.42 * s);
  g.moveTo(cx + 0.52 * s, cy - 0.5 * s); g.lineTo(cx + 0.52 * s, cy + 0.42 * s);
  g.stroke();
}
function drawKidsGlyph(g, cx, cy, s, color = '#3a3630') {
  g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round';
  const kid = (ox, h, stride) => {
    g.beginPath(); g.arc(cx + ox, cy - h * 0.42, h * 0.15, 0, 7); g.fill();
    g.lineWidth = h * 0.13;
    g.beginPath(); g.moveTo(cx + ox, cy - h * 0.27); g.lineTo(cx + ox, cy + h * 0.06); g.stroke();
    g.beginPath(); g.moveTo(cx + ox, cy - h * 0.16); g.lineTo(cx + ox + stride * h * 0.2, cy - h * 0.02);
    g.lineTo(cx + ox - stride * h * 0.16, cy + 0.1 * h); g.stroke();
    g.beginPath(); g.moveTo(cx + ox, cy - h * 0.16); g.lineTo(cx + ox - stride * h * 0.22, cy - h * 0.04); g.stroke();
  };
  kid(-s * 0.24, s * 0.86, 1);
  kid(s * 0.28, s * 0.66, -1);
}
/* ------------------------------- 標識定義 ------------------------------- */
const SIGNS = {
  stop: {
    label: '一時停止', plate: PAL.storeBand3, aspect: 1, size: 0.46, postH: 1.62,
    geo: () => ({ sh: polyShape(8, 0.23, Math.PI / 8), w: 0.46, h: 0.46 }),
    face(g, w, h, rnd) {
      g.fillStyle = PAL.storeBand3; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#f6f2e8'; g.lineWidth = w * 0.055;
      octStroke(g, w / 2, h / 2, w * 0.42, Math.PI / 8); g.stroke();
      g.globalAlpha = 0.18; g.fillStyle = '#000'; g.fillRect(0, 0, w, h * 0.18); g.globalAlpha = 1;
      jpText(g, '停', { x: w / 2, y: h * 0.37, size: h * 0.21, color: '#f8f5ec', weight: 900 });
      jpText(g, '止', { x: w / 2, y: h * 0.63, size: h * 0.21, color: '#f8f5ec', weight: 900 });
      fadeWear(g, w, h, rnd);
    },
  },
  signal: {
    label: '注意信号', plate: '#e6c34a', aspect: 1, size: 0.48, postH: 1.72,
    geo: () => ({ sh: polyShape(4, 0.24, 0), w: 0.48, h: 0.48 }),
    face(g, w, h, rnd) {
      g.fillStyle = '#e8c64d'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#3a352c'; g.lineWidth = w * 0.045;
      diamondStroke(g, w / 2, h / 2, w * 0.44); g.stroke();
      drawSignalGlyph(g, w / 2, h / 2, h * 0.32);
      fadeWear(g, w, h, rnd);
    },
  },
  speed30: {
    label: '速度制限 30', plate: '#f2efe6', aspect: 1, size: 0.5, postH: 1.86,
    geo: () => ({ sh: circleShape(0.25), w: 0.5, h: 0.5 }),
    face(g, w, h, rnd) {
      g.fillStyle = '#f4f1e7'; g.fillRect(0, 0, w, h);
      g.strokeStyle = PAL.storeBand3; g.lineWidth = w * 0.075;
      g.beginPath(); g.arc(w / 2, h / 2, w * 0.44, 0, 7); g.stroke();
      jpText(g, '30', { x: w / 2, y: h * 0.53, size: h * 0.4, color: '#2f2c27', weight: 900 });
      fadeWear(g, w, h, rnd);
    },
  },
  'bicycle-only': {
    label: '自転車専用', plate: PAL.signBlue, aspect: 1, size: 0.46, postH: 1.72,
    geo: () => ({ sh: circleShape(0.23), w: 0.46, h: 0.46 }),
    face(g, w, h, rnd) {
      g.fillStyle = PAL.signBlue; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#f2efe4'; g.lineWidth = w * 0.04;
      g.beginPath(); g.arc(w / 2, h / 2, w * 0.45, 0, 7); g.stroke();
      drawBikeGlyph(g, w / 2, h * 0.46, h * 0.5);
      jpText(g, '専用', { x: w / 2, y: h * 0.87, size: h * 0.12, color: '#f2efe4', weight: 800 });
      fadeWear(g, w, h, rnd);
    },
  },
  'no-parking': {
    label: '駐停車禁止', plate: PAL.signBlue, aspect: 1, size: 0.46, postH: 1.66,
    geo: () => ({ sh: circleShape(0.23), w: 0.46, h: 0.46 }),
    face(g, w, h, rnd) {
      g.fillStyle = PAL.signBlue; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#f2efe4'; g.lineWidth = w * 0.035;
      g.beginPath(); g.arc(w / 2, h / 2, w * 0.455, 0, 7); g.stroke();
      g.strokeStyle = PAL.storeBand3; g.lineWidth = w * 0.085;
      g.beginPath(); g.arc(w / 2, h / 2, w * 0.4, 0, 7); g.stroke();
      g.lineWidth = w * 0.075; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(w * 0.24, h * 0.24); g.lineTo(w * 0.76, h * 0.76);
      g.moveTo(w * 0.76, h * 0.24); g.lineTo(w * 0.24, h * 0.76);
      g.stroke();
      fadeWear(g, w, h, rnd);
    },
  },
  crossing: {
    label: '踏切注意', plate: '#e8d34a', aspect: 0.92, size: 0.62, postH: 1.8,
    geo: () => ({ sh: triShape(0.62), w: 0.62, h: 0.57 }),
    face(g, w, h, rnd) {
      g.fillStyle = '#ead755'; g.fillRect(0, 0, w, h);
      g.strokeStyle = PAL.storeBand3; g.lineWidth = w * 0.06; g.lineJoin = 'round';
      triStroke(g, w, h, 0.1); g.stroke();
      drawTrainGlyph(g, w / 2, h * 0.56, h * 0.42);
      fadeWear(g, w, h, rnd);
    },
  },
  children: {
    label: '儿童注意', plate: '#e8b84a', aspect: 0.92, size: 0.62, postH: 1.8,
    geo: () => ({ sh: triShape(0.62), w: 0.62, h: 0.57 }),
    face(g, w, h, rnd) {
      g.fillStyle = '#eccb63'; g.fillRect(0, 0, w, h);
      g.strokeStyle = PAL.storeBand3; g.lineWidth = w * 0.06; g.lineJoin = 'round';
      triStroke(g, w, h, 0.1); g.stroke();
      drawKidsGlyph(g, w / 2, h * 0.58, h * 0.46);
      fadeWear(g, w, h, rnd);
    },
  },
  'one-way': {
    label: '一方通行', plate: PAL.signBlue, aspect: 0.55, size: 0.58, postH: 1.94,
    geo: () => ({ sh: rectShape(0.58, 0.32, 0.018), w: 0.58, h: 0.32 }),
    face(g, w, h, rnd) {
      g.fillStyle = PAL.signBlue; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#f2efe4'; g.lineWidth = w * 0.018;
      g.strokeRect(w * 0.03, h * 0.06, w * 0.94, h * 0.88);
      // 矢印（左 44 %）＋ 文字（右 52 %）
      g.fillStyle = '#f5f2e8';
      g.beginPath();
      g.moveTo(w * 0.44, h * 0.5);
      g.lineTo(w * 0.28, h * 0.16); g.lineTo(w * 0.28, h * 0.36);
      g.lineTo(w * 0.06, h * 0.36); g.lineTo(w * 0.06, h * 0.64);
      g.lineTo(w * 0.28, h * 0.64); g.lineTo(w * 0.28, h * 0.84);
      g.closePath(); g.fill();
      jpText(g, '一方通行', { x: w * 0.71, y: h * 0.5, size: h * 0.26, color: '#f5f2e8', weight: 900, spacing: 1 });
      fadeWear(g, w, h, rnd);
    },
  },
  'end-of-speed': {
    label: '速度制限解除', plate: '#f2efe6', aspect: 1, size: 0.5, postH: 1.86,
    geo: () => ({ sh: circleShape(0.25), w: 0.5, h: 0.5 }),
    face(g, w, h, rnd) {
      g.fillStyle = '#efece2'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#8d8f8c'; g.lineWidth = w * 0.05;
      g.beginPath(); g.arc(w / 2, h / 2, w * 0.44, 0, 7); g.stroke();
      g.strokeStyle = '#3a3833'; g.lineWidth = w * 0.055; g.lineCap = 'round';
      g.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = -0.6 + i * 0.42;
        g.moveTo(w / 2 - Math.cos(a) * w * 0.4, h / 2 - Math.sin(a) * h * 0.4);
        g.lineTo(w / 2 + Math.cos(a) * w * 0.4, h / 2 + Math.sin(a) * h * 0.4);
      }
      g.stroke();
      jpText(g, '30', { x: w / 2, y: h * 0.53, size: h * 0.34, color: '#2f2c27', weight: 900 });
      fadeWear(g, w, h, rnd);
    },
  },
};
const SIGN_KINDS = Object.keys(SIGNS);
function sizeOf(kind) {
  const s = SIGNS[kind] || SIGNS.stop;
  const { w, h } = s.geo();
  return [w, s.postH + h / 2 + 0.16, 0.14];
}
meta.real = sizeOf('stop');

/* キャンバス用の枠線パス */
function octStroke(g, cx, cy, r, rot) {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * Math.PI * 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}
function diamondStroke(g, cx, cy, r) {
  g.beginPath();
  g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath();
}
function triStroke(g, w, h, inset) {
  const s = 1 - inset * 2;
  g.beginPath();
  g.moveTo(w / 2, h * inset);
  g.lineTo(w / 2 + (w / 2 - w * inset) * s, h * (1 - inset * 0.8));
  g.lineTo(w / 2 - (w / 2 - w * inset) * s, h * (1 - inset * 0.8));
  g.closePath();
}
/** 反射材の退色（表面全体のかすり＋局所的な剥がれ） */
function fadeWear(g, w, h, rnd) {
  g.globalAlpha = 0.1;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#8d8676';
    const x = rnd() * w, y = rnd() * h, r = w * (0.08 + rnd() * 0.22);
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.globalAlpha = 0.16;
  g.fillStyle = '#e6e0cc';
  g.fillRect(w * 0.62, h * 0.06, w * 0.3, h * 0.14);   // 日焼け帯
  g.globalAlpha = 1;
}

/* ------------------------------- 支柱マテリアル ------------------------------- */
const postMat = () => MAT.metalPaint('#8f9793', { worn: 0.9, repeat: 3, base: '#adb5b1' });
const bandMat = () => MAT.metal('#9aa0a3', { worn: 0.85 });

function build(options = {}) {
  const kind = SIGNS[options.kind] ? options.kind : 'stop';
  const seed = options.seed ?? 21;
  const rnd = rand(seed);
  const S = SIGNS[kind];
  const { sh, w, h } = S.geo();
  const g = grp(`road-sign-${kind}`);
  const pole = postMat();
  const DP = 0.02;                       // 標板厚

  /* ------------------------------ 基礎・支柱 ------------------------------ */
  g.add(mesh(rbox(0.26, 0.07, 0.26, 0.012, 2), MAT.concrete({ base: PAL.concreteDark, repeat: 2, cracked: true }), { pos: [0, 0.028, 0] }));
  g.add(mesh(cyl(0.075, 0.09, 0.035, 14), MAT.concrete({ base: '#bdb7aa', repeat: 2 }), { pos: [0, 0.075, 0] }));
  // アンカーボルト 2 本＋ナット
  for (const sx of [-0.05, 0.05]) {
    g.add(mesh(cyl(0.009, 0.009, 0.1, 8), MAT.metal('#8b9092'), { pos: [sx, 0.11, 0.03] }));
    g.add(mesh(cyl(0.014, 0.014, 0.014, 6), MAT.metal('#a7acaf', { worn: 0.7 }), { pos: [sx, 0.16, 0.03] }));
    weather(g, { w: 0.03, h: 0.08, pos: [sx + 0.006, 0.12, 0.045], kind: 'rust', color: PAL.rust, opacity: 0.6, seed: seed + 60 + sx * 10, count: 1 });
  }
  // 山形鋼（ハット形）支柱：本体＋折り返しフランジ
  const PH = S.postH + h / 2 + 0.1;
  const pw = 0.056;
  g.add(mesh(box(pw, PH, 0.024), pole, { name: 'sign-post', pos: [0, PH / 2, -0.03] }));
  for (const sx of [-1, 1]) g.add(mesh(box(0.012, PH, 0.05), pole, { pos: [sx * (pw / 2 - 0.006), PH / 2, -0.03 + 0.014] }));
  g.add(mesh(box(pw * 0.9, PH, 0.008), pole, { pos: [0, PH / 2, -0.03 + 0.034] }));
  // 柱キャップ（天端の防水キャップ）
  g.add(mesh(rbox(pw + 0.014, 0.04, 0.062, 0.008, 2), MAT.metal('#7f8a86', { worn: 0.6 }), { pos: [0, PH + 0.018, -0.028] }));
  // 柱の再塗装跡・錆・泥
  weather(g, { w: 0.1, h: 0.5, pos: [0.01, 0.35, 0.005], kind: 'rust', color: '#7d4a2c', opacity: 0.5, seed: seed + 21, density: 1.8, count: 3, spread: 0.16 });
  weather(g, { w: 0.12, h: 0.22, pos: [-5e-3, 0.14, 0.02], kind: 'dirt', color: '#7b7361', opacity: 0.5, seed: seed + 22, count: 2 });
  weather(g, { w: 0.06, h: 0.3, pos: [0.03, PH * 0.62, 0.005], kind: 'chip', color: shade('#8f9793', 1.5), opacity: 0.45, seed: seed + 23, count: 3, spread: 0.22 });

  /* ------------------------------ 標板（押出形状） ------------------------------ */
  const plateY = S.postH + h / 2 + 0.12;
  const plateG = grp('sign-plate', { pos: [0, plateY, 0] });
  const plateGeo = extrude(sh, { depth: DP, bevelEnabled: true, bevelThickness: 0.0035, bevelSize: 0.006, bevelSegments: 2, curveSegments: 18, steps: 1 });
  const bodyMat = MAT.metalPaint(S.plate, { worn: 0.55, repeat: 2, base: shade(S.plate, 1.16) });
  plateG.add(mesh(plateGeo, bodyMat, { name: 'plate', pos: [0, 0, -DP] }));
  // 裏側の補強リブ 2 本（板が一枚板に見えない為に必ず入れる）
  for (const ry of [-h * 0.24, h * 0.24]) {
    plateG.add(mesh(box(w * 0.72, 0.022, 0.018), MAT.metal('#98a09c', { worn: 0.8 }), { pos: [0, ry, -DP - 0.012] }));
    for (const sx of [-1, 1]) plateG.add(mesh(cyl(0.006, 0.006, 0.012, 6), MAT.metal('#b1b6b8'), { pos: [sx * w * 0.3, ry, -DP - 0.006], rot: [90 * D2R, 0, 0] }));
  }
  // 面（反射シート）：板より 4 % 小的な canvas を 3 mm 前に浮かし
  const px = 512;
  const cv = makeCanvas(px, Math.round(px / (w / h)));
  if (cv) S.face(cv.g, cv.w, cv.h, rnd);
  const faceMap = cv ? toTexture(cv, { repeat: 1 }) : null;
  const facePlane = mesh(plane(w * 0.96, h * 0.96), MAT.decal({ map: faceMap, opacity: 1, color: '#ffffff', order: 0, side: FrontSide }), {
    name: 'sign-face', pos: [0, 0, 0.0042], cast: false, receive: false,
  });
  facePlane.userData.noOutline = true;
  plateG.add(facePlane);
  g.add(plateG);

  /* ------------------------------ 取付金具（バンド・ボルト） ------------------------------ */
  const bandN = h > 0.44 ? 3 : 2;
  for (let i = 0; i < bandN; i++) {
    const by = plateY + (i - (bandN - 1) / 2) * (h * 0.28);
    const b = grp('band', { pos: [0, by, -0.03] });
    b.add(mesh(box(w * 0.5, 0.028, 0.078), bandMat(), { pos: [0, 0, 0.012] }));
    b.add(mesh(box(w * 0.5 + 0.01, 0.012, 0.09), MAT.metal('#8d9491', { worn: 0.7 }), { pos: [0, 0.018, 0.012] }));
    for (const sx of [-1, 1]) {
      b.add(mesh(cyl(0.007, 0.007, 0.014, 6), MAT.metal('#b7bcc0'), { pos: [sx * w * 0.22, 0, 0.056], rot: [90 * D2R, 0, 0] }));
    }
    g.add(b);
    weather(g, { w: 0.08, h: 0.03, pos: [w * 0.16, by - 0.022, 0.01], kind: 'rust', color: PAL.rust, opacity: 0.55, seed: seed + 31 + i, count: 1 });
  }

  /* ------------------------------ 経年：反射材剥がれ・角の凹み・貼紙跡 ------------------------------ */
  // 反射材の剥がれ（めくれた三角片＋下地むき出し）
  {
    const cx = w * 0.3, cy = -h * 0.34;
    const peel = mesh(new ShapeGeometry(shape((s) => { s.moveTo(0, 0); s.lineTo(0.09, 0.012); s.lineTo(0.032, 0.075); s.closePath(); }), 8),
      MAT.paint('#cfc9b8', { side: DoubleSide, steps: 2, spec: 0.2, shadowAmt: 0.75 }), { pos: [cx, cy, 0.008], rot: [-0.5, 0.25, 0.6] });
    plateG.add(peel);
    decal(plateG, { map: TEX.wear({ kind: 'chip', color: '#8a8172', seed: seed + 5, density: 2 }), w: 0.1, h: 0.09, pos: [cx + 0.01, cy - 0.01, 0.0046], order: 1 });
    weather(plateG, { w: w * 0.5, h: h * 0.4, pos: [-w * 0.18, h * 0.2, 0.0048], kind: 'scratch', color: '#f3efe2', opacity: 0.28, seed: seed + 6, count: 2 });
  }
  // 角の凹み（めくれた角とは対角側）：浅い円錐を押し当てた見え方＋打痕
  {
    const dx = -w * 0.36, dy = h * 0.3;
    const dent = mesh(new ConeGeometry(0.035, 0.022, 12), MAT.metal(shade(S.plate, 0.78), { worn: 0.6, side: DoubleSide }), { pos: [dx, dy, -4e-3], rot: [Math.PI / 2 + 0.35, 0, 0.5] });
    plateG.add(dent);
    decal(plateG, { map: TEX.wear({ kind: 'dirt', color: '#6d6558', seed: seed + 7, density: 1.6 }), w: 0.07, h: 0.07, pos: [dx, dy, 0.0046], order: 2 });
  }
  // 貼紙剥がし跡（四角い残糊）
  decal(plateG, { map: TEX.paper({ repeat: 1 }).map, color: '#efe6cf', w: w * 0.2, h: h * 0.14, pos: [w * 0.26, -h * 0.12, 0.0044], rot: [0, 0, 0.12], opacity: 0.72, order: 3 });
  decal(plateG, { map: TEX.wear({ kind: 'chip', color: '#d9d2bf', seed: seed + 8, density: 1.2 }), w: w * 0.24, h: h * 0.1, pos: [-w * 0.3, -h * 0.36, 0.0044], order: 4 });
  // 板の下端に小さな補助札（自転車補助・「ここから」等）
  if (kind === 'bicycle-only' || kind === 'crossing' || kind === 'children') {
    const sub = grp('sub-plate', { pos: [0, plateY - h / 2 - 0.11, 0] });
    sub.add(mesh(rbox(w * 0.72, 0.13, 0.012, 0.005, 2), MAT.metalPaint('#f0ede2', { worn: 0.6, base: '#fbf8ef' }), {}));
    decal(sub, {
      map: TEX.signboard({
        text: kind === 'bicycle-only' ? 'ここまで' : kind === 'crossing' ? 'ふみきり' : 'とおこうじ',
        bg: '#f0ede2', fg: '#3a352c', size: 150,
      }),
      w: w * 0.66, h: 0.1, pos: [0, 0, 0.008], order: 1,
    });
    g.add(sub);
  }
  shadowBlob(g, { r: 0.22, pos: [0, 0.004, -0.01], opacity: 0.28 });
  return finish(g, { outline: 'normal', minSize: 0.03 });
}

export { DEFAULT_OPTIONS, SIGN_KINDS, build, build as default, meta, sizeOf };
