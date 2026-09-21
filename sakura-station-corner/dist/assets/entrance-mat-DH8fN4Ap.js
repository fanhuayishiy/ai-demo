import { g as grp, M as MAT, T as TEX, m as mesh, r as rbox, b as box, h as decal, w as weather, n as range, P as PAL, c as cyl, k as tubeOf, H as plane, q as finish, z as rand, Y as memo, N as makeCanvas, Q as toTexture } from './index-CSUFndW_.js';

//  assets/store/entrance-mat.js —— 自動ドア门口のゴム製マット＋アルミ段差框＋店内スリッパ置きライン
//  原点 = マットの接地面中心 / +Y 上 / +Z = 戸外（自動ドア・歩道側）、-Z = 店内

const meta = {
  id: 'entrance-mat',
  real: [1.72, 0.14, 0.92],      // w=1.6 / d=0.9 のとき（アルミ段差框を含む）
  origin: 'ground-center：マット接地面を局所 y=0 とする（店内側は床段差 +0.12、戸外側は框下端 -0.12）',
};

const DEFAULT_OPTIONS = { w: 1.6, d: 0.9, seed: 55 };

const noOut = (o) => { o.userData.noOutline = true; return o; };
const D2R = Math.PI / 180;

/** スリッパ置きライン（破線＋脱ぎ場シルエット）— 文字は描かない */
function shoeLineTex() {
  return memo('store/entrance-mat:shoeline', () => {
    const cv = makeCanvas(512, 128);
    if (!cv) return null;
    const { g, w, h, rnd } = cv;
    g.clearRect(0, 0, w, h);
    // 破線
    g.strokeStyle = 'rgba(246,243,236,0.92)';
    g.lineWidth = 9;
    g.setLineDash([34, 22]);
    g.beginPath(); g.moveTo(10, h * 0.20); g.lineTo(w - 10, h * 0.20); g.stroke();
    g.setLineDash([]);
    // 脱ぎ場：左右の足型（楕円＋つま先）
    const foot = (cx, cy, s, flip) => {
      g.save(); g.translate(cx, cy); g.scale(flip ? -1 : 1, 1); g.rotate(-8 * D2R);
      g.fillStyle = 'rgba(79,163,209,0.85)';
      g.beginPath(); g.ellipse(0, 0, 15 * s, 30 * s, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(2 * s, -30 * s, 12 * s, 12 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(246,243,236,0.9)';
      g.beginPath(); g.ellipse(0, 6 * s, 8 * s, 16 * s, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    foot(w * 0.36, h * 0.66, 1.0, false);
    foot(w * 0.56, h * 0.66, 1.0, true);
    // すり切れ
    g.globalAlpha = 0.5;
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 1 + rnd() * 3);
    }
    return toTexture(cv, { repeat: 1 });
  });
}

function build(options = {}) {
  const W = options.w ?? 1.6;
  const D = options.d ?? 0.9;
  const seed = options.seed ?? 2024;
  const rnd = rand(seed);
  const g = grp('entrance-mat');

  /* ---------------- 寸法・材質 ---------------- */
  const FR = 0.15;                              // アルミ段差框の幅（+Z 側）
  const MD = D - FR;                            // ゴムマットの奥行き
  const mt = 0.013;                             // 厚み
  const bodyZ = -FR / 2;                        // マット本体中心（前端を z=D/2-FR に合わせる）
  const rubberT = MAT.rubber('#43494f', {
    map: TEX.tile({ color: '#5a6068', n: 14, grout: '#31363b', repeat: 2 }).map,
    normalMap: TEX.tile({ color: '#5a6068', n: 14, grout: '#31363b', repeat: 2 }).normalMap,
    normalScaleX: 1.2, normalScaleY: 1.2, steps: 3, tint: '#cfc7b6', sat: 0.72,
  });
  const rubberCore = MAT.rubber('#2c3034', { steps: 2, shadowAmt: 1 });
  const alu = MAT.metal('#c6cac6', { worn: 0.45, repeat: 5 });
  const aluDk = MAT.metal('#a4a9ab', { worn: 0.85, repeat: 6 });
  const iron = MAT.darkIron({ repeat: 6 });

  /* ================ 1. ゴムマット本体 ================ */
  const mat = grp('rubber-mat');
  g.add(mat);
  mat.add(mesh(rbox(W, mt, MD, 0.005, 2), rubberT, { pos: [0, mt / 2, bodyZ], name: 'mat-top' }));
  mat.add(mesh(box(W - 0.02, 0.004, MD - 0.02), rubberCore, { pos: [0, 0.002, bodyZ] }));      // 下層（厚みの芯）
  // 縁の目地（ぐるりと 1 段深い枠）
  for (const sx of [-1, 1]) mat.add(mesh(box(0.020, mt - 0.002, MD - 0.03), rubberCore, { pos: [sx * (W / 2 - 0.012), mt / 2 + 0.001, bodyZ] }));
  mat.add(mesh(box(W - 0.03, mt - 0.002, 0.020), rubberCore, { pos: [0, mt / 2 + 0.001, bodyZ - MD / 2 + 0.012] }));

  /* ================ 2. 摩耗・柄の薄れ・泥と砂の噛み込み ================ */
  // 通行線で柄が薄れる（明るい摩耗帯）
  decal(mat, {
    map: TEX.gradient({ stops: [[0, 'rgba(214,208,193,1)'], [0.45, 'rgba(206,200,186,0.55)'], [1, 'rgba(255,255,255,0)']] }),
    w: W * 0.52, h: MD * 0.9, pos: [0.02, mt + 0.0016, bodyZ], rot: [-Math.PI / 2, 0, 0], opacity: 0.42,
  });
  decal(mat, { map: TEX.wear({ kind: 'scratch', color: '#cfc9b8', seed: seed + 3, density: 1.4 }), w: W * 0.6, h: MD * 0.5, pos: [-0.1, mt + 0.0018, bodyZ + 0.06], rot: [-Math.PI / 2, 0, 0.3], opacity: 0.5 });
  // 泥・砂（踏み口側とマット角に偏って噛み込み）
  weather(mat, { w: W * 0.42, h: MD * 0.34, pos: [0.08, mt + 0.0015, bodyZ + MD * 0.22], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#6f6553', opacity: 0.6, seed: seed + 5, density: 1.9, spread: 0.006 });
  weather(mat, { w: 0.34, h: 0.26, pos: [-W * 0.30, mt + 0.0015, bodyZ - MD * 0.20], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5d5647', opacity: 0.55, seed: seed + 6, density: 1.6, spread: 0.005 });
  // 砂粒（ゴム目に噛んだ小石）
  for (let i = 0; i < 22; i++) {
    const s = range(rnd, 0.0022, 0.0052);
    mat.add(noOut(mesh(box(s, s * 0.6, s * 0.85), MAT.stone({ color: PAL.dirt, repeat: 4 }), {
      pos: [range(rnd, -W / 2 + 0.05, W / 2 - 0.05), mt + s * 0.28, bodyZ + range(rnd, -MD / 2 + 0.05, MD / 2 - 0.05)],
      rot: [range(rnd, -0.4, 0.4), range(rnd, 0, 3.1), range(rnd, -0.4, 0.4)], cast: false,
    })));
  }
  // 雨だれの染み（框側から）
  for (let i = 0; i < 3; i++) weather(mat, { w: 0.10, h: 0.18, pos: [-W * 0.34 + i * 0.42, mt + 0.0014, bodyZ + MD * 0.34], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#3f4650', opacity: 0.4, seed: seed + 9 + i, density: 0.9, spread: 0.004 });

  /* ================ 3. 端部の反り・浮き ================ */
  /** 起立する端片：pivot から dir 方向へ len だけ反り上がる（裏面は黒い下地） */
  const mkFlap = (x, z, dir, len, wd, ang) => {
    const piv = grp('edge-lift');
    piv.position.set(x, mt - 0.002, z);
    piv.rotation.y = dir === 0 ? -Math.PI / 2 : dir === 1 ? Math.PI / 2 : dir === 2 ? Math.PI : 0;
    mat.add(piv);
    const tilt = grp('edge-tilt');
    tilt.rotation.x = ang;
    piv.add(tilt);
    tilt.add(mesh(rbox(wd, 0.009, len, 0.003, 2), rubberT, { pos: [0, 0, -len / 2] }));
    tilt.add(noOut(mesh(box(wd - 0.016, 0.0022, len - 0.016), rubberCore, { pos: [0, -58e-4, -len / 2], cast: false })));
    return tilt;
  };
  const fA = mkFlap(-W / 2 + 0.26, bodyZ + MD * 0.20, 1, 0.23, 0.19, 8 * D2R);   // 左端がめくれる
  mkFlap(W / 2 - 0.24, bodyZ - MD * 0.26, 0, 0.20, 0.16, 5 * D2R);               // 右端（室内側）
  const fC = mkFlap(-W * 0.10, bodyZ - MD / 2 + 0.26, 3, 0.24, 0.30, 6 * D2R);   // 奥端の浮き
  weather(fA, { w: 0.14, h: 0.10, pos: [0, 0.0062, -0.1], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#5d5647', opacity: 0.5, seed: seed + 13, density: 1.4, spread: 0.003 });
  weather(fC, { w: 0.16, h: 0.10, pos: [0, 0.0062, -0.11], rot: [-Math.PI / 2, 0, 0], kind: 'moss', color: '#57704a', opacity: 0.42, seed: seed + 14, density: 1.2, spread: 0.003 });

  /* ================ 4. 糸切れ（繊維のほつれ） ================ */
  const yarn = grp('frayed-yarn');
  g.add(yarn);
  const yarnMat = MAT.fabric({ color: '#8f8a7c', repeat: 10 });
  for (let i = 0; i < 26; i++) {
    const edge = i % 3;
    let x, z;
    if (edge === 0) { x = (rnd() < 0.5 ? -1 : 1) * (W / 2 + range(rnd, 0.0, 0.02)); z = bodyZ + range(rnd, -MD / 2, MD / 2); }
    else if (edge === 1) { x = range(rnd, -W / 2, W / 2); z = bodyZ - MD / 2 - range(rnd, 0, 0.02); }
    else { x = range(rnd, -W / 2, W / 2); z = bodyZ + MD / 2 + range(rnd, 0, 0.012); }
    const L = range(rnd, 0.008, 0.024);
    yarn.add(noOut(mesh(cyl(0.0009, 0.0006, L, 4), yarnMat, {
      pos: [x, mt * range(rnd, 0.35, 0.95), z],
      rot: [Math.PI / 2 + range(rnd, -0.7, 0.7), range(rnd, 0, 3.1), range(rnd, -0.9, 0.9)], cast: false,
    })));
  }
  // 表面に出た繊維（通行線で削れて浮いた糸）
  for (let i = 0; i < 12; i++) {
    yarn.add(noOut(mesh(tubeOf([
      [range(rnd, -W / 2 + 0.1, W / 2 - 0.1), mt + 0.0018, bodyZ + range(rnd, -MD / 2 + 0.08, MD / 2 - 0.08)],
      [range(rnd, -W / 2 + 0.1, W / 2 - 0.1), mt + 0.0045, bodyZ + range(rnd, -MD / 2 + 0.08, MD / 2 - 0.08)],
    ], 0.0008, 6, 4), yarnMat)));
  }

  /* ================ 5. 下段のアルミ段差框（戸外側へ -0.12 に下りる） ================ */
  const step = grp('alu-step-frame');
  g.add(step);
  const fz0 = D / 2 - FR, fz1 = D / 2;
  step.add(mesh(rbox(W + 0.10, 0.014, FR - 0.005, 0.004, 2), alu, { pos: [0, 0.007, (fz0 + fz1) / 2] }));           // 踏み板（見切り框）
  for (let k = 0; k < 7; k++) step.add(noOut(mesh(box(W - 0.06, 0.0035, 0.007), aluDk, { pos: [0, 0.0145, fz0 + 0.016 + k * 0.019], cast: false })));  // 滑り止め溝
  step.add(mesh(box(W + 0.10, 0.130, 0.014), alu, { pos: [0, -0.056, fz1 - 0.002] }));                              // 立ち上がり（段鼻）
  step.add(mesh(box(W + 0.10, 0.010, 0.050), aluDk, { pos: [0, -0.117, fz1 - 0.028] }));                            // 下階の座金
  step.add(mesh(box(W + 0.10, 0.018, 0.010), aluDk, { pos: [0, -2e-3, fz1 + 0.005] }));                            // 押えリブ
  for (const bx of [-W * 0.38, -W * 0.13, W * 0.13, W * 0.38]) {
    step.add(noOut(mesh(cyl(0.0058, 0.0058, 0.010, 6), iron, { pos: [bx, 0.0145, (fz0 + fz1) / 2], cast: false })));   // 固定ビス（沈み込み）
    step.add(noOut(mesh(cyl(0.0110, 0.0110, 0.003, 10), aluDk, { pos: [bx, 0.0128, (fz0 + fz1) / 2], cast: false })));
  }
  weather(step, { w: W * 0.5, h: 0.06, pos: [0, -0.116, fz1 - 0.028], rot: [-Math.PI / 2, 0, 0], kind: 'rust', color: '#8b6a45', opacity: 0.5, seed: seed + 21, density: 1.5, spread: 0.008 });
  weather(step, { w: 0.30, h: 0.10, pos: [W * 0.3, -0.07, fz1 + 0.006], kind: 'scratch', color: '#e6e6e2', opacity: 0.4, seed: seed + 22, density: 1.4, spread: 0.01 });
  weather(step, { w: W * 0.4, h: 0.05, pos: [-W * 0.2, 0.014, (fz0 + fz1) / 2], rot: [-Math.PI / 2, 0, 0], kind: 'dirt', color: '#7a7161', opacity: 0.5, seed: seed + 23, density: 1.6, spread: 0.006 });

  /* ================ 6. 室内側のスリッパ置きライン（decal） ================ */
  const line = grp('slipper-line');
  g.add(line);
  decal(line, { map: shoeLineTex(), w: W * 0.86, h: 0.24, pos: [0, 0.0016, -D / 2 - 0.20], rot: [-Math.PI / 2, 0, 0], color: '#ffffff', opacity: 0.9 });
  // ラインの摩耗（重ねて薄れる）
  decal(line, { map: TEX.wear({ kind: 'chip', color: '#e3ded1', seed: seed + 31, density: 0.8 }), w: W * 0.5, h: 0.14, pos: [0.1, 0.0026, -D / 2 - 0.20], rot: [-Math.PI / 2, 0, 0], opacity: 0.34, order: 2 });
  // 段差の影（マット押え金物）
  line.add(mesh(box(W + 0.02, 0.006, 0.016), aluDk, { pos: [0, 0.003, -D / 2 - 0.016] }));

  /* ================ 7. 春の花びら ================ */
  const petals = grp('petals');
  g.add(petals);
  const PM = [0, 1, 2].map((t) => MAT.petal({ map: TEX.petal({ tone: t, mode: 'single' }), alphaTest: 0.4, glow: 0.12 + t * 0.05 }));
  for (let i = 0; i < 9; i++) {
    const onMat = i < 6;
    const s = range(rnd, 0.020, 0.034);
    petals.add(noOut(mesh(plane(s, s * 0.86), PM[i % 3], {
      pos: onMat
        ? [range(rnd, -W / 2 + 0.06, W / 2 - 0.06), mt + 0.0022 + rnd() * 0.004, bodyZ + range(rnd, -MD / 2 + 0.05, MD / 2 - 0.05)]
        : [range(rnd, -W / 2 - 0.14, W / 2 + 0.14), 0.0022 + rnd() * 0.003, -D / 2 - range(rnd, 0.06, 0.34)],
      rot: [-Math.PI / 2 + range(rnd, -0.55, 0.55), range(rnd, 0, 6.28), range(rnd, -1.1, 1.1)],
      cast: false,
    })));
  }
  // 縁に挟まった花びら（めくれ上げた端に引っかかる）
  petals.add(noOut(mesh(plane(0.026, 0.022), PM[1], { pos: [-W / 2 - 0.006, mt + 0.010, bodyZ + MD * 0.26], rot: [-1.1, 0.4, 0.9], cast: false })));

  /* ================ 8. マット際の泥落ち・花びら堆積（床側） ================ */
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#6a6153', seed: seed + 41, density: 1.6 }), w: W * 0.88, h: 0.13, pos: [0, 0.0020, -D / 2 - 0.055], rot: [-Math.PI / 2, 0, 0], opacity: 0.48, order: 3 });
  decal(g, { map: TEX.wear({ kind: 'dirt', color: '#5d5647', seed: seed + 42, density: 1.2 }), w: 0.22, h: MD * 0.7, pos: [W / 2 + 0.06, 0.0020, bodyZ], rot: [-Math.PI / 2, 0, 0], opacity: 0.4, order: 4 });

  return finish(g, { outline: 'thin', minSize: 0.030 });
}

export { DEFAULT_OPTIONS, build, build as default, meta };
