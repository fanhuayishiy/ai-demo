# AI Demo Collection

AI 辅助生成的交互式前端 Demo 合集。每个项目都是独立可运行的完整作品，后续会持续新增其他项目。

## 项目列表

| 项目 | 简介 | 状态 |
| --- | --- | --- |
| [campus-3d-dashboard](./campus-3d-dashboard/) | 智慧校园 3D 数据大屏（单 HTML 文件） | 可运行 |
| [mcb-2p-c16-blender-animation](./mcb-2p-c16-blender-animation/) | 双极空气开关 Blender 精细建模与工程动画（主提示：调研空气开关，作为参考，然后使用 Blender 精细建模，我的标准很高，都要有动画） | 已交付 |

---

## campus-3d-dashboard — 智慧校园 3D 数据大屏

基于 Three.js 的单文件 3D 交互大屏：等距视角校园场景 + Chart.js 数据看板叠加，支持昼夜切换、双相机切换、悬停提示，以及持续运转的车辆、喷泉等动态元素。

### 功能亮点

**3D 场景**

- 等距视角（OrthographicCamera，类策略游戏俯瞰），OrbitControls 可拖拽旋转缩放
- 场景中心是标准运动场：蓝色圆角矩形跑道（ShapeGeometry 挖洞）+ 绿色足球场（Canvas 纹理画白线）
- 8 栋不同尺寸的现代建筑：白色 BoxGeometry 主体 + 屋顶女儿墙 + 入口雨棚 + 四面蓝色玻璃窗（MeshPhysicalMaterial clearcoat 0.4，窗户高度动态计算、上下留 10% 边距）+ 底层装饰带，建筑方向通用、底部严格对齐地面
- 分层锥体树冠 + 圆柱树干的树木分散在校园内部和道路四周，渐变草皮贴片放在树下
- 校园边界：围墙 + 大门 + 门卫亭；校园内环圆角马路 + 四条市政道路（深灰路面、白色虚线边线、黄色虚中心线）
- 外围 3 环排布约 60 栋低多边形城市建筑（近/中/远环高度递减），与校内白色建筑形成层次
- 浅色路径连接各建筑，长椅、旗杆 + 旗帜点缀场景
- 路灯沿马路两侧对称排布（灯头朝路面、不压路），操场四角设高杆投光灯

**动态元素**

- 12 辆汽车（车身 + 驾驶舱 + 保险杠 + 轮子 + 前大灯 SpotLight + 尾灯）沿四条道路对向循环行驶，速度各异，到达尽头循环回另一端
- 三层喷泉粒子系统（350 粒子，PointsMaterial + AdditiveBlending，Canvas 径向渐变柔光贴图）：中心高速水柱 / 中速水帘 / 外层散开，重力下落、落水重置

**昼夜系统**

- 一键切换白天/夜景：夜景背景与雾色 #162030，ambient 0.24、sun 0.55、toneMappingExposure 0.85
- 夜景下建筑窗户 emissive 变暖黄 #ffcc77，路灯与车灯 SpotLight 全部点亮、灯泡 emissiveIntensity 提到 2.2，白天自动关闭

**交互与 UI**

- Raycaster 悬停建筑显示跟随鼠标的半透明 tooltip（userData 存名称，transition 过渡动画，pointer 光标）
- 右上角按钮：切换透视/正交相机（PerspectiveCamera 40° FOV，切换时保持视角位置与 controls.target 不变）、切换夜景/白天
- Chart.js 数据看板叠加层：顶部毛玻璃导航栏（标题 + 在校人数 12860 / 教职工 1240 / 建筑面积 28.6 万㎡ 三个统计指标）
- 左侧三张图表面片（backdrop-filter blur、圆角 14px、可滚动）：月度校园活跃度折线图（3 条线、12 个月学期波动）、各学院人数柱状图（7 学院七彩圆角柱）、设施使用占比环形图（6 类设施）
- resize 同时更新正交与透视两种相机的投影矩阵

**渲染质量**

- DirectionalLight + AmbientLight + HemisphereLight 三光自然照明
- PCFSoftShadowMap 柔和阴影 + ACESFilmicToneMapping 色调映射
- SpotLight 数量控制在 40 个以内，粒子单 geometry 复用，稳定流畅

### 技术栈

| 依赖 | 版本 | 引入方式 |
| --- | --- | --- |
| Three.js | 0.160+ | ES Module（import map，jsDelivr CDN） |
| OrbitControls | 同上 | ES Module |
| Chart.js | 4.4 | UMD CDN |

零构建工具、零外部图片/模型资源，单 HTML 文件直接运行。

