# AEROSTRUCT · 波音 787-9 结构数字孪生大屏

基于 React、Three.js 和 Recharts 的本地交互式航空工程可视化。首页直接呈现分层爆炸图，所有飞机部件均为真实三维几何，并非背景图片。

在线预览：<https://fanhuayishiy.github.io/ai-demo/boeing-787-digital-twin/dist/>

![AEROSTRUCT 波音 787-9 爆炸拆解大屏](./output/showcase.png)

## 主生成提示（原文）

> 帮我做一个波音飞机的3D爆炸图和拆解图的大屏，旁边要有一些大屏图表和面板。用尽你的全部能力和资源，把它做到最好看、最精致、最吸引人

## 运行方式

需要 Node.js 22.12+，在本项目目录执行：

```powershell
npm ci
npm run dev
```

默认打开 http://localhost:5173。开发端口被占用时，Vite 会在终端显示实际端口。

```powershell
npm run build
npm run preview
```

仓库从 `main` 分支根目录发布 GitHub Pages，因此 `dist/` 随源码一起提交，在线入口为 `boeing-787-digital-twin/dist/`。构建使用相对资源路径，支持嵌套子目录部署；修改源码后需重新构建并提交 `dist/`。不要直接双击开发入口 `index.html`，请通过 HTTP 服务访问。

## 功能亮点

- 整机、爆炸和剖面模式，连续拆解进度及可暂停的往复演示。
- 九大总成选择、三维点选、联动部件详情和局部高亮。
- 参数化机身、驾驶舱风挡、舷窗、翼型机翼、翼梢、尾翼、双发动机、风扇叶片、起落架，以及客舱座椅、地板梁和机身骨架。
- 鼠标或触摸旋转、缩放、四种镜头预设、自动旋转、部件标注和坐标网格。
- 材料构成、机翼应变、结构健康度、动力仪表、传感网络和检测记录。
- 全屏展示、PNG 视图导出及 JSON 检测报告导出。
- 手机、平板和桌面自适应布局；支持系统减少动态效果偏好。

## 技术栈

- React 19 + Vite 7：界面、状态管理、静态构建。
- Three.js 0.180：参数化飞机几何、材质、照明、轨道相机与射线拾取。
- Recharts 3 + Lucide React：监测图表和交互工具。
- 本地 Barlow Condensed / IBM Plex Mono 字体，中文使用系统字体。
- Node.js 内置测试、Playwright + PNG 像素检查；精确依赖版本见 `package-lock.json`。

## 预览图

- [爆炸拆解大屏](./output/showcase.png)
- [客舱剖面](./output/desktop-cutaway.png)
- [整机外观](./output/desktop-assembled.png)

## 验证与边界

```powershell
npm test
npm run build
npm run test:pages
npm run test:browser
```

`test:pages` 在仓库目录结构下自动启动临时静态服务，验证 README 和首页第三位排序，并在与 GitHub Pages 相同的嵌套路径下执行完整浏览器测试；不需要另外启动开发服务。`test:browser` 默认访问 `http://localhost:5173`，可通过环境变量 `AEROSTRUCT_URL` 指定其他开发、预览或线上地址。

浏览器测试使用已安装的 Google Chrome。测试包含真实 WebGL 画布像素检查、三种模式、暂停保持、旋转与拖拽、四种镜头、九大总成联动、全屏、报告和图片下载，以及 320–2560px 多尺寸的布局边界检查。截图与检测结果保存在 `test-results/`，不提交到仓库。

## 目录结构

```text
boeing-787-digital-twin/
├── index.html          # 开发入口
├── src/                # 飞机几何、三维场景、界面与图表
├── public/             # 图标及字体许可证
├── dist/               # 已构建的 GitHub Pages 在线版本
├── output/             # 爆炸、剖面和整机预览图
├── tests/              # 几何、状态、浏览器与发布路径验证
├── package-lock.json   # 可复现依赖版本
└── vite.config.js      # 相对子路径与第三方许可证构建配置
```

`src/scene/aircraft.js` 创建飞机，`geometry.js` 定义连续机身截面和翼型。`Scene.jsx` 负责灯光、相机、动画、点选与释放资源。`state.js` 管理模式及交互状态，`data.js` 保存可替换的示意数据，`App.jsx` 与 `components/Charts.jsx` 组成大屏。

字体、依赖和三维模型均随项目在本地提供；运行时不依赖外部图片或模型 CDN，也不调用第三方数据接口。

## 使用边界

这是独立制作的概念展示项目，不是波音官方软件。飞机外形以 787-9 为视觉参考，三维结构为参数化示意模型，不是厂商 CAD、维修手册或精确零部件图。健康度、质量、应力、温度、传感器及检测事件均为明确标注的模拟数据，不连接真实飞机，不得用于维护、适航或工程决策。

## 开源许可

项目遵循仓库根目录的 [MIT License](../LICENSE)。打包依赖的许可证由 Vite 自动输出至 [dist/THIRD-PARTY-LICENSES.md](./dist/THIRD-PARTY-LICENSES.md)。Barlow Condensed 与 IBM Plex Mono 的原始字体许可保留在 `public/licenses/`，并同步进入静态构建产物。飞机模型由代码程序化生成，未使用第三方飞机模型或产品照片；波音及机型名称仅用于说明视觉参考，不代表官方授权或关联。
