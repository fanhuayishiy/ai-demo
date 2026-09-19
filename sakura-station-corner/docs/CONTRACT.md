# docs/CONTRACT.md — 资产模块接口契约（所有资产作者必读）

引擎层已就绪。**资产 = 一个独立 `.js` 文件 = 一个 `build()` 函数 = 一个 `THREE.Group`。**
不得修改 `src/core/**`、`src/world/**`、`src/motion/**`（除清单明确指派），不得新增 npm 依赖。

## 1. 文件模板（严格照此结构）

```js
//  assets/street/vending-machine.js —— 饮料自动贩卖机（含玻璃门与每层饮料）
import * as THREE from 'three';
import { grp, mesh, box, cyl, rbox, put, finish, rand, range, weather, decal, inst } from '../../core/kit.js';
import { MAT } from '../../core/materials.js';
import { TEX } from '../../core/textures.js';
import { PAL } from '../../core/palette.js';

export const meta = {
  id: 'vending-machine',
  real: [1.13, 1.85, 0.75],   // 真实尺寸（米），供装配层核对比例
  origin: 'ground-center',    // 原点 = 底面中心，+Y 朝上，正面朝 +Z
};

export function build(options = {}) {
  const rnd = rand(options.seed ?? 2024);
  const g = grp('vending-machine');
  // ... 建模 ...
  return finish(g, { outline: 'normal' });   // 必须调用 finish()
}
export default build;
```

硬性要求：
- **原点 = 物件与地面接触面的中心**，`+Y` 向上，**正面朝 +Z**（装配层用 `rotY` 转向）。
- 单位是米。便利店层高 2.85m、自动贩卖机 1.85m、樱树 5~6m、站台面 +0.72m。
- 只 import `src/core/*`，**不得** import 其它资产文件（避免耦合）。
- `build()` 必须**纯函数**：不读写全局状态、不依赖 DOM 之外的东西、同一 options 结果确定（用 `rand(seed)`）。
- 结尾必须 `finish(group, {...})`（自动补描边壳）。
- 不写 UI/文字浮层；日文文字只能出现在道具贴面上（看板、海报、商品标签）。
- 禁止 `BufferGeometryUtils.merge`、禁止把多个物件塞进一个循环糊出来。

## 2. `src/core/kit.js` API

| 函数 | 说明 |
| --- | --- |
| `grp(name, {pos,rotY,rot,scale})` | Group；`rotY` 用**角度** |
| `mesh(geo, mat, {name,pos,rot,scale,cast,receive,renderOrder,frustumCulled})` | Mesh，默认投影+接收阴影 |
| `m(geo,mat,x,y,z)` / `mrx(...)` / `mrz(...)` | 快捷放置（rx/rz 绕 X/Z 转角度） |
| `box(w,h,d)` `rbox(w,h,d,r,seg)` `cyl(rt,rb,h,seg,open)` `cone` `sph` `tor` `plane` `circ` `capsule` | 图元（自动缓存，可安全复用） |
| `lathe(points,seg)` | 车削：`points=[[x,y],...]`（瓶/罐/杯） |
| `tubeOf(points,r,seg,radial,closed)` | 曲线管（电线、扶手、车架） |
| `catenary(a,b,sag,seg)` | 悬链线点集（电线两端锚定） |
| `coil(r,h,turns,seg,wire)` | 螺旋管（冷凝器、弹簧） |
| `pipe(points,r,mat,opts)` | 曲线管+材质一步到位 |
| `hoop(r,t,mat,opts)` | 圆环箍 |
| `grill(parent,{w,h,nx,ny,bar,mat,pos,rot})` | 格栅 |
| `bottle(points,seg,mat,opts)` | 车削瓶 |
| `row(parent,count,dx,cb,{z,y,x0})` | 线性排布，**每个仍是独立对象**；`cb(i,x,t)` 返回 Object3D |
| `grid(parent,nx,nz,dx,dz,cb,{y})` | 矩阵排布 |
| `radial(parent,count,r,cb,{a0,sweep})` | 极轴排布 |
| `along(parent,curve,count,cb)` | 沿曲线排布 |
| `weather(parent,{w,h,pos,rot,kind,color,opacity,seed,density,count,spread})` | 做旧贴花：`kind` = `chip`掉漆 / `rust`锈 / `dirt`污 / `scratch`划 / `moss`苔 |
| `decal(parent,{map,w,h,pos,rot,color,opacity,order,side})` | 任意贴图贴花（海报、污渍、贴纸残片） |
| `shadowBlob(parent,{r,pos,opacity,color})` | 接触软阴影斑（小物件落地） |
| `inst(geo,mat,count,cb,{name,cast,receive})` | InstancedMesh（**仅**花瓣/叶/砕石/草等海量同质件）；`cb(i,dummy,rnd,color)` |
| `rand(seed)` / `range(rnd,a,b)` | 确定性随机 |
| `put(obj,x,y,z)` `rotY(obj,deg)` `add(p,...c)` | 变换辅助 |
| `bounds(group)` | `{bb,size,center}` |
| `finish(group,{outline,minSize,exclude,origin})` | 收尾：描边壳（`'thin'/'normal'/'bold'` 或数值） |

