# AI Demo Collection

AI 辅助生成的交互式前端 Demo 合集。每个项目都是独立可运行的完整作品，各自放在根目录一个独立文件夹里，细节写在该文件夹自己的 `README.md` 中；本文件只做索引。

[![Open Source](https://img.shields.io/badge/open%20source-MIT-8fc79b?style=flat-square)](./LICENSE)

本仓库以 MIT License 开源，欢迎复用、改进和提交新的交互式 Demo。

- 许可证：[MIT License](./LICENSE)
- 项目首页：<https://fanhuayishiy.github.io/ai-demo>

每个项目的 `README.md` 都固定含一节 **`## 主生成提示（原文）`**，逐字收录当初的生成提示，不做改写；本索引不复制提示词。

## 项目列表

| 项目 | 一句话简介 | 预览 | 详细文档 |
| --- | --- | --- | --- |
| habitat-interactive-home | 栖居 HABITAT 可探索家庭 3D 模型，多灯独立控制、家电交互与智能隐墙 | [在线](https://fanhuayishiy.github.io/ai-demo/habitat-interactive-home/dist/) | [README](./habitat-interactive-home/README.md) |
| hydrogen-energy-system | H₂ NEXUS 含氢综合能源数字孪生，五类能流动态可视化与守恒仿真 | [在线](https://fanhuayishiy.github.io/ai-demo/hydrogen-energy-system/) | [README](./hydrogen-energy-system/README.md) |
| campus-3d-dashboard | 智慧校园 3D 数据大屏（单 HTML 文件） | [在线](https://fanhuayishiy.github.io/ai-demo/campus-3d-dashboard/) | [README](./campus-3d-dashboard/README.md) |
| mcb-2p-c16-blender-animation | 双极空气开关 Blender 精细建模与 22 秒 8 章节工程动画 | [在线](https://fanhuayishiy.github.io/ai-demo/mcb-2p-c16-blender-animation/) | [README](./mcb-2p-c16-blender-animation/README.md) |
| voxel-construction-site | 体素微缩建筑工地沙盘「方寸之间」（Three.js r160 完全离线单 HTML） | [在线](https://fanhuayishiy.github.io/ai-demo/voxel-construction-site/preview.html) | [README](./voxel-construction-site/README.md) |
| voxel-ramen-stall | 体素微缩深夜拉面摊沙盘（Three.js r160 完全离线单 HTML） | [在线](https://fanhuayishiy.github.io/ai-demo/voxel-ramen-stall/preview.html) | [README](./voxel-ramen-stall/README.md) |
| sakura-station-corner | 樱花街角 · 电车与便利店微缩三维沙盘（102 个独立资产模块，五档天气，画面无文字浮层） | [在线](https://fanhuayishiy.github.io/ai-demo/sakura-station-corner/dist/) | [README](./sakura-station-corner/README.md) |
| sanfang-qixiang-atlas | 三坊七巷 · 坊巷漫游：基于真实地图的 3D 古城导览，支持搜索、缩放与点击飞行 | [在线](https://fanhuayishiy.github.io/ai-demo/sanfang-qixiang-atlas/dist/) | [README](./sanfang-qixiang-atlas/README.md) |
| terra-728-tractor-blender-animation | 现代四驱拖拉机 Blender 精细建模与 15 秒机械动画 | [在线](https://fanhuayishiy.github.io/ai-demo/terra-728-tractor-blender-animation/) | [README](./terra-728-tractor-blender-animation/README.md) |

---

## habitat-interactive-home — 栖居 HABITAT 家庭 3D 空间

以原创 108㎡ 示例户型为基础的家庭 3D 交互前端：环绕观察客厅、主卧、书房、餐厨、卫浴与阳台，点选 22 件设备逐一控制；灯光、色温和环境时段实时影响三维空间的光影，遮挡视线的墙体自动淡出。React 19 + Three.js 0.180 + Vite。

[在线预览](https://fanhuayishiy.github.io/ai-demo/habitat-interactive-home/dist/) · [README（含主生成提示原文）](./habitat-interactive-home/README.md)

## hydrogen-energy-system — H₂ NEXUS 综合能源数字孪生

程序化三维能源园区 + 五色动态管线 + 本地守恒仿真：光伏、风电、PEM 电解槽、储氢罐、燃料电池、燃气热电联产、热泵与制冷机组按稳态功率分配联动，储氢罐有界积分。所有数值为本地仿真，不是现场遥测；依赖与字体全部随静态产物提供，无运行时 CDN。

[在线预览](https://fanhuayishiy.github.io/ai-demo/hydrogen-energy-system/) · [README（含主生成提示原文）](./hydrogen-energy-system/README.md)

## campus-3d-dashboard — 智慧校园 3D 数据大屏

单 HTML 文件的 3D 交互大屏：等距视角校园 + Chart.js 看板叠加，12 辆车在四条道路循环、三层喷泉粒子，支持昼夜切换、透视/正交双相机与建筑悬停提示。零构建工具、零外部图片，双击即可运行（依赖走 CDN）。

[在线预览](https://fanhuayishiy.github.io/ai-demo/campus-3d-dashboard/) · [README（含主生成提示原文）](./campus-3d-dashboard/README.md)

## mcb-2p-c16-blender-animation — 双极空气开关建模与工程动画

无品牌表达的热磁式微型断路器（MCB）：Blender 5.2.1 程序化建模 441 个对象，交付 22 秒 8 章节工程动画、可编辑 `.blend`、通用 `.glb`、1080P 成片与三张 2560×1440 渲染图。在线打开的是 Three.js 交互查看器页面，可直接旋转、跳转章节与拖拽进度。内部机构为原理性示意，不是原厂 CAD 或电气性能仿真。

[在线交互展示](https://fanhuayishiy.github.io/ai-demo/mcb-2p-c16-blender-animation/) · [README（含主生成提示原文）](./mcb-2p-c16-blender-animation/README.md)

## voxel-construction-site — 体素微缩建筑工地沙盘「方寸之间」

挖掘机挖土、渣土车接运卸料、塔吊分区吊运、搅拌车与装载机协同、工人各司其职，配完整四段昼夜循环与空格键模拟暴雨；桌面前方是三颗实体控制旋钮。Three.js r160 已内嵌，双击即可离线运行；运动体互撞与越界由 1201 点采样审计为 0。

[在线预览](https://fanhuayishiy.github.io/ai-demo/voxel-construction-site/preview.html) · [README（含主生成提示原文）](./voxel-construction-site/README.md)

## voxel-ramen-stall — 体素微缩深夜拉面摊沙盘

摊主抻面下锅、煮面篓起落、竹竿吊臂逐盏挂灯笼、外卖摩托循环取餐折返、食客与流浪猫往来，配四套天色与模拟夜雨（湿地面反光、水洼涟漪、灯光长倒影）。全部运动为纯 f(t) 确定性动画，与真实帧率解耦；480 秒 1921 点 OBB + SAT 审计为 0 穿模、0 越界。

[在线预览](https://fanhuayishiy.github.io/ai-demo/voxel-ramen-stall/preview.html) · [README（含主生成提示原文）](./voxel-ramen-stall/README.md)

## sakura-station-corner — 樱花街角 · 电车与便利店微缩三维沙盘

单线电车与站台、整面落地玻璃的 24 小时便利店（店内货架与商品逐件可读）、带玻璃门的贩卖机、电线杆与档间电线、三株樱花与持续落樱。102 个资产模块 + 14 个地图层 + 13 个引擎模块，纹理由 Canvas2D 程序化生成，无任何外部图片与 CDN；默认低多边形平涂，`?style=toon` 切三渲二，天气五档。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sakura-station-corner/dist/) · [README（含主生成提示原文）](./sakura-station-corner/README.md)

## sanfang-qixiang-atlas — 三坊七巷 · 坊巷漫游

以 OpenStreetMap 真实街巷与建筑平面轮廓为骨架的风格化古城导览：901 个建筑、107 段道路、294 个庭院内孔、19 个导览地点，白墙黛瓦与马鞍墙，支持景点搜索、点击飞行、3D/俯瞰切换与五站空中漫游。建筑高度与装饰为风格化复原，不是摄影全景或测绘模型。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sanfang-qixiang-atlas/dist/) · [README（含主生成提示原文）](./sanfang-qixiang-atlas/README.md)

## terra-728-tractor-blender-animation — 现代四驱拖拉机建模与机械动画

虚构命名的 TERRA 728 大型四驱 CVT 拖拉机概念模型：Blender 5.2.1 程序化建模 1482 个对象，1–360 帧六章节 15 秒机械演示动画（差速行驶、Ackermann 转向、机罩气弹簧开启、车门与副座、后三点抬升、雨刷与警示灯），交付 `.blend`、`.glb`、四张 Cycles 渲染图与本地依赖的交互查看器。轴距、角度与时序均为艺术调整，不得用于选型、制造或安全认证。

[在线预览](https://fanhuayishiy.github.io/ai-demo/terra-728-tractor-blender-animation/) · [README（含主生成提示原文）](./terra-728-tractor-blender-animation/README.md)

---

## 新增项目

新项目直接在根目录建独立文件夹，并写一份项目自己的 `README.md`，固定包含：

1. `## 主生成提示（原文）` —— 逐字收录提示词，不改写、不精简（需要拆解时另起 `###` 小节，原文保持不动）；
2. 功能亮点 / 技术栈 / 运行方式 / 目录结构 / 验证与边界。

本文件只补两样：「项目列表」表格加一行（预览链接指向可交互页面，不要指向 `.mp4` 等媒体文件），以及上方一段 2-4 句的速览（简介 + 预览/文档链接）。

---

友链：[LINUX DO 社区](https://linux.do/)。
