// 距离分层显示（LOD）：远看小于若干像素的零件与描边壳按需隐藏
// 目的：保留「每个物件独立建模、不合并网格」的前提下维持流畅帧率。
// 规则（按资产实例到相机的距离）：
//   · 反壳描边：> hullRange 米隐藏（画面上仅一两像素，隐藏后由屏幕空间描边接管轮廓）
//   · 屏幕尺寸：投影后小于 pxThreshold 像素的独立零件隐藏（螺栓/标签/小花等），靠近自动回归
// 只切换 visible，绝不改动几何、不合并网格。
import * as THREE from 'three';

const DEFAULTS = { hullRange: 16, pxThreshold: 9, interval: 0.2, hysteresis: 1.14 };

/** 升序数组里第一个 ≥ v 的下标（即 < v 的个数） */
function lowerBound(arr, v) {
  let lo = 0,
    hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * 静态子树优化：装配完成后，除被 sway 摆动的组（及其子树）外，
 * 全部节点关闭 matrixWorldAutoUpdate —— 每帧不再遍历数万个静止节点。
 */
export function markStatic(root) {
  // 先烘好世界矩阵（此刻 auto update 仍开着），再关闭逐帧更新。
  // 顺序反了会留下恒等 matrixWorld：three 的 updateMatrixWorld() 对
  // matrixWorldAutoUpdate===false 的节点连 force 都不重算，只能靠别处
  // 偶然调用的 updateWorldMatrix() 补救 —— 装配体检工具就会被坑到。
  root.updateMatrixWorld(true);
  const swayers = [];
  root.traverse((n) => {
    if (n.userData?.sway) swayers.push(n);
    n.matrixWorldAutoUpdate = false;
    n.matrixAutoUpdate = false;
  });
  for (const sw of swayers) {
    sw.matrixAutoUpdate = true;
    sw.matrixWorldAutoUpdate = true;
    sw.traverse((c) => {
      c.matrixWorldAutoUpdate = true;
      if (c !== sw && c.userData?.sway) c.matrixAutoUpdate = true;
    });
  }
  return root;
}

export function installLod(engine, root, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const groups = [];
  const tmpBox = new THREE.Box3();
  const tmpSize = new THREE.Vector3();
  const tmpScale = new THREE.Vector3();
  // 像素 → 世界尺寸换算：px = maxDim / dist * (H / (2 tan(fov/2)))
  const pxToScale = () => engine.renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(engine.camera.fov * 0.5)));

  function collectInstances(node) {
    // 分组必须落在「资产实例」这一层。world 的直接子节点只有 map / assets 两个图层，
    // 若按图层成组，整场景会塌成 2 个组：组心＝场景中心、组半径≈21 m，
    // 于是 d = dist - radius ≈ 0.9 m，尺寸阈值 limit = d/unit 跟着塌到 1 cm ——
    // 结果一个零件都隐藏不了（实测 48096/48096 全可见）。
    for (const layer of node.children) {
      if (!layer.isObject3D) continue;
      const units = layer.name === 'map' || layer.name === 'assets' ? layer.children : [layer];
      for (const child of units) {
      const hulls = [];
      const parts = [];
      child.updateMatrixWorld(true);
      child.traverse((n) => {
        if (!n.isMesh) return;
        const g = n.geometry;
        if (!g) return;
        if (n.isInstancedMesh) {
          // 实例批次按「批次自身的包围球直径」判断，不按单个零件的尺寸：
          // 一批花瓣摊开是 0.6 m 的树冠、一排饮料是 1 m 的货架，远景看到的正是这坨整体；
          // 若按单件（花瓣 4 cm）判定，整批会在中景被剔掉，树冠和货架会凭空消失。
          // 只有确实缩成一团的批次（一把螺丝、一排标签在同一 5 cm 内）才会被剔。
          if (n.userData?.isHull) return;
          if (!n.boundingSphere) n.computeBoundingSphere();
          const bs = n.boundingSphere;
          if (!bs || !Number.isFinite(bs.radius)) return;
          n.getWorldScale(tmpScale);
          const maxDim = bs.radius * 2 * Math.max(tmpScale.x, tmpScale.y, tmpScale.z);
          if (maxDim > 0) parts.push({ n, maxDim });
          return;
        }
        if (n.userData?.isHull) {
          hulls.push(n);
          return;
        }
        if (!g.boundingBox) g.computeBoundingBox();
        g.boundingBox.getSize(tmpSize);
        n.getWorldScale(tmpScale);
        const maxDim = Math.max(tmpSize.x * tmpScale.x, tmpSize.y * tmpScale.y, tmpSize.z * tmpScale.z);
        if (maxDim > 0) parts.push({ n, maxDim });
      });
      if (!hulls.length && !parts.length) continue;
      try {
        tmpBox.setFromObject(child);
      } catch {
        continue;
      }
      if (tmpBox.isEmpty()) continue;
      parts.sort((a, b) => a.maxDim - b.maxDim);
      const sizes = parts.map((p) => p.maxDim);
      groups.push({
        hulls,
        parts,
        sizes,
        // 资产可以自己申报更严的剔除阈值（userData.lodPx）：便利店内部与贩卖机里的
        // 饮料标签是需求点名的「每层都要看得见」，2 cm 的色带不能被远景剔除吃掉。
        px: Number.isFinite(child.userData?.lodPx) ? child.userData.lodPx : null,
        center: tmpBox.getCenter(new THREE.Vector3()),
        radius: Math.max(0.35, tmpBox.getSize(new THREE.Vector3()).length() * 0.42),
        hullOn: null,
        cut: -1,
      });
      }
    }
  }
  collectInstances(root);

  let acc = 0;
  let active = true;

  engine.onUpdate((dt) => {
    if (!active) return;
    acc += dt;
    if (acc < cfg.interval) return;
    acc = 0;
    const cam = engine.camera.position;
    const pxScale = pxToScale();                       // 1 m 在 1 m 处占多少像素
    for (const g of groups) {
      const d = Math.max(0.2, cam.distanceTo(g.center) - g.radius);
      // 描边壳开关加滞回：临界距离上逐帧开关就是「一闪一闪」的直接来源
      const hr = cfg.hullRange;
      const wantHull = g.hullOn == null ? d < hr : g.hullOn ? d < hr * 1.06 : d < hr * 0.94;
      if (g.hullOn !== wantHull) {
        g.hullOn = wantHull;
        for (let i = 0; i < g.hulls.length; i++) g.hulls[i].visible = wantHull;
      }
      /* 零件隐藏也要滞回：必须隐藏的前缀 = size < limit；已隐藏的零件只要 size < limit×带宽
         就维持原状。相机在临界距离上轻微推进/后退（含惯性拖尾）时，
         没有带宽的话每一帧都会翻一批 visible，画面持续闪烁，且 visible 集合抖动
         还会让 draw calls 上下跳。 */
      const limit = (d * (g.px ?? cfg.pxThreshold)) / pxScale;   // 小于阈值的零件尺寸上限（米）
      const mustHide = lowerBound(g.sizes, limit);
      const mayKeep = lowerBound(g.sizes, limit * cfg.hysteresis);
      const prev = g.cut < 0 ? mustHide : g.cut;
      const lo = Math.min(mayKeep, Math.max(mustHide, prev));
      if (lo !== g.cut) {
        const from = Math.min(g.cut, lo),
          to = Math.max(g.cut, lo);
        for (let i = Math.max(0, from); i < to; i++) g.parts[i].n.visible = i >= lo;
        g.cut = lo;
      }
    }
  });

  return {
    groups,
    get stats() {
      let hulls = 0, hullOn = 0, parts = 0, hidden = 0;
      for (const g of groups) {
        hulls += g.hulls.length;
        parts += g.parts.length;
        if (g.hullOn) hullOn += g.hulls.length;
        hidden += Math.max(0, g.cut);
      }
      return { groups: groups.length, hulls, hullOn, parts, partsHidden: hidden };
    },
    set(enabled) {
      if (enabled === active) return;
      active = enabled;
      if (enabled) {
        acc = cfg.interval;
        return;
      }
      for (const g of groups) {
        for (const h of g.hulls) h.visible = true;
        for (const p of g.parts) p.n.visible = true;
        g.hullOn = true;
        g.cut = -1;
      }
    },
    ranges: cfg,
    /**
     * 换档用：改像素阈值与描边距离。
     * 必须把 g.cut 复位成 -1，否则滞回会把上一档的判定结果继续延用，
     * 表现为「降档了但要转一下镜头才生效」。
     */
    setThresholds(o = {}) {
      Object.assign(cfg, o);
      for (const g of groups) {
        g.cut = -1;
        g.hullOn = true;
      }
      acc = cfg.interval;
    },
  };
}

