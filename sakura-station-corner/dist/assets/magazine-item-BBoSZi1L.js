import { g as grp, z as rand, n as range, ac as Box3, m as mesh, af as BoxGeometry, r as rbox, H as plane, b as box, M as MAT, h as decal, T as TEX, w as weather, Y as memo, N as makeCanvas, s as shade, a6 as rr, Q as toTexture, V as Vector3 } from './index-DD_JJZx9.js';

//  assets/products/magazine-item.js —— 雑誌・漫画・新聞（雑誌ラック用）5 variant
//  weekly 週刊誌 / comic 週刊漫画 / magazine 情報誌 / newspaper 新聞（三つ折り）/ women 女性誌
//  構成：反った表紙（湾曲 Shell）・背表紙（縦書き＝連ねて読める）・ページ束＋小口（一枚ずつでなく束）
//        帯（obi）・付録シール・挟み_ticket・角の傷み・日焼け退色・天の埃
//  options: { seed, scale, variant, tint, pack, spineOut }  pack>1 は表紙を扇状に連ねる
//  原点 = 底面中心 / +Y 上 / 表紙 +Z / 商品なので finish() を呼ばない

const meta = {
  id: 'magazine-item',
  real: [0.21, 0.3, 0.02],
  origin: 'bottom-center',
  variants: ['weekly', 'comic', 'magazine', 'newspaper', 'women'],
};
const D2R = Math.PI / 180;
const noHull = (o) => { o.userData.noOutline = true; return o; };

/* 寸法：厚み t + 反り 3*curl + 帯 ≤ meta.real[2]、傾きによる AABB 増分込みで幅 ≤ 210mm に設計 */
const SPEC = {
  weekly: { w: 0.2045, h: 0.291, t: 0.0142, curl: 0.0015, bg: '#f2e7d5', ink: '#1f2b3a', accent: '#d94f3d', title: '週刊サンデー', sub: '春の駅旅特集' },
  comic: { w: 0.1745, h: 0.260, t: 0.0152, curl: 0.0013, bg: '#242837', ink: '#f6f2e6', accent: '#f2b23c', title: '週刊漫画王', sub: '創刊号・付録付き' },
  magazine: { w: 0.1985, h: 0.286, t: 0.0118, curl: 0.0013, bg: '#e8eee4', ink: '#2c4a3c', accent: '#4f9a72', title: '街と電車', sub: 'ローカル線 春の時刻表' },
  newspaper: { w: 0.1985, h: 0.2835, t: 0.015, curl: 0.0009, bg: '#efe9dc', ink: '#26262a', accent: '#8d8f94', title: '地方新聞', sub: '' },
  women: { w: 0.2045, h: 0.2925, t: 0.0128, curl: 0.0014, bg: '#f7e6ea', ink: '#6b3348', accent: '#db6f8e', title: 'spring LADY', sub: '春色の着まわし 30' },
};

