# 智慧校园 3D 数据大屏

基于 Three.js 的单文件 3D 交互大屏：等距视角校园场景 + Chart.js 数据看板叠加，支持昼夜切换、双相机切换、悬停提示，以及持续运转的车辆、喷泉等动态元素。

> 在线演示：<https://fanhuayishiy.github.io/ai-demo/campus-3d-dashboard/>

零构建工具、零外部图片/模型资源，单个 HTML 文件直接运行（Three.js 与 Chart.js 走 CDN，需联网）。

## 主生成提示（原文）

> 创建一个校园3D可视化场景的HTML文件，使用Three.js的ES Module导入方式。
>
> 要求：
>
> 1. 等距视角（OrthographicCamera，类似策略游戏视角），带OrbitControls可拖拽旋转缩放
> 2. 场景居中是一个标准运动场——蓝色圆角矩形跑道，内部是绿色足球场（Canvas纹理画白线）
> 3. 8栋不同尺寸的现代建筑分布在运动场周围，每栋有：
>      \- 白色BoxGeometry主体 + 屋顶女儿墙 + 入口雨棚
>      \- 四面均匀排布的蓝色玻璃窗户（PlaneGeometry）
>      \- 底层装饰带
> 4. 不同高度和半径的树木散布在场景中（分层锥体树冠 + 圆柱树干）
> 5. 浅色路径连接各建筑
> 6. 渐变草皮贴片点缀地面增加自然感
> 7. 使用DirectionalLight+AmbientLight+HemisphereLight实现自然光照
> 8. 开启阴影（PCFSoftShadowMap）+ ACES色调映射
>

## 功能亮点

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

## 技术栈

| 依赖 | 版本 | 引入方式 |
| --- | --- | --- |
| Three.js | 0.160+ | ES Module（import map，jsDelivr CDN） |
| OrbitControls | 同上 | ES Module |
| Chart.js | 4.4 | UMD CDN |

## 运行方式

本地运行：直接双击 `index.html` 在浏览器打开即可（需联网加载 CDN 依赖）。

也可以起一个本地静态服务器：

```bash
# 任选其一
python -m http.server 8123
npx serve .
```

然后访问 `http://127.0.0.1:8123/campus-3d-dashboard/`。

## 目录结构

```
campus-3d-dashboard/
├── index.html      # 完整大屏（HTML + CSS + JS 单文件）
└── index.html.bak  # 迭代过程的历史备份版本
```

## 边界说明

统计数据（在校人数、学院人数、活跃度、设施占比）全部是写死的演示数值，不连接任何后端或真实校园数据；建筑、树木与车辆为程序化低多边形模型，不代表真实校园测绘。