## 3. `src/core/materials.js` → `MAT.*`（同参数自动共享实例）

`paint` `plastic` `hardPlastic` `metalPaint` `metal` `stainless` `chrome` `darkIron` `galvanized`
`glass` `glassLite` `water` `wood` `bark` `asphalt` `concrete` `paving` `stone` `ballast` `tactile`
`grass` `roofTile` `corrugated` `paper` `poster` `fabric` `rubber` `petal` `leaf` `bulb` `lampShade`
`screen` `ledOn` `ledOff` `marking` `decal` `food` `rice` `nori` `bread` `liquidBottle` `canBody`

要点：
- **贴图已承载基色**，`color` 只做二次染色；预设默认白底，勿重复压暗。
- 常用参数：`{ repeat, uv:{repeat:[x,y],offset:[x,y]}, worn, spec, rim, shadowAmt, steps, side, transparent, opacity, alphaTest, emissive, emissiveIntensity, pulse, wind }`
- `glass` 是真实折射（MeshPhysical），大面积橱窗/贩卖机门用它；小窗/展示罩用 `glassLite`（省开销）。
- 需要单独呼吸的灯具：把 `userData.breathe = {speed,amount,phase}` 挂在灯具根节点上（动效层会自动派生独立材质）。
- 需要树枝/花瓣微动：给对应 Group 挂 `userData.sway = {amp,freq,phase,axis}`；材质级风动可用 `MAT.petal({wind:{amp,freq,base,span}})`。

## 4. `src/core/textures.js` → `TEX.*`（程序化贴图，全部缓存）

`asphalt` `concrete` `paving` `tile` `wood` `bark` `metal` `wear` `paper` `fabric` `ballast`
`tactile({kind:'dot'|'line'})` `drinkLabel({name,sub,ml,a,b})` `signboard({text,sub,bg,fg,stripe})`
`poster({title,sub,bg,accent,seed})` `adStrip({text,bg,seed})` `petal({tone,mode:'single'|'cluster'})`
`leafCluster({base,seed})` `frost` `storeFloor` `grass` `roofTile` `corrugated`
`lightPanel({text,bg,fg,mode:'led'|'sign',rows})` `gradient({stops})` `ramp(steps)`

- 返回 `{map, normalMap}`（`wear/signboard/poster/drinkLabel/lightPanel/petal/leafCluster` 直接返回 Texture）。
- 需要新纹理：在本资产文件内用 `makeCanvas()/toTexture()/heightToNormal()` 自行绘制，**不要改 core**。

## 5. 质量红线（会被逐条检查）

1. 结构完整：背面、底面、被遮挡面都要有内容（便利店内部尤其不得出现"纸片墙"）。
2. 每件道具至少 3 处**经年磨损**证据（掉漆/锈/污/褪色/变形/修补）。
3. 金属、玻璃、塑胶、木材、沥青、花瓣、树皮必须肉眼可辨（用不同 `spec/sheen/steps/map`）。
4. 不得出现 z-fighting：共面必须用 `decal`（自带 polygonOffset）或留出 ≥3mm 间隙。
5. 不得穿模：相交部件留出装配间隙，门/抽屉可开合处保留缝。
6. 细节密度：以 1m 距离观察仍有可读细节（螺栓、接缝、倒角、线缆、标签、条码）。
7. 单物件网格数不设上限，但**禁止**用一个图元假装复杂形状。
8. 颜色必须来自 `PAL`（或在其基础上微调），保持全场景色调统一。

