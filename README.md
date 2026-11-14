# AI Demo Collection

AI 辅助生成的交互式前端作品合集，包含三维场景、数字孪生、机械展示和网页小游戏。每个项目独立运行，并提供源码、运行说明与生成提示词。

[![Open Source](https://img.shields.io/badge/open%20source-MIT-8fc79b?style=flat-square)](./LICENSE)

[在线浏览全部项目](https://fanhuayishiy.github.io/ai-demo/) · [项目访客统计](https://fanhuayishiy.github.io/ai-demo/stats/) · [本地运行](#本地运行) · [新增项目](#新增项目) · [维护文档](./docs/maintaining.md)

各项目 README 的 **主生成提示（原文）** 保留可核验的原始请求；无法核验的历史原文会明确说明，整理后的复现提示词另行标注。

## 项目列表

点击截图可查看大图，通过“在线”链接进入项目；所有缩略图均来自项目实际运行画面或项目内渲染资源，统一为 16:9 静态 WebP。

| 截图 | 项目 | 一句话简介 | 预览 | 详细文档 |
| --- | --- | --- | --- | --- |
| <a href="./assets/project-thumbnails/habitat-interactive-home.webp"><img src="./assets/project-thumbnails/habitat-interactive-home.webp" width="160" height="90" alt="栖居 HABITAT · 家庭 3D 空间"></a> | habitat-interactive-home | 栖居 HABITAT 可探索家庭 3D 模型，多灯独立控制、家电交互与智能隐墙 | [在线](https://fanhuayishiy.github.io/ai-demo/habitat-interactive-home/dist/) | [README](./habitat-interactive-home/README.md) |
| <a href="./assets/project-thumbnails/orbit-heatpump-washer-dryer.webp"><img src="./assets/project-thumbnails/orbit-heatpump-washer-dryer.webp" width="160" height="90" alt="ORBIT · 热泵洗烘结构实验室"></a> | orbit-heatpump-washer-dryer | ORBIT 热泵洗烘一体机，3D 爆炸拆解、热循环与进排水结构交互 | [在线](https://fanhuayishiy.github.io/ai-demo/orbit-heatpump-washer-dryer/dist/) | [README](./orbit-heatpump-washer-dryer/README.md) |
| <a href="./assets/project-thumbnails/boeing-787-digital-twin.webp"><img src="./assets/project-thumbnails/boeing-787-digital-twin.webp" width="160" height="90" alt="AEROSTRUCT · 波音 787-9"></a> | boeing-787-digital-twin | AEROSTRUCT 波音 787-9 结构数字孪生大屏，3D 爆炸拆解、客舱剖视与模拟监测图表 | [在线](https://fanhuayishiy.github.io/ai-demo/boeing-787-digital-twin/dist/) | [README](./boeing-787-digital-twin/README.md) |
| <a href="./assets/project-thumbnails/sunny-side-kindergarten.webp"><img src="./assets/project-thumbnails/sunny-side-kindergarten.webp" width="160" height="90" alt="小小晴天 · 童趣幼儿园"></a> | sunny-side-kindergarten | 小小晴天实时 3D 幼儿园，22 名儿童与 3 名老师、六区聚焦、人物跟随及自动漫游 | [在线](https://fanhuayishiy.github.io/ai-demo/sunny-side-kindergarten/dist/) | [README](./sunny-side-kindergarten/README.md) |
| <a href="./assets/project-thumbnails/hydrogen-energy-system.webp"><img src="./assets/project-thumbnails/hydrogen-energy-system.webp" width="160" height="90" alt="H₂ NEXUS · 综合能源数字孪生"></a> | hydrogen-energy-system | H₂ NEXUS 含氢综合能源数字孪生，五类能流动态可视化与守恒仿真 | [在线](https://fanhuayishiy.github.io/ai-demo/hydrogen-energy-system/) | [README](./hydrogen-energy-system/README.md) |
| <a href="./assets/project-thumbnails/campus-3d-dashboard.webp"><img src="./assets/project-thumbnails/campus-3d-dashboard.webp" width="160" height="90" alt="智慧校园 3D 数据大屏"></a> | campus-3d-dashboard | 智慧校园 3D 数据大屏（单 HTML 文件） | [在线](https://fanhuayishiy.github.io/ai-demo/campus-3d-dashboard/) | [README](./campus-3d-dashboard/README.md) |
| <a href="./assets/project-thumbnails/mcb-2p-c16-blender-animation.webp"><img src="./assets/project-thumbnails/mcb-2p-c16-blender-animation.webp" width="160" height="90" alt="双极空气开关精细建模"></a> | mcb-2p-c16-blender-animation | 双极空气开关 Blender 精细建模与 22 秒 8 章节工程动画 | [在线](https://fanhuayishiy.github.io/ai-demo/mcb-2p-c16-blender-animation/) | [README](./mcb-2p-c16-blender-animation/README.md) |
| <a href="./assets/project-thumbnails/voxel-construction-site.webp"><img src="./assets/project-thumbnails/voxel-construction-site.webp" width="160" height="90" alt="方寸之间 · 体素工地沙盘"></a> | voxel-construction-site | 体素微缩建筑工地沙盘「方寸之间」（Three.js r160 完全离线单 HTML） | [在线](https://fanhuayishiy.github.io/ai-demo/voxel-construction-site/preview.html) | [README](./voxel-construction-site/README.md) |
| <a href="./assets/project-thumbnails/voxel-ramen-stall.webp"><img src="./assets/project-thumbnails/voxel-ramen-stall.webp" width="160" height="90" alt="深夜拉面摊 · 体素沙盘"></a> | voxel-ramen-stall | 体素微缩深夜拉面摊沙盘（Three.js r160 完全离线单 HTML） | [在线](https://fanhuayishiy.github.io/ai-demo/voxel-ramen-stall/preview.html) | [README](./voxel-ramen-stall/README.md) |
| <a href="./assets/project-thumbnails/sakura-station-corner.webp"><img src="./assets/project-thumbnails/sakura-station-corner.webp" width="160" height="90" alt="樱花街角 · 电车与便利店"></a> | sakura-station-corner | 樱花街角 · 电车与便利店微缩三维沙盘（102 个独立资产模块，五档天气，画面无文字浮层） | [在线](https://fanhuayishiy.github.io/ai-demo/sakura-station-corner/dist/) | [README](./sakura-station-corner/README.md) |
| <a href="./assets/project-thumbnails/sanfang-qixiang-atlas.webp"><img src="./assets/project-thumbnails/sanfang-qixiang-atlas.webp" width="160" height="90" alt="三坊七巷 · 坊巷漫游"></a> | sanfang-qixiang-atlas | 三坊七巷 · 坊巷漫游：基于真实地图的 3D 古城导览，支持搜索、缩放与点击飞行 | [在线](https://fanhuayishiy.github.io/ai-demo/sanfang-qixiang-atlas/dist/) | [README](./sanfang-qixiang-atlas/README.md) |
| <a href="./assets/project-thumbnails/terra-728-tractor-blender-animation.webp"><img src="./assets/project-thumbnails/terra-728-tractor-blender-animation.webp" width="160" height="90" alt="TERRA 728 · 现代四驱拖拉机"></a> | terra-728-tractor-blender-animation | 现代四驱拖拉机 Blender 精细建模与 15 秒机械动画 | [在线](https://fanhuayishiy.github.io/ai-demo/terra-728-tractor-blender-animation/) | [README](./terra-728-tractor-blender-animation/README.md) |
| <a href="./assets/project-thumbnails/sunset-flight-study.webp"><img src="./assets/project-thumbnails/sunset-flight-study.webp" width="160" height="90" alt="夕空飞行 · Just breathe"></a> | sunset-flight-study | 夕空飞行 · 奶油白单翼机穿越紫金云海，近距离按键驾驶与官方原曲配乐 | [在线](https://fanhuayishiy.github.io/ai-demo/sunset-flight-study/dist/) | [README](./sunset-flight-study/README.md) |
| <a href="./assets/project-thumbnails/warehouse-demo.webp"><img src="./assets/project-thumbnails/warehouse-demo.webp" width="160" height="90" alt="WareTrack · 仓储运营中心"></a> | warehouse-demo | WareTrack 单仓三维运营中心，叉车搬运闭环、库存任务联动、对象聚焦与镜头巡游 | [在线](https://fanhuayishiy.github.io/ai-demo/warehouse-demo/dist/client/) | [README](./warehouse-demo/README.md) |
| <a href="./assets/project-thumbnails/modular-fire-response.webp"><img src="./assets/project-thumbnails/modular-fire-response.webp" width="160" height="90" alt="FIRELINK · 分布式智能消防"></a> | modular-fire-response | FIRELINK 分布式消防概念演示，三机共用一根水带、移动增压、循环补水与无人机物资投送 | [在线](https://fanhuayishiy.github.io/ai-demo/modular-fire-response/dist/) | [README](./modular-fire-response/README.md) |
| <a href="./assets/project-thumbnails/roadster-escape-toll.webp"><img src="./assets/project-thumbnails/roadster-escape-toll.webp" width="160" height="90" alt="Roadster 逃离收费站"></a> | roadster-escape-toll | Roadster 逃离收费站：三车道切换、空中翻滚、飞越车辆补气与缓慢提速，保留原有玩家车模 | [在线](https://fanhuayishiy.github.io/ai-demo/roadster-escape-toll/) | [README](./roadster-escape-toll/README.md) |
| <a href="./assets/project-thumbnails/ocean-shallows.webp"><img src="./assets/project-thumbnails/ocean-shallows.webp" width="160" height="90" alt="浅海 · Ocean Shallows"></a> | ocean-shallows | 俯视视角的热带浅海：白沙沙滩、随风摇曳的棕榈树、由浅绿松石渐变到深蓝的海水，水下焦散光网与七种热带鱼，点击水面投下涟漪 | [在线](https://fanhuayishiy.github.io/ai-demo/ocean-shallows/) | [README](./ocean-shallows/README.md) |
| <a href="./assets/project-thumbnails/ship-in-a-bottle.webp"><img src="./assets/project-thumbnails/ship-in-a-bottle.webp" width="160" height="90" alt="瓶中沧海 · 前进·梅利号"></a> | ship-in-a-bottle | 玻璃瓶里的体素海洋，前进·梅利号四点浪高采样浮沉绕岛，四档天气、时刻滑杆与 Space 风暴，全部封闭在瓶内（Three.js r160 单 HTML） | [在线](https://fanhuayishiy.github.io/ai-demo/ship-in-a-bottle/) | [README](./ship-in-a-bottle/README.md) |
| <a href="./assets/project-thumbnails/rubiks-cube-lab.webp"><img src="./assets/project-thumbnails/rubiks-cube-lab.webp" width="160" height="90" alt="三阶魔方实验室 · CUBE / LAB"></a> | rubiks-cube-lab | 纯 CSS 3D Transform 的可交互三阶魔方实验室：27 块独立块体沿同心圆弧转层、明暗随朝向动态变化、拖拽视角、20 步打乱与一键复原，单文件零外部资源 | [在线](https://fanhuayishiy.github.io/ai-demo/rubiks-cube-lab/) | [README](./rubiks-cube-lab/README.md) |
| <a href="./assets/project-thumbnails/miniature-port.webp"><img src="./assets/project-thumbnails/miniature-port.webp" width="160" height="90" alt="微缩港口 · Golden Hour Miniature Port"></a> | miniature-port | 可自由旋转的 1:87 微缩港口沙盘：石膏托盘、芥末黄岸桥与程序化海水，日暮与夜航双模式，六视角与三档画质 | [在线](https://fanhuayishiy.github.io/ai-demo/miniature-port/) | [README](./miniature-port/README.md) |
| <a href="./assets/project-thumbnails/atelier-104.webp"><img src="./assets/project-thumbnails/atelier-104.webp" width="160" height="90" alt="ATELIER 104 · 机械键盘工作台"></a> | atelier-104 | 原创 104 键机械键盘，主题定制、五层拆解与 3D 实键自动检测 | [在线](https://fanhuayishiy.github.io/ai-demo/atelier-104/dist/) | [README](./atelier-104/README.md) |
| <a href="./assets/project-thumbnails/cyber-rain-district.webp"><img src="./assets/project-thumbnails/cyber-rain-district.webp" width="160" height="90" alt="雨港 · 霓虹夜"></a> | cyber-rain-district | 单文件三维雨夜街区，霓虹在湿地与玻璃中映光，斜雨和薄雾构成夜间氛围。 | [在线](https://fanhuayishiy.github.io/ai-demo/cyber-rain-district/) | [README](./cyber-rain-district/README.md) |
| <a href="./assets/project-thumbnails/sagrada-familia.webp"><img src="./assets/project-thumbnails/sagrada-familia.webp" width="160" height="90" alt="Sagrada Família · 圣家堂建造时间线"></a> | sagrada-familia | 默认蓝调夜景的圣家堂三维展示，支持 1882—2026 年建造时间线、18 塔规划全貌与环绕探索。 | [在线](https://fanhuayishiy.github.io/ai-demo/sagrada-familia/) | [README](./sagrada-familia/README.md) |
| <a href="./assets/project-thumbnails/songfeng-town.webp"><img src="./assets/project-thumbnails/songfeng-town.webp" width="160" height="90" alt="松风镇 · 体素乡村漫步"></a> | songfeng-town | 暖色体素小镇，沿路探索小屋、菜园与树林，和村民聊天、采摘胡萝卜并穿过木桥 | [在线](https://fanhuayishiy.github.io/ai-demo/songfeng-town/dist/) | [README](./songfeng-town/README.md) |

## 本地运行

优先使用上方“在线”链接体验。需要本地运行时，在目标项目 README 中查看对应命令：

- **静态项目**：在仓库根目录运行 `python -m http.server 8000`，再打开 `http://localhost:8000/` 选择项目。
- **已有构建产物**：同样通过静态服务打开该项目的 `dist/`（部分项目为 `dist/client/`）。
- **修改并开发项目**：进入项目目录，按其 README 安装依赖并启动；各项目的技术栈和启动命令并不相同。

完整发布副本的构建与检查见[维护文档](./docs/maintaining.md#预览页统一-github-入口与自动发布)。

## 项目速览

以下为简短介绍，完整功能、操作、资源与验证边界见各项目 README。

## habitat-interactive-home — 栖居 HABITAT 家庭 3D 空间

探索客厅、卧室、书房、餐厨与卫浴，点选设备控制灯光和家电，遮挡墙体自动淡出。基于原创示例户型，使用 React、Three.js 与 Vite。

[在线预览](https://fanhuayishiy.github.io/ai-demo/habitat-interactive-home/dist/) · [README（含主生成提示原文）](./habitat-interactive-home/README.md)

## orbit-heatpump-washer-dryer — ORBIT 热泵洗烘结构实验室

通过整机、分层爆炸、内部拆解和热泵循环四种视图，探索洗烘一体机的结构与管路。附渲染图及拆装动画，模型为概念示意。

[在线预览](https://fanhuayishiy.github.io/ai-demo/orbit-heatpump-washer-dryer/dist/) · [README（含主生成提示原文）](./orbit-heatpump-washer-dryer/README.md)

## boeing-787-digital-twin — AEROSTRUCT 波音 787-9 结构数字孪生大屏

以波音 787-9 为外形参考，支持爆炸拆解、客舱剖视、部件联动和数据导出。监测面板使用模拟数据，非官方 CAD 或实时遥测。

[在线预览](https://fanhuayishiy.github.io/ai-demo/boeing-787-digital-twin/dist/) · [README（含主生成提示原文）](./boeing-787-digital-twin/README.md)

## sunny-side-kindergarten — 小小晴天实时 3D 幼儿园

低多边形微缩幼儿园，虚拟儿童与老师按预设路径开展课堂、阅读和户外活动。支持区域聚焦、人物跟随、自动漫游与移动端操作。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sunny-side-kindergarten/dist/) · [README（含主生成提示原文）](./sunny-side-kindergarten/README.md)

## hydrogen-energy-system — H₂ NEXUS 综合能源数字孪生

探索光伏、风电、制氢、储氢及燃料电池联动的三维能源园区。五色能流由本地守恒仿真驱动，运行资源随静态产物提供。

[在线预览](https://fanhuayishiy.github.io/ai-demo/hydrogen-energy-system/) · [README（含主生成提示原文）](./hydrogen-energy-system/README.md)

## campus-3d-dashboard — 智慧校园 3D 数据大屏

等距视角校园与数据看板，包含车辆循环、喷泉粒子、昼夜切换和双相机模式。单 HTML 项目，运行时依赖 CDN。

[在线预览](https://fanhuayishiy.github.io/ai-demo/campus-3d-dashboard/) · [README（含主生成提示原文）](./campus-3d-dashboard/README.md)

## mcb-2p-c16-blender-animation — 双极空气开关建模与工程动画

Blender 程序化建模的双极空气开关，提供工程动画、可编辑模型与渲染图。在线查看器支持旋转、章节跳转及进度拖动，内部机构为原理示意。

[在线交互展示](https://fanhuayishiy.github.io/ai-demo/mcb-2p-c16-blender-animation/) · [README（含主生成提示原文）](./mcb-2p-c16-blender-animation/README.md)

## voxel-construction-site — 体素微缩建筑工地沙盘「方寸之间」

挖掘机、渣土车、塔吊与工人在微缩工地协同作业，配有昼夜循环和模拟暴雨。Three.js 已内嵌，可离线运行；采样审计范围见项目文档。

[在线预览](https://fanhuayishiy.github.io/ai-demo/voxel-construction-site/preview.html) · [README（含主生成提示原文）](./voxel-construction-site/README.md)

## voxel-ramen-stall — 体素微缩深夜拉面摊沙盘

摊主、食客、外卖摩托与流浪猫组成微缩夜市，支持天色切换与模拟夜雨。使用确定性程序动画，碰撞与越界的采样验证见项目文档。

[在线预览](https://fanhuayishiy.github.io/ai-demo/voxel-ramen-stall/preview.html) · [README（含主生成提示原文）](./voxel-ramen-stall/README.md)

## sakura-station-corner — 樱花街角 · 电车与便利店微缩三维沙盘

电车、便利店、贩卖机与落樱组成微缩街角，支持五档天气及三渲二风格切换。几何与纹理在项目内生成，无运行时外部图片与 CDN。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sakura-station-corner/dist/) · [README（含主生成提示原文）](./sakura-station-corner/README.md)

## sanfang-qixiang-atlas — 三坊七巷 · 坊巷漫游

基于 OpenStreetMap 街巷与建筑轮廓的三维古城导览，支持搜索、点击飞行、俯瞰和自动漫游。建筑高度与装饰为风格化复原。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sanfang-qixiang-atlas/dist/) · [README（含主生成提示原文）](./sanfang-qixiang-atlas/README.md)

## terra-728-tractor-blender-animation — 现代四驱拖拉机建模与机械动画

虚构型号 TERRA 728 拖拉机的 Blender 模型与机械演示，展示转向、机罩、车门及悬挂等机构。提供可编辑模型、渲染图与交互查看器，参数为艺术调整。

[在线预览](https://fanhuayishiy.github.io/ai-demo/terra-728-tractor-blender-animation/) · [README（含主生成提示原文）](./terra-728-tractor-blender-animation/README.md)

## sunset-flight-study — 夕空飞行 · Just breathe

奶油白单翼机穿越紫金云海，支持电影航线、近距离驾驶与自由观察，配有官方流播音乐。提供原始请求及复现提示词；音乐权利不包含在代码的 MIT 许可中。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sunset-flight-study/dist/) · [README（含主生成提示原文）](./sunset-flight-study/README.md) · [当前版本完整复现提示词](./sunset-flight-study/docs/RECREATE_PROMPT.zh-CN.md)

## warehouse-demo — WareTrack 仓储运营中心

三维仓储园区中，卡车、叉车与托盘完成循环搬运，库存、任务和月台面板共享状态。支持搜索、聚焦、暂停与镜头巡游，业务数据均为本地模拟。

[在线预览](https://fanhuayishiy.github.io/ai-demo/warehouse-demo/dist/client/) · [README](./warehouse-demo/README.md) · [当前项目完整复现提示词](./warehouse-demo/docs/RECREATE_PROMPT.zh-CN.md)

## modular-fire-response — FIRELINK 分布式智能消防

三机共用水带的分布式消防概念演示，包含移动增压、循环补水与重载无人机物资投送。运动与供水为前端概念示意，不用于实际救援决策。

[在线预览](https://fanhuayishiy.github.io/ai-demo/modular-fire-response/dist/) · [README](./modular-fire-response/README.md) · [当前项目完整复现提示词](./modular-fire-response/docs/RECREATE_PROMPT.zh-CN.md)

## roadster-escape-toll — Roadster 逃离收费站

驾驶搭载冷气推进器的 Roadster，在三条车道间平滑切换，长按点火飞越收费站，空中翻滚，完整飞越车辆按高度返还冷气。车速缓慢提升，提供失败建议、手机操作与本地排行榜；车模参考官方渲染图制作，项目可离线运行。

[在线预览](https://fanhuayishiy.github.io/ai-demo/roadster-escape-toll/) · [README（含主生成提示原文）](./roadster-escape-toll/README.md) · [官方渲染侧视叠加对比](./roadster-escape-toll/docs/official-render-compare.png)

## ocean-shallows — 浅海 · Ocean Shallows

俯视热带浅海，探索白沙、棕榈树、渐变海水、焦散与七种热带鱼，点击水面生成涟漪。几何与纹理程序化生成，并通过预烘焙减少每帧计算。

[在线预览](https://fanhuayishiy.github.io/ai-demo/ocean-shallows/) · [README（含主生成提示原文）](./ocean-shallows/README.md)

## ship-in-a-bottle — 瓶中沧海 · 前进·梅利号

横卧玻璃瓶里装着一整片体素海洋：前进·梅利号按四点浪高采样浮沉绕岛，灯塔光束扫过浪尖、鲸鱼周期性跃身出水、水底沉着宝箱与沉船遗物。晴/多云/雨/雾四档天气平滑过渡，时刻滑杆与黎明-正午-黄昏-子夜跳转驱动昼夜流转，按住 Space 掀起风暴——瓶体摇晃而水面保持水平。所有元素由瓶体 SDF 裁剪严格封闭在瓶内，任何视角不越轮廓。

[在线预览](https://fanhuayishiy.github.io/ai-demo/ship-in-a-bottle/) · [README（含主生成提示原文）](./ship-in-a-bottle/README.md)

## rubiks-cube-lab — 三阶魔方实验室 · CUBE / LAB

纯 CSS 3D Transform 打造的可交互三阶魔方实验室：27 个独立立方块、54 张圆角贴纸，转层动画用同构 rotate3d + matrix3d 关键帧，9 块沿同一轴走同心圆弧无撕裂。支持拖拽旋转视角（6px 阈值锁定防慢拖误触）、点击色块转层、键盘方向键与 Shift 反向、R 键 20 步打乱与空格一键瞬时复原。数学坐标系与 CSS 屏幕系经 D=diag(1,-1,1) 换轴，整数坐标与 3×3 朝向矩阵驱动全部状态，单文件零图片零外部资源。

[在线预览](https://fanhuayishiy.github.io/ai-demo/rubiks-cube-lab/) · [README（含主生成提示原文）](./rubiks-cube-lab/README.md)

## miniature-port — 微缩港口 · Golden Hour Miniature Port

奶油白石膏托盘里收进一整座黄昏的集装箱码头：岸桥、货轮、灯塔、控制塔与蓝绿松石海水全部程序化生成，可自由旋转并切换日暮／夜航。针对卡顿与发糊重做了渲染管线：离屏 MSAA、全模块安全合批、Bloom 默认关闭、DPR 下限锁 1.0。开发机为纯软件渲染，60fps 需在真实 GPU 上实测。

[在线预览](https://fanhuayishiy.github.io/ai-demo/miniature-port/) · [README（含主生成提示原文）](./miniature-port/README.md)

## atelier-104 — ATELIER 104 · 机械键盘工作台

自定义外壳与键帽主题，旋转查看原创 104 键模型并探索五层结构。进入页面即可在 3D 预览上检测真实键盘，支持本地方案保存、导入导出与检测结果导出。

[在线预览](https://fanhuayishiy.github.io/ai-demo/atelier-104/dist/) · [README（含主生成提示原文）](./atelier-104/README.md)

## cyber-rain-district — 雨港 · 霓虹夜

原生 WebGL 2 程序化生成街区、招牌字形与材质，表现积水倒影、玻璃映光、雨滴涟漪和远景薄雾。支持轻微镜头视差、暂停、全屏与 PNG 导出，独立 HTML 可离线运行。

[在线预览](https://fanhuayishiy.github.io/ai-demo/cyber-rain-district/) · [README（含主生成提示原文）](./cyber-rain-district/README.md)

## sagrada-familia — Sagrada Família · 圣家堂建造时间线

沿 1882—2026 年时间线观察圣家堂主要构件逐步生长，切换日景、蓝调夜景与 18 塔规划全貌。支持环绕、缩放、平移、立面特写和点击聚焦，单文件 HTML 可直接运行。

[在线预览](https://fanhuayishiy.github.io/ai-demo/sagrada-familia/) · [README（含主生成提示原文）](./sagrada-familia/README.md)

## songfeng-town — 松风镇 · 体素乡村漫步

在斜俯视的松风镇里慢慢散步，探索三栋彩色小屋、中央广场、菜园和河对岸的树林。WASD 或方向键移动，靠近村民、告示牌与成熟作物按 E 互动，支持碰撞、平滑跟随镜头及轻微环境动画；模型全部程序生成。

[在线预览](https://fanhuayishiy.github.io/ai-demo/songfeng-town/dist/) · [README（含主生成提示原文）](./songfeng-town/README.md)

---

## 新增项目

先阅读 [AGENTS.md](./AGENTS.md)，准备独立项目目录、项目 README 和实际运行截图，再使用 `npm run add:project` 追加到末尾。截图必须是 640×360 的静态 WebP，大于 1000 且小于 80000 字节。

[追加命令与参数](./docs/maintaining.md#用脚本追加推荐) · [部署与本地验证](./docs/maintaining.md#预览页统一-github-入口与自动发布) · [截图分享](./docs/maintaining.md#截图分享) · [访问量与隐私](./docs/maintaining.md#本页访问量与隐私)

发布前运行 `npm test` 和 `npm run build:pages`。CI 检查失败会停止部署；项目顺序、截图规范与统一预览入口必须保留。

---

代码采用 [MIT License](./LICENSE)；项目中的第三方素材与依赖以各自许可为准。友链：[LINUX DO 社区](https://linux.do/)。