/* -------------------------------- 局所テクチャ -------------------------------- */
const coverTex = (v) => memo(`mag:cover:${v}`, () => {
  const cv = makeCanvas(512, 736);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const S = SPEC[v];
  g.fillStyle = S.bg; g.fillRect(0, 0, w, h);
  if (v === 'newspaper') {
    g.fillStyle = S.ink; g.font = '800 40px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(S.title, w / 2, h * 0.09);
    g.strokeStyle = 'rgba(30,30,34,0.75)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(22, h * 0.135); g.lineTo(w - 22, h * 0.135); g.stroke();
    g.font = '800 34px serif';
    ['桜、駅前にも', '春ダイヤ改正'].forEach((t, i) => g.fillText(t, w / 2, h * (0.215 + i * 0.075)));
    g.fillStyle = 'rgba(120,120,124,0.32)'; g.fillRect(w * 0.06, h * 0.36, w * 0.88, h * 0.2);
    g.fillStyle = 'rgba(60,60,66,0.5)'; g.fillRect(w * 0.06, h * 0.60, w * 0.42, h * 0.34);
    for (let c = 0; c < 2; c++) for (let i = 0; i < 24; i++) {
      g.fillStyle = 'rgba(70,70,76,0.5)';
      g.fillRect(w * (0.53 + c * 0.235), h * (0.605 + i * 0.014), w * 0.2 * (0.6 + rnd() * 0.4), 3);
    }
    for (let i = 0; i < 28; i++) { g.fillStyle = 'rgba(70,70,76,0.42)'; g.fillRect(w * 0.06, h * (0.615 + i * 0.0132), w * 0.42 * (0.5 + rnd() * 0.5), 2.4); }
  } else {
    if (v !== 'comic') { g.fillStyle = S.ink; g.fillRect(0, 0, w, h * 0.16); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = v === 'comic' ? S.accent : '#f7efe0';
    g.font = `800 ${v === 'women' ? 58 : 70}px sans-serif`;
    g.fillText(S.title, w / 2, h * (v === 'comic' ? 0.095 : 0.072));
    g.font = '700 24px sans-serif';
    g.fillStyle = v === 'comic' ? '#f6f2e6' : 'rgba(255,255,255,0.85)';
    if (v === 'comic') g.fillStyle = S.ink;
    g.fillText(S.sub, w / 2, h * (v === 'comic' ? 0.152 : 0.132));
    // 写真ブロック（抽象の線路・空）
    const x = w * 0.08, y = h * 0.30, pw = w * 0.84, ph = h * 0.4;
    const gr = g.createLinearGradient(x, y, x + pw, y + ph);
    gr.addColorStop(0, shade(S.accent, 1.25)); gr.addColorStop(0.55, shade(S.bg, 1.02)); gr.addColorStop(1, shade(S.ink, 1.9));
    g.fillStyle = gr; rr(g, x, y, pw, ph, 8); g.fill();
    g.save(); rr(g, x, y, pw, ph, 8); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.4)';
    g.beginPath(); g.ellipse(w * 0.5, y + ph * 0.95, pw * 0.62, ph * 0.34, 0, 0, 6.284); g.fill();
    g.strokeStyle = 'rgba(40,36,32,0.5)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x + pw * 0.18, y + ph); g.lineTo(w * 0.46, y + ph * 0.42); g.stroke();
    g.beginPath(); g.moveTo(x + pw * 0.92, y + ph); g.lineTo(w * 0.56, y + ph * 0.42); g.stroke();
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      g.globalAlpha = 0.5; g.lineWidth = 3; g.beginPath();
      g.moveTo(w * 0.5 - (6 + t * 70), y + ph * (0.44 + t * 0.56));
      g.lineTo(w * 0.5 + (6 + t * 70), y + ph * (0.44 + t * 0.56));
      g.stroke();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 7; i++) {
      g.fillStyle = `rgba(255,255,255,${0.12 + rnd() * 0.16})`;
      g.beginPath(); g.arc(x + rnd() * pw, y + rnd() * ph * 0.4, 6 + rnd() * 24, 0, 6.284); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 3; rr(g, x, y, pw, ph, 8); g.stroke();
    const heads = ['巻頭カラー 春の駅弁', '限定インタビュー', '特集 乗り鉄入門', '大好評連載中'];
    for (let i = 0; i < 4; i++) {
      const bw = w * (0.34 + rnd() * 0.32);
      g.globalAlpha = 0.92;
      g.fillStyle = i === 0 ? S.accent : 'rgba(255,255,255,0.88)';
      rr(g, w * 0.08, h * (0.75 + i * 0.05), bw, h * 0.034, 5); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = i === 0 ? '#fff' : S.ink;
      g.font = '700 21px sans-serif'; g.textAlign = 'left';
      g.fillText(heads[i], w * 0.10, h * (0.767 + i * 0.05));
    }
    g.fillStyle = S.accent; g.globalAlpha = 0.92;
    g.beginPath(); g.arc(w * 0.855, h * 0.222, w * 0.105, 0, 6.284); g.fill();
    g.globalAlpha = 1;
    g.fillStyle = '#fff'; g.font = '800 32px sans-serif'; g.textAlign = 'center';
    g.fillText('No.12', w * 0.855, h * 0.206);
    g.font = '700 19px sans-serif'; g.fillText('490円', w * 0.855, h * 0.243);
  }
  // 退色・擦れ・水波
  g.globalAlpha = 0.15; g.fillStyle = '#fff';
  for (let i = 0; i < 26; i++) g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 120, 2 + rnd() * 10);
  g.globalAlpha = 0.1; g.fillStyle = S.ink;
  for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 55, 8 + rnd() * 22, rnd() * 3, 0, 6.284); g.fill(); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

