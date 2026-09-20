// 湿地面：改的是 toon 内核早就注入好的那组 uniform，不新增着色器分支、不换材质。
//
// 「湿」在画面里其实是三件事：更暗、更饱和、多一层宽而亮的反光。
// 全部按**基准值乘系数**来做，而不是设成固定值 —— 草皮与泥土的 spec 基准本来就低，
// 给它们写死一个高反光会得到一片塑料草坪；乘法让它们只变暗一点、变艳一点。
import { WETTABLE } from '../core/kit.js';

const base = new WeakMap();
let last = -1;

/** 按 wet ∈ [0,1] 重写所有登记过的铺面材质。wet 没变就直接返回，稳态零开销。 */
export function applyWet(w) {
  if (w === last) return;
  last = w;
  for (const mat of WETTABLE) {
    const u = mat.userData && mat.userData.u;
    if (!u || !u.uSpecStrength) continue;
    let b = base.get(mat);
    if (!b) {
      b = { spec: u.uSpecStrength.value, pow: u.uSpecPower.value, cut: u.uSpecCut.value, sat: u.uSat.value, con: u.uContrast.value, sh: u.uShadowAmt.value };
      base.set(mat, b);
    }
    u.uSpecStrength.value = b.spec * (1 + 3.4 * w);
    u.uSpecPower.value = b.pow * (1 - 0.62 * w);
    u.uSpecCut.value = b.cut * (1 - 0.5 * w);
    u.uSat.value = b.sat * (1 + 0.24 * w);
    u.uContrast.value = b.con * (1 + 0.11 * w);
    u.uShadowAmt.value = b.sh * (1 + 0.18 * w);
  }
}
