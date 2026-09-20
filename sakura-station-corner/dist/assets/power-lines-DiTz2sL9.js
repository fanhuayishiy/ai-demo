import { g as grp, M as MAT, l as catenary, n as range, m as mesh, k as tubeOf, V as Vector3, t as tor, d as coil, r as rbox, c as cyl, am as hoop, b as box, q as finish, s as shade, P as PAL, z as rand } from './index-yWEMv7O8.js';

//  assets/street/power-lines.js —— 架空電線（一档距 = 相邻两根電柱間 / 両端は必ず杆体に錨定）
//  硬约束：本文件生成的 **每一条** 电线/引下線 的两个端点都落在 POLE_ANCHORS 的锚点上（＝杆体金具位置），
//          catenary() 两端 y 恒等于锚点 y（下垂量只在跨中生效），因此不存在任何悬空端头。
//  组原点 = a、b 中点的地面（y=0），资产内部全部用局部坐标；世界摆放由装配层给 group.position 即可。

/* =========================================================================
 *  POLE_ANCHORS —— 電柱上の電線アンカー表（utility-pole.js と完全ミラー）
 *    ※ CONTRACT により資産間 import 禁止 → 両ファイルで同値を保持。
 *      片方だけ修正したら即不正（tools/check-assets.mjs 以外に、両者の anchorList() を
 *      JSON 比較する検証を dev 時に必ず通すこと）。
 *    局所座標: X = 腕金軸（档距方向に垂直）  Y = 地上高  Z = 档距方向
 *      上段3線  y=7.55(中) / y=7.35(左右 ±0.70)
 *      中段2線  y=6.85 (±0.62)
 *      中性線   y=6.30 (x=0)
 *      引下/サービス y=5.20 (x=+0.16)
 * ========================================================================= */
const POLE_ANCHORS = {
  refHeight: 8.0,
  levels: [
    { name: 'primary', wires: 'high-tension', pts: [{ x: 0.00, y: 7.55 }, { x: -0.7, y: 7.35 }, { x: 0.70, y: 7.35 }] },
    { name: 'secondary', wires: 'low-tension', pts: [{ x: -0.62, y: 6.85 }, { x: 0.62, y: 6.85 }] },
    { name: 'neutral', wires: 'neutral', pts: [{ x: 0.0, y: 6.30 }] },
    { name: 'service', wires: 'service', pts: [{ x: 0.16, y: 5.20 }] },
  ],
};
/** 柱高さで Y のみスケールしたアンカー一覧（utility-pole.js と同一式） */
function anchorList(height = 8.0) {
  const s = height / POLE_ANCHORS.refHeight;
  const out = [];
  for (const lv of POLE_ANCHORS.levels) {
    for (const p of lv.pts) out.push({ level: lv.name, wires: lv.wires, x: p.x, y: +(p.y * s).toFixed(4) });
  }
  return out;
}
/** 装配層向けヘルパ：档距方向 (dx,dz) から電柱の rotY[deg] を返す（腕金＝柱局所 X が档距に直交する向き） */
function poleRotY(dx, dz) {
  return (Math.atan2(-dx, -dz) * 180) / Math.PI;
}

const meta = {
  id: 'power-lines',
  real: [3.3, 7.55, 1.5],          // 基準は P0-P1（3.3 m 档距・上段 7.55 m）
  origin: 'span-mid-ground',        // ★例外：原点 = 档距中点の地面
};
const DEFAULT_OPTIONS = { a: [-17.2, 6.3], b: [-13.9, 6.3], config: 'primary', sag: 0.6, seed: 5 };

/* 各レベルの電気的・質感設定（黒ゴム被覆 / アルミ裸線 / 絶縁 低圧 の差） */
const LEVEL_STYLE = {
  primary: { r: 0.0165, sagK: 0.9, mat: 'insulated', color: shade(PAL.asphalt, 0.42), seg: 34 },   // 高圧：黒ゴム被覆 CVT
  secondary: { r: 0.0135, sagK: 1.0, mat: 'insulated', color: shade(PAL.asphalt, 0.5), seg: 30 },  // 低圧：絶縁（やや退色）
  neutral: { r: 0.011, sagK: 1.06, mat: 'bare', color: shade(PAL.railSteel, 1.05), seg: 28 },         // 中性線：アルミ裸線
  service: { r: 0.0125, sagK: 1.16, mat: 'twisted', color: shade(PAL.asphaltDark, 0.72), seg: 26 },     // サービス引下
};