### 运行方式

直接双击 `index.html` 在浏览器打开即可（需联网加载 CDN 依赖）。

也可以起一个本地静态服务器：

```bash
# 任选其一
python -m http.server 8123
npx serve .
```

然后访问 `http://127.0.0.1:8123`。

### 目录结构

```
campus-3d-dashboard/
├── index.html      # 完整大屏（HTML + CSS + JS 单文件）
└── index.html.bak  # 迭代过程的历史备份版本
```

---

## mcb-2p-c16-blender-animation — 双极空气开关 Blender 精细建模与工程动画

主生成提示：调研空气开关，作为参考，然后使用 Blender 精细建模，我的标准很高，都要有动画。

基于公开产品尺寸与灭弧原理的无品牌热磁式微型断路器（MCB）示意模型，使用 Blender 5.2.1 程序化精细建模，交付 22 秒、8 章节工程动画，以及可编辑 `.blend`、通用 `.glb`、1080P 成片和 2560 × 1440 渲染图。内部机构为原理性示意，不是 ABB 原厂 CAD、制造图纸或电气性能仿真。

### 功能亮点

**建模与结构**

- 分极外壳、真实中空壳体、端子开孔、细倒角、模具分缝、筋条与外壳标记
- 双极联动手柄、贯通连接轴、动静触点、共同脱扣轴、内部支架与销轴
- 铜线磁脱扣线圈、铁芯、撞针、扭簧与复位弹簧
- 10 片有间隙的灭弧栅、弧道与分段灭弧示意
- 双金属片形变、随触点变形的编织铜软连接
- 真实凹槽和螺纹的端子螺钉、中空接线框、独立升降夹板
- 35 mm 导轨、安装槽、可活动卡扣及背部释放窗口

场景共 441 个对象、328 个网格对象、72 个动画数据块。模型以米存储，界面使用毫米单位；整体名义外形约为 35 × 88 × 69 mm，少量凸起印字不计入名义尺寸。

**动画章节**

时间轴为 1–528 帧、24 fps，完整片长 22 秒：

| 帧段 | 内容 |
| --- | --- |
| 1–72 | 整机旋转展示 |
| 73–143 | 联动手柄及快速分合闸 |
| 144–192 | 外壳剖视、内部机构展示 |
| 193–238 | 磁脱扣、触点分离、弧道与灭弧栅示意 |
| 239–287 | 双金属片形变与热脱扣示意 |
| 288–384 | 分层爆炸、螺钉松脱与回装 |
| 385–464 | DIN 导轨进入、卡扣释放与锁定 |
| 465–528 | 最终装配展示 |

**验证与质量**

- 316 个产品网格全部流形、无非法坐标，关键网格与体积检查通过
- 触点先于手柄到位：92 < 100、204 < 218、269 < 281
- GLB 包含组合时间轴与 17 个形变动画节点，校验零问题
- MP4 为 1920 × 1080 H264，528 帧解码回读比对 MAE < 0.71、PSNR > 46 dB
- 三张 2560 × 1440 Cycles 渲染图覆盖外观、剖面和爆炸视角

### 技术栈

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| Blender | 5.2.1 LTS | 程序化建模、动画、渲染、视频编码 |
| Python | Blender 内置 | 生成与验证脚本 |
| glTF 2.0 | 导出格式 | 通用 `.glb` 交付 |

### 运行方式

- 动画成片：直接播放 `MCB_2P_Engineering_Animation.mp4`
- 可编辑场景：用 Blender 5.2.1 或更新版本打开 `MCB_2P_C16_Animated.blend`，在时间轴播放
- 通用模型：`MCB_2P_C16_Animated.glb` 可拖入支持 glTF 的查看器或引擎
- 静帧展示：查看 `01_Hero.png`、`02_Cutaway.png`、`03_Exploded.png`

### 目录结构

```
mcb-2p-c16-blender-animation/
├── 00_Exterior_Preview.png       # 外观预览
├── 01_Hero.png                   # 主视觉
├── 02_Cutaway.png                # 剖视图
├── 03_Exploded.png               # 爆炸图
├── MCB_2P_C16_Animated.blend     # 主场景与动画
├── MCB_2P_C16_Animated.glb       # 通用模型
├── MCB_2P_Engineering_Animation.mp4
├── README.md                     # 项目详细说明与参考限制
└── Validation_Summary.json       # 校验摘要
```

---

## 新增项目

后续新项目直接在根目录建独立文件夹，并在上方「项目列表」表格中补一行即可。建议每个项目自带 README 或在文件夹内说明运行方式。