const backTex = (v) => memo(`mag:back:${v}`, () => {
  const cv = makeCanvas(256, 368);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const S = SPEC[v];
  g.fillStyle = shade(S.bg, 1.02); g.fillRect(0, 0, w, h);
  g.fillStyle = S.ink; g.globalAlpha = 0.13; g.fillRect(w * 0.1, h * 0.08, w * 0.8, h * 0.3);
  g.globalAlpha = 1; g.fillStyle = S.accent; g.globalAlpha = 0.5;
  rr(g, w * 0.12, h * 0.44, w * 0.76, h * 0.06, 4); g.fill();
  g.globalAlpha = 1;
  for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(60,60,60,0.4)'; g.fillRect(w * 0.12, h * (0.54 + i * 0.016), w * (0.3 + rnd() * 0.5), 2); }
  g.fillStyle = '#fff'; g.fillRect(w * 0.52, h * 0.82, w * 0.38, h * 0.11);
  g.fillStyle = '#181818';
  for (let i = 0; i < 32; i++) g.fillRect(w * 0.535 + i * (w * 0.35 / 32), h * 0.83, rnd() > 0.5 ? 3 : 1.4, h * 0.075);
  g.font = '700 12px sans-serif'; g.textAlign = 'left'; g.fillText('4 910 000 12345 6', w * 0.54, h * 0.925);
  return toTexture(cv, { repeat: 1 });
});