const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const UP = new Vector3(0, 1, 0);
const FWD = new Vector3(0, 0, 1);
/** obj の axis（'y' = 円柱/コイル軸, 'z' = 平板/リングの法線）を水平方向 vec へ回す */
function orient(obj, vec, axis = 'z') {
  const to = new Vector3(vec.x, vec.y || 0, vec.z);
  if (to.lengthSq() < 1e-9) return obj;
  obj.quaternion.setFromUnitVectors(axis === 'y' ? UP : FWD, to.normalize());
  return obj;
}

function build(options = {}) {
  const a = options.a || [-17.2, 6.3];
  const b = options.b || [-13.9, 6.3];
  const config = options.config || 'primary';
  const seed = options.seed ?? 5;
  const rnd = rand(seed);
  const sagRef = options.sag ?? 0.6;                 // 14 m 档距基準のたるみ
  const aH = options.aHeight ?? 8.0;                 // 両柱の実高（POLE_ANCHORS.y をスケール）
  const bH = options.bHeight ?? 8.0;

  const ax = a[0], az = a[1], bx = b[0], bz = b[1];
  let dx = bx - ax, dz = bz - az;
  const span = Math.hypot(dx, dz) || 1;
  dx /= span; dz /= span;
  // 横方向（腕金軸に一致させる）＝ lat = (-dz, dx)：柱 rotY の既定値はこの向きを +X とする
  const lat = { x: -dz, z: dx };
  // 柱の向き：装配層が実際の rotY を渡せばそちらを優先（角柱・建替柱対策）。
  // 既定は「同一街面に立つ隣接柱は同じ向き」＝腕金の +/- が_world_で揃い、線が档距に平行になる。
  const thA = (options.aRot ?? poleRotY(dx, dz)) * D2R;
  const thB = (options.bRot ?? poleRotY(dx, dz)) * D2R;
  // 柱局所 X → ワールド（Three の rotY: +X は -Z へ回る）
  const pA = { x: Math.cos(thA), z: -Math.sin(thA) };
  const pB = { x: Math.cos(thB), z: -Math.sin(thB) };
  // ── 交差防止の要（重要）─────────────────────────────────────────────
  // 同一档内の全線が必ず「互いに平行」になるよう、アンカー断面軸は両端とも
  // 档距に直交する lat で統一する。柱の実腕金（pA/pB）とズレる角柱では、
  // 腕金軸を無視して lat を使うと線が杆の側面に刺さった形になり、
  // 逆に腕金軸を使うと両端の断面が直交して档内で総当たり交差＝蜘蛛の巣になる。
  // そこで「断面軸 = lat 固定 × 一致度で絞った開き幅」：腕金と直交する柱では
  // 開き 0.30（＝耐張金具で杆際に寄集まる转角杆の見え方）、一致すれば 1.0。
  const fitA = Math.abs(pA.x * lat.x + pA.z * lat.z);
  const fitB = Math.abs(pB.x * lat.x + pB.z * lat.z);
  const kA = 0.30 + 0.70 * fitA;
  const kB = 0.30 + 0.70 * fitB;
  // 杆体の局部位置（グループ原点＝档距中点地面）
  const poleA = [-span / 2 * dx, 0, -span / 2 * dz];
  const poleB = [span / 2 * dx, 0, span / 2 * dz];

  /** アンカー → グループ局部 [x,y,z]（Y のみ柱高にスケール。腕金の左右偏移は柱高に変えない＝実部材は同一寸法） */
  function anchorLocal(pole, pt, height, k) {
    const s = height / POLE_ANCHORS.refHeight;
    return [pole[0] + lat.x * pt.x * k, pt.y * s, pole[2] + lat.z * pt.x * k];
  }

  const g = grp('power-lines');
  const wireG = grp('wires', { pos: [0, 0, 0] });
  // 風で微かに揺れる（amp は端部が外れない程度に極小）
  wireG.userData.sway = { amp: 0.0009, freq: 0.52 + (seed % 5) * 0.02, phase: (seed % 61) / 61 * 6.283, axis: 'z', lean: 0.4 };
  g.add(wireG);

  const matInsul = (c) => MAT.rubber(c, { spec: 0.16, specPower: 30, steps: 2, shadowAmt: 0.95 });
  const matBare = (c) => MAT.metal(c, { worn: 0.25, repeat: 2, spec: 0.7, specPower: 150 });
  const fittingMat = MAT.metal('#93989b', { worn: 0.8, repeat: 3 });
  const tieMat = MAT.metal('#8e8f92', { worn: 0.9, repeat: 2 });

  const levels = config === 'service'
    ? POLE_ANCHORS.levels.filter((l) => l.name === 'service' || l.name === 'neutral')
    : POLE_ANCHORS.levels.filter((l) => l.name !== 'service');

  let laid = 0;
  for (const lv of levels) {
    const st = LEVEL_STYLE[lv.name];
    // 档距に応じてたるみを自適応（3 m なら僅か、14 m なら sagRef）
    const sag = clamp(sagRef * Math.pow(span / 14, 2) * st.sagK, 0.012, sagRef);
    const wm = st.mat === 'bare' ? matBare(st.color) : matInsul(st.color);
    for (const pt of lv.pts) {
      const A = anchorLocal(poleA, pt, aH, kA);
      const B = anchorLocal(poleB, pt, bH, kB);
      // 端を杆側へわずかに引き込んで「碍子に載っている」見せ方に
      const inA = [A[0] + (poleA[0] - A[0]) * 0.055, A[1] - 0.012, A[2] + (poleA[2] - A[2]) * 0.055];
      const inB = [B[0] + (poleB[0] - B[0]) * 0.055, B[1] - 0.012, B[2] + (poleB[2] - B[2]) * 0.055];
      const pts = catenary(A, B, sag, st.seg + Math.round(span)).map((v) => [v.x, v.y, v.z]);
      const line = [inA, ...pts, inB];
      const jitter = range(rnd, -12e-4, 0.0012);       // 同一回路内の微細な位置ズレ（束に見せない）
      const wire = mesh(tubeOf(line.map((p) => [p[0], p[1] + jitter, p[2]]), st.r, Math.max(24, line.length * 3), 7), wm, {
        name: `wire-${lv.name}-${laid}`,
      });
      wire.userData.endAnchors = { a: A.slice(), b: B.slice() };
      wireG.add(wire);
      laid++;
      // ── 両端の金具（バンド・針金巻き・引き留め）── 必ず線が柱側へ向かって終端する
      const gap = Math.hypot(poleA[0] - A[0], poleA[2] - A[2]);
      for (const [pole, P, sgn] of [[poleA, A, 1], [poleB, B, -1]]) {
        const dv = new Vector3(pole[0] - P[0], 0, pole[2] - P[2]);
        const towardPole = dv.lengthSq() > 1e-8 ? dv.normalize() : new Vector3(sgn * dx, 0, sgn * dz);
        // 線軸（杆から跨中へ抜ける方向）：バンド・針金巻きはこの軸に巻く
        const toMid = new Vector3(sgn * dx, 0, sgn * dz);
        const off = Math.min(st.r * 7.2, Math.max(0.02, gap * 0.34));   // 杆が近い場合は金具も杆面に寄せる
        // 保線バンド（碍子上で線を巻く）
        wireG.add(orient(mesh(tor(st.r * 1.6, st.r * 0.52, 6, 14), fittingMat, {
          pos: [P[0] + toMid.x * st.r * 3.6, P[1] - st.r * 0.15, P[2] + toMid.z * st.r * 3.6],
        }), toMid, 'z'));
        // 針金巻き（バインディング線 7 巻・線に直巻）
        wireG.add(orient(mesh(coil(st.r * 1.8, 0.058, 7, 10, 0.0028), tieMat, {
          pos: [P[0] + toMid.x * 0.052, P[1] - 0.003, P[2] + toMid.z * 0.052],
        }), toMid, 'y'));
        // 二巻目のバンド（下端の抜け止め）
        wireG.add(orient(mesh(tor(st.r * 1.45, st.r * 0.42, 6, 14), fittingMat, {
          pos: [P[0] + toMid.x * st.r * 6.4, P[1] - st.r * 0.1, P[2] + toMid.z * st.r * 6.4],
        }), toMid, 'z'));
        // 引き留め台（アンカーボルト付き金具）＝杆体との接合部
        wireG.add(orient(mesh(rbox(st.r * 2.4, st.r * 2.2, st.r * 3.4, 0.003, 2), fittingMat, {
          pos: [P[0] - towardPole.x * off, P[1] - st.r * 1.35, P[2] - towardPole.z * off],
        }), towardPole, 'z'));
        if (gap > 0.05) {
          // 杆軸へ伸びる支持短角＋台座ボルト（碍子座。線が杆から浮かない為の部品）
          const len = Math.min(0.1, gap * 0.6);
          wireG.add(orient(mesh(cyl(st.r * 0.5, st.r * 0.5, len, 7), fittingMat, {
            pos: [P[0] - towardPole.x * (off + len * 0.42), P[1] - st.r * 1.9, P[2] - towardPole.z * (off + len * 0.42)],
          }), towardPole, 'y'));
          wireG.add(orient(mesh(cyl(st.r * 0.85, st.r * 0.85, st.r * 0.7, 6), MAT.metal('#a5aaaa', { worn: 0.7 }), {
            pos: [P[0] - towardPole.x * (off + len * 0.78), P[1] - st.r * 2.7, P[2] - towardPole.z * (off + len * 0.78)],
          }), towardPole, 'y'));
        } else {
          // 中性線／サービス（杆面直付け）：杆に巻いたバンドで受ける
          wireG.add(hoop(0.132, 0.0075, fittingMat, { pos: [pole[0], P[1] - 0.055, pole[2]], rot: [Math.PI / 2, 0, 0] }));
          wireG.add(orient(mesh(box(0.02, 0.02, st.r * 5), fittingMat, {
            pos: [P[0] - towardPole.x * 0.045, P[1] - st.r * 1.7, P[2] - towardPole.z * 0.045],
          }), towardPole, 'z'));
        }
      }
    }
  }

  // 多回路が束に見えないよう、跨中にスペーサ（実物の間隔保持金）を 1 档每 4 m
  // 位置は「横偏移 0 の 2 線」＝上段中央（7.55）と中性線（6.30）の間のみ。
  // 他の組合せは左右にずれている為、この位置に棒を置くと空を突く金物になる。
  if (config !== 'service' && span > 6) {
    const n = Math.max(2, Math.round(span / 4));
    const sA = aH / POLE_ANCHORS.refHeight, sB = bH / POLE_ANCHORS.refHeight;
    const sag0 = clamp(sagRef * Math.pow(span / 14, 2), 0.012, sagRef);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = poleA[0] + (poleB[0] - poleA[0]) * t;
      const z = poleA[2] + (poleB[2] - poleA[2]) * t;
      const hs = sA + (sB - sA) * t;
      const drop = Math.sin(Math.PI * t) * sag0;
      const yTop = 7.55 * hs - drop * LEVEL_STYLE.primary.sagK;
      const yBot = 6.30 * hs - drop * LEVEL_STYLE.neutral.sagK;
      const rod = mesh(cyl(0.005, 0.005, Math.abs(yTop - yBot) - 0.05, 6), MAT.metal('#7f8487', { worn: 0.6 }), { pos: [x, (yTop + yBot) / 2, z], name: 'spacer-rod' });
      wireG.add(rod);
      // スペーサ端のクランプ（線に噛ませている金物）
      for (const y of [yTop, yBot]) wireG.add(mesh(rbox(0.026, 0.02, 0.026, 0.004, 1), MAT.metal('#93989b', { worn: 0.75 }), { pos: [x, y, z], name: 'spacer-clamp' }));
    }
  }

  return finish(g, { outline: 'thin', minSize: 0.018 });
}

export { DEFAULT_OPTIONS, POLE_ANCHORS, anchorList, build, build as default, meta, poleRotY };
