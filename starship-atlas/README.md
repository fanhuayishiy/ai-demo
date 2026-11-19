# 星舰档案 · 第十五次飞行

2026 年 11 月 13 日，星舰 S42 与超重型助推器 B22 从得克萨斯州 Starbase 升空。热分离后，B22 转向近海，S42 则入轨并部署 26 颗星链卫星。约 22 个半小时后，S42 返回二号发射台，由塔架机械臂接住。这座 Three.js 工作台可以从整箭、单个部件和八个飞行姿势观察这次任务。[在线预览](https://fanhuayishiy.github.io/ai-demo/starship-atlas/dist/)

## 操作

- **看飞行**。点击「播放飞行」，可暂停、调节回放倍速或拖动进度。点击「查看塔架捕获」直接观察 S42 与机械臂的位置关系。
- **选姿势**。顶部「静态姿势」可切换整箭构型、热分离、翻转减速等定格场景。拖动模型旋转，用滚轮、双指或缩放按钮调整距离。
- **拆看部件**。点击模型上的部件，或从「观察部件」选择对象。可查看上面级、助推器、两级发动机组、猛禽发动机、隔热瓦、前后襟翼、栅格舵、一体式热分离段、舰首锥段、发射塔和捕获机械臂。拖动「拆解程度」可逐步拉开各组结构，再移回 0% 复原。

飞行回放压缩了各阶段用时，章节时间按公开任务时间表取整。模型外形、轨迹、运动速度和拆解间距用于科普示意。浏览器无法启用三维渲染时，工作台会展示从同一模型生成的静态视图。

## 本地运行

本项目的静态入口为 [./dist/](./dist/)。在合集仓库根目录启动静态服务器后，打开本地预览。

```sh
python -m http.server 8000 --bind 127.0.0.1
```

[打开本地预览](http://127.0.0.1:8000/starship-atlas/dist/)

## 资料与署名

- 飞行顺序及回收结果取自 SpaceX 的任务记录。网页右上角「任务资料」还可查看助推器转向近海、卫星部署和捕获上面级的原始发布。[SpaceX 第十五次飞行](https://www.spacex.com/launches/starship-flight-15)
- 模型采用 Three.js 几何体与程序化纹理绘制。第三代助推器的三片栅格舵、外露发动机与一体式热分离段参考了 NASA 和 SpaceX 的公开资料。[NASA 风洞测试与构型说明](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/nasa-spacex-advance-wind-tunnel-tests-for-starship-rocket/)
- 地球地平线背景取自国际空间站第 20 次远征队拍摄的照片 ISS020-E-047807，由 NASA Earth Observatory 发布。[NASA 原始影像](https://science.nasa.gov/earth/earth-observatory/thunderstorms-on-the-brazilian-horizon-41052/)
- 界面使用 Barlow Condensed 和 IBM Plex Mono，字体随附 SIL Open Font License。[Barlow Condensed 许可证](./dist/fonts/barlowcondensed-LICENSE.txt) · [IBM Plex Mono 许可证](./dist/fonts/ibmplexmono-LICENSE.txt)

## 主生成提示（原文）

> 去网上查询星舰资料，建立一个3D网页threejs，展示星舰从发射到回收的全过程。要求建模精细，界面美观，并且每个部位有单独展示。

> 你按照最新的一次，最后回落是塔架捕获的，不要在下面放那么多图鉴和时间线。整体是一个3D建模，后面可以在上面选择它的静态姿势，然后对静态部件进行放大拆解。