/** 背表紙：実アスペクトに合わせた canvas（文字が伸びない） */
const spineTex = (v) => memo(`mag:spine:${v}`, () => {
  const S = SPEC[v];
  const ratio = S.h / (S.t * 0.98);
  const cv = makeCanvas(56, Math.round(Math.min(1600, 56 * ratio)));
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  g.fillStyle = shade(S.ink, v === 'newspaper' ? 3.4 : v === 'comic' ? 1.1 : 1.15); g.fillRect(0, 0, w, h);
  g.fillStyle = S.accent; g.fillRect(0, h * 0.045, w, h * 0.012); g.fillRect(0, h * 0.93, w, h * 0.01);
  const chars = (v === 'comic' ? '漫画王No12' : v === 'weekly' ? '週刊サンデー' : v === 'women' ? 'springLADY' : v === 'magazine' ? '街と電車' : '地方新聞').split('');
  const size = w * 0.82;
  g.font = `800 ${size}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = v === 'weekly' ? '#1f2b3a' : '#f7f2e6';
  const step = (h * 0.78) / Math.max(1, chars.length);
  chars.forEach((c, i) => {
    g.save(); g.translate(w / 2, h * 0.1 + step * (i + 0.5));
    if (/[A-Za-z0-9]/.test(c)) g.rotate(Math.PI / 2);
    g.fillText(c, 0, 0); g.restore();
  });
  for (let i = 0; i < 44; i++) { g.globalAlpha = 0.08 + rnd() * 0.16; g.fillStyle = '#fff'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 18, 2); }
  g.globalAlpha = 1;
  return toTexture(cv, { repeat: 1 });
});

/** ページ束の小口（束の断面：細い筋・糊面の暗がり・黄ばみ） */
const pageEdgeTex = (v) => memo(`mag:edge:${v}`, () => {
  const cv = makeCanvas(64, 256);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const news = v === 'newspaper';
  g.fillStyle = news ? '#e7e2d2' : '#f4efe0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 170; i++) {
    g.globalAlpha = 0.1 + rnd() * 0.3;
    g.strokeStyle = rnd() > 0.5 ? '#cdc6b2' : '#fffdf6';
    g.lineWidth = 0.6 + rnd() * 0.9;
    const y = rnd() * h;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 3); g.stroke();
  }
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, 'rgba(120,105,80,0.4)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(180,160,120,0.2)');
  g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, w, h);
  return toTexture(cv, { repeat: 1 });
});

const obiTex = (v) => memo(`mag:obi:${v}`, () => {
  const cv = makeCanvas(512, 128);
  if (!cv) return null;
  const { g, w, h, rnd } = cv;
  const S = SPEC[v];
  g.fillStyle = S.accent; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.94)';
  g.font = '800 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(v === 'comic' ? '付録つき！' : v === 'women' ? '春の号 特別価格' : v === 'magazine' ? '特集・早春の駅' : '巻頭特集・春の駅旅', w * 0.5, h * 0.42);
  g.font = '700 22px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.82)';
  g.fillText('期間限定 ¥' + (390 + Math.floor(rnd() * 5) * 20), w * 0.5, h * 0.78);
  return toTexture(cv, { repeat: 1 });
});

/* ---------------------------- 反りのある表紙 Shell ---------------------------- */
/** 薄い箱の頂点を押して「背接着の反り・腰の弯・角めくれ」を作る（表 = +Z 面） */
function curvedShell(w, h, t, curl, seed, sign = 1) {
  const g = new BoxGeometry(w, h, t, 9, 12, 1);
  const p = g.attributes.position;
  const v = new Vector3();
  const rnd = rand(seed);
  const wob = 0.14 + rnd() * 0.12;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const nx = v.x / (w / 2), ny = v.y / (h / 2);
    let z = curl * (0.5 + 0.5 * nx) * (1 - 0.3 * ny * ny) + curl * wob * Math.sin(ny * 2.1);
    z += curl * 0.5 * Math.pow(Math.max(0, nx * 0.6 + ny * 0.4), 6) + curl * 0.42 * Math.pow(Math.max(0, -nx * 0.5 - ny * 0.5), 6);
    p.setZ(i, v.z + z * sign);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
/** 帯を一周（前面・背面・背・小口の 4 パネル、各独立 Mesh） */
function wrapBand(parent, { w, h, t, y0, hh, curl, mat, edgeMat }) {
  const of = 0.0011;
  parent.add(mesh(curvedShell(w, hh, 0.0009, curl * 0.86, 41, 1), mat, { pos: [0, y0 + hh / 2, t / 2 + of], name: 'band-front' }));
  parent.add(mesh(curvedShell(w, hh, 0.0009, curl * 0.86, 41, -1), mat, { pos: [0, y0 + hh / 2, -t / 2 - of], name: 'band-back' }));
  parent.add(mesh(box(0.0009, hh, t + of * 2), edgeMat, { pos: [-w / 2 - of * 0.5, y0 + hh / 2, 0], name: 'band-spine' }));
  parent.add(mesh(box(0.0009, hh, t + curl * 2.3), edgeMat, { pos: [w / 2 + of * 0.5, y0 + hh / 2, curl * 0.4], name: 'band-fore' }));
}

/* -------------------------------- 1 冊 -------------------------------- */
function oneMagazine(parent, variant, M, o, rnd, idx) {
  const S = SPEC[variant];
  const g = grp(`mag:${variant}#${idx}`);
  parent.add(g);
  const { w, h, t, curl } = S;
  const inked = (map) => MAT.poster({ map, color: '#ffffff', steps: 2, spec: 0.17, specPower: 32, shadowAmt: 0.72, tint: o.tint });

  // ページ束（+X = 小口、-X = 背）
  g.add(noHull(mesh(new BoxGeometry(w * 0.972, h * 0.984, t * 0.9), [
    M.pageEdge, M.pagePlain, M.pageTop, M.pageBottom, M.pagePlain, M.pagePlain,
  ], { pos: [w * 0.004, h / 2, 0], name: 'page-block', cast: false })));
  // 束の小口が膨れる（開いた本の実形）
  g.add(noHull(mesh(rbox(w * 0.045, h * 0.96, t * 0.9, 0.0035, 2), M.pageEdge, { pos: [w * 0.484, h / 2, 0], cast: false })));

  // 表紙・裏表紙（逆向きに反る）
  g.add(mesh(curvedShell(w, h, 0.0011, curl, idx * 31 + 7, 1), inked(coverTex(variant)), { pos: [0, h / 2, t / 2], name: 'cover-front' }));
  g.add(mesh(curvedShell(w, h, 0.0011, curl * 0.8, idx * 31 + 13, -1), inked(backTex(variant)), { pos: [0, h / 2, -t / 2], name: 'cover-back' }));
  // 背表紙（平面を -X へ向けて貼る＝ミラー写り回避）
  g.add(noHull(mesh(plane(t * 0.94, h * 0.995), inked(spineTex(variant)), {
    pos: [-w / 2 - 0.0002, h / 2, 0], rot: [0, -Math.PI / 2, 0], name: 'spine', cast: false,
  })));
  // 背の糊面（厚み）
  g.add(noHull(mesh(box(0.0022, h * 0.99, t * 0.86), M.pagePlain, { pos: [-w / 2 + 0.0022, h / 2, 0], cast: false })));

  // 帯
  if (variant !== 'newspaper') {
    wrapBand(g, { w, h, t, y0: h * (variant === 'comic' ? 0.12 : 0.17), hh: h * 0.225, curl, mat: M.obi, edgeMat: M.obiPlain });
  } else {
    // 新聞の三つ折り（折筋＋内側の白）
    for (const fy of [0.36, 0.68]) {
      g.add(noHull(mesh(box(w * 0.99, 0.0011, t * 1.03), MAT.paint('#cfc9b8', { steps: 2, shadowAmt: 0.95 }), { pos: [0, h * fy, 0], cast: false })));
      g.add(noHull(mesh(box(w * 0.99, 0.0007, t * 0.55), MAT.paint('#fffaf0', { steps: 2, spec: 0.12 }), { pos: [0, h * fy + 0.0012, 0], cast: false })));
    }
    // 折れの角が浮く（めくれ）
    g.add(noHull(mesh(plane(w * 0.26, t * 0.7), M.pageTop, { pos: [w * 0.3, h * 0.977, t * 0.24], rot: [-Math.PI / 2 + 0.3, 0, 0.05], cast: false })));
  }
  // 付録シール
  if (variant === 'comic' || variant === 'women') {
    decal(g, {
      map: TEX.lightPanel({ text: variant === 'comic' ? '付録' : '特別', bg: variant === 'comic' ? '#f2b23c' : '#db6f8e', fg: '#2f2a24', mode: 'sign' }),
      w: 0.05, h: 0.05, pos: [-w * 0.27, h * 0.87, t / 2 + curl * 0.35 + 0.0016], rot: [0, 0, -9 * D2R], opacity: 0.97,
    });
  }
  // 挟んだ乗車券（生活痕・角が覗く）
  if (idx % 2 === 0) {
    const tk = grp('ticket'); g.add(tk);
    tk.add(noHull(mesh(box(0.03, 0.055, 0.0005), MAT.paper({ color: '#f8f4e8' }), { pos: [0, 0, 0], cast: false })));
    tk.add(noHull(mesh(box(0.024, 0.0035, 0.0006), MAT.paint('#5d7f9e', { steps: 2 }), { pos: [0, 0.014, 0.0002], cast: false })));
    tk.position.set(w * 0.28, h * 0.72, t * 0.4);
    tk.rotation.set(0, 0, 4 * D2R);
  }
  // 角の傷み・天の埃・表紙の擦れ（すべて面内に収める）
  weather(g, { w: 0.018, h: 0.02, pos: [w * 0.4, h * 0.945, t / 2 + curl + 0.0012], kind: 'chip', color: '#c9bda2', opacity: 0.45, seed: idx * 13 + 5, density: 1.3, spread: 0.001 });
  weather(g, { w: 0.024, h: 0.016, pos: [-w * 0.3, h * 0.055, t / 2 + curl + 0.0012], kind: 'dirt', color: '#8f8571', opacity: 0.34, seed: idx * 13 + 17, density: 1.1, spread: 0.001 });
  weather(g, { w: w * 0.34, h: 0.006, pos: [0, h * 0.988, 0], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#a99f8a', opacity: 0.3, seed: idx * 13 + 19, density: 0.9, spread: 0.0008 });
  // 棚からの取り出し傷（背の糊面が剥げた角）
  g.add(noHull(mesh(rbox(0.006, 0.02, t * 0.42, 0.002, 2), M.pageBottom, { pos: [-w / 2 + 0.0015, h * 0.06, 0], rot: [0, 0, 4 * D2R], cast: false })));

  g.rotation.z = range(rnd, -0.6, 0.6) * D2R;
  return g;
}

function mats(o) {
  const v = o.variant;
  return {
    pageEdge: MAT.paper({ color: '#f6f1e2', map: pageEdgeTex(v), spec: 0.06, shadowAmt: 0.85, tint: o.tint }),
    pageTop: MAT.paper({ color: '#efe9d8', map: pageEdgeTex(v), uv: { repeat: [4, 1] }, spec: 0.05, shadowAmt: 0.9, tint: o.tint }),
    pageBottom: MAT.paper({ color: '#e4ddc9', map: pageEdgeTex(v), uv: { repeat: [4, 1] }, spec: 0.05, shadowAmt: 0.95, tint: o.tint }),
    pagePlain: MAT.paper({ color: '#f2ecdd', spec: 0.05, shadowAmt: 0.9, tint: o.tint }),
    obi: MAT.poster({ map: obiTex(v), color: '#ffffff', steps: 2, spec: 0.14, shadowAmt: 0.72, tint: o.tint }),
    obiPlain: MAT.paper({ color: SPEC[v].accent, spec: 0.1, shadowAmt: 0.8, tint: o.tint }),
  };
}

function build(options = {}) {
  const variant = SPEC[options.variant] ? options.variant : 'weekly';
  const seed = options.seed ?? 1;
  const pack = Math.max(1, Math.min(6, options.pack ?? 1));
  const S = SPEC[variant];
  const g = grp(`magazine-item:${variant}${pack > 1 ? ':x' + pack : ''}`);
  const inner = grp('body');
  g.userData.variant = variant;
  g.userData.real = meta.real;
  for (let i = 0; i < pack; i++) {
    const rnd = rand(seed + i * 977 + variant.length);
    const one = oneMagazine(inner, variant, mats({ ...options, variant }), options, rnd, i);
    if (pack > 1) {
      one.position.x = (i - (pack - 1) / 2) * (S.w * 0.46);       // 表紙を扇状に重ねる
      one.position.z = -i * 0.0022;                                // 奥へ一段ずつ下げる
      one.rotation.y = (options.spineOut ? 90 : range(rnd, -3.5, 3.5)) * D2R;
      one.rotation.x = range(rnd, -1, 1) * D2R;
    }
  }
  inner.scale.setScalar(options.scale ?? 1);
  inner.updateMatrixWorld(true);
  const bb = new Box3().setFromObject(inner);
  inner.position.x -= (bb.min.x + bb.max.x) / 2;
  inner.position.z -= (bb.min.z + bb.max.z) / 2;
  inner.position.y -= bb.min.y;
  g.add(inner);
  return g;
}

const P_MAG = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  build,
  default: build,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

export { P_MAG as P, build as b };
