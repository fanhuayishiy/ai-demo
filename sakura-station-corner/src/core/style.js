// 美术风格总开关。
//   flat  = 参考图方向：低多边形 + 哑光平涂，无描边、无景深/泛光/颗粒，色块干净
//   toon  = 原 AGENT.md 方向：三渲二色阶 + 全物件轮廓描边 + 电影级后期
// 用 ?style=toon 可切回。所有差异都集中在这里，不散落到各模块里。
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;

export const MODE = params?.get('style') || 'flat';
export const IS_FLAT = MODE === 'flat';

/**
 * 平涂模式下要压掉的着色项（toon 模式返回原对象，保持不动）。
 * 这里是**覆盖**语义：全局观感必须统一，否则 100 多个资产各自传的 shadowAmt
 * 会让画面重新变回分层+重阴影的样子。
 */
export function flatShading(o = {}) {
  if (!IS_FLAT) return o;
  // 只剥「表面噪点」贴图（沥青/混凝土/木/布/瓷砖…）。
  // 带 graphic 标记的是**内容**贴图（海报、看板字、商品标签、屏幕），剥了会把所有招牌刷白。
  const drop = !o.graphic;
  const { map, normalMap, normalScaleX, normalScaleY, ...rest } = drop ? o : { ...o };
  if (!drop) return { ...o, shadowTint: '#fff6ec', shadowAmt: 0.5, rim: 0, sheen: 0, sat: 1.0, contrast: 1.0, dither: 0, steps: 6 };
  return {
    ...rest,
    // 阴影几乎不压暗、且不带冷色：参考图是大面积明亮色块
    shadowTint: '#fff6ec',
    shadowAmt: 0.5,
    rim: 0,
    spec: 0.04,
    specPower: 90,
    specCut: 0.62,
    sheen: 0,
    sat: 1.12,
    contrast: 1.04,
    dither: 0,
    steps: 6,          // 色阶越多越接近平滑渐变
  };
}

/** 描边：平涂模式整体关闭（反壳与屏幕空间描边都不画） */
export const outlines = IS_FLAT ? false : true;

/** 后期链：平涂只保留抗锯齿 + 输出 */
export const postChain = {
  edge: !IS_FLAT,
  dof: !IS_FLAT,
  bloom: !IS_FLAT,
  grade: !IS_FLAT,
  smaa: true,
};