## 6. 自检

```bash
npm run check          # 离线 import + build()，检查异常/空组
node tools/shoot.mjs --views=store --wait=1500   # 需要完整世界时由主控执行
```
资产作者本地只需保证 `npm run check` 通过且 `build()` 无异常。

## 7. 例外：货架可消费商品（唯一允许的跨资产 import）

便利店内部的**商品单体**（`src/assets/products/*.js`）是独立文件、独立模型；
**货架/冷柜等陈列设备**（`src/assets/interior/*.js`）允许 import 商品模块来填满陈列（这是真实摆货，不是批量合成）。
方向必须单向：`interior → products`，商品**绝不** import 设备或货架。

商品模块统一接口（所有 products 文件必须遵守）：

```js
export const meta = { id: 'drink-bottle', real: [0.066, 0.225, 0.066] };
// options: { seed=1, scale=1, variant=..., tint=..., pack=1 }
export function build(options = {}) { ... }   // 返回 Group
```

商品几何契约（货架据此排布）：
1. **原点 = 底面中心**，底面恰在 y=0（放到层板上时 `pos.y = 层板顶面高度`）。
2. **+Y 朝上，正面朝 +Z**（标签正面朝顾客）。
3. `meta.real = [宽, 高, 深]`（米，含包装），误差 ≤2mm，货架按此留位。
4. 同一 `variant` 必须形状稳定；不同 `variant` 形状/配色必须不同。
5. 商品自身**不调用 finish()**（由货架统一补描边，避免重复描边壳）。
6. `pack>1` 时可返回多件组合（如 6 本一排の酸奶），仍为独立 Mesh 集合。

现有商品 variant 清单（货架作者按此调用，商品作者必须实现）：

| 文件 | variant | 尺寸 real(m) |
| --- | --- | --- |
| `products/drink-bottle.js` | tea/cola/water/orange/milk/coffee/grape/sport/green/malt/yogurt | 0.066×0.225×0.066（500ml） |
| `products/drink-can.js` | coffee/cola/beer/tea/juice/energy/chazuke | 0.065×0.122×0.065 |
| `products/milk-carton.js` | milk1000/milk500/juice/soy/lactic | 0.075×0.205×0.065 |
| `products/onigiri.js` | salmon/kombu/tunamayo/mentaiko/okaka | 0.075×0.055×0.06 |
| `products/bento-box.js` | chicken/sashimi/salad/pasta/tendon/ekiben | 0.17×0.05×0.12 |
| `products/sushi-tray.js` | nigiri6/roll4/chirashi/sashimi5 | 0.19×0.045×0.13 |
| `products/cup-noodle.js` | shrimp/curry/soy/miso/seafood | 0.095×0.095×0.095 |
| `products/chip-bag.js` | salt/udon/shio/nori/kettle/cheese | 0.11×0.21×0.055 |
| `products/candy-bar.js` | choco/caramel/mint/kinoko/almond/gum | 0.045×0.155×0.012 |
| `products/tissue-pack.js` | tissue/wet/handkerchief/paper | 0.19×0.05×0.10 |
| `products/zen-sets.js` | daikon/egg/konnyaku/satsuma/norimaki/chikuwa | 0.055×0.05×0.05 |
| `products/ice-cream.js` | bar/cup/parfait/mochi/popsicle/twin | 0.065×0.09×0.065 |
| `products/coffee-cup.js` | s/m/l + lid 颜色 | 0.078×0.098×0.078 |
| `products/magazine-item.js` | weekly/comic/magazine/newspaper/women | 0.21×0.30×0.02 |
| `products/daily-goods.js` | battery/umbrella/towel/pen/notebook/razor/wiper | 0.06×0.16×0.03 |
| `products/snack-shelf-pack.js` | boxsnack/jelly/pudding/yogurt/cookie/ice | 0.12×0.06×0.09 |
| `products/bread-set.js` | toast/melonpan/anpan/sandwich/cream/roll | 0.11×0.05×0.09 |
| `products/deli-tray.js` | salad/karaage/hamburgu/edamame/sushi-roll/potato | 0.15×0.045×0.11 |
| `products/price-tag.js` | shelf/hook/floor/pop/new100/sale | 0.06×0.03×0.004 |
| `products/trash-liner.js` | pet-bottle/can/empty/wrapper | 0.066×0.22×0.066 |
