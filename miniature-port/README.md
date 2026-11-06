# 微缩港口 · Golden Hour Miniature Port

一座可自由旋转的 1:87 微缩港口沙盘：奶油白石膏托盘、黄铜边框、蓝绿松石海水、芥末黄岸桥，连同潮水、灯火与归港的船，一起收进黄昏的暖光里。支持日暮／夜航切换、六个预设视角、3D 投影热点、微缩景深与三档画质。

[在线预览](https://fanhuayishiy.github.io/ai-demo/miniature-port/index.html)

本目录是 **Vite 生产构建产物**（`dist/` 的内容），无后端、无外部模型或贴图资源，所有几何与纹理都在运行时程序化生成。构建产物使用相对路径 `./assets/...`，可放在任意子目录下静态托管。

## 主生成提示（原文）

**原文未能核验**：本项目最初的创建请求发生在本地会话中，会话中途被压缩，最初那条消息的逐字内容未随项目归档，因此这里不冒充历史原文，也不把工作分解复述成用户的原话。可确认的背景是：最初要求以「智能体团队」协作方式构建一份可自由旋转、符合审美、超高精度的微缩港口作品，并声明 token 预算不受限；该请求曾被中断后原样重发一次。

以下是**可逐字核验**的后续用户请求，按时间顺序保留：

```text
继续
```

```text
优化一下性能，当前太卡了
```

```text
还是很卡而且很糊，优化到60fps
```

```text
前端地址是什么
```

```text
提交到https://github.com/fanhuayishiy/ai-demo上
```

### 无法核验的部分

团队编制、模块划分、坐标契约、审美细则、性能预算与全部实现约束都属于会话内的工作分解，不是用户的逐字原文，故不在此复述为「原文」。这些决定的技术结论记录在下文「关键实现」与「验证与边界」里。

## 一键复现提示词

以下是**根据最终成品新整理**的复现提示，不是历史原文。它描述的是「重做一遍需要交代什么」，可以直接拿去问模型。

```text
用 Vite + Three.js r170 做一个浏览器端可自由旋转的 3D 微缩港口沙盘，目标 60fps。

审美：
- 1:87 微缩模型感，奶油白石膏托盘 + 黄铜边框，蓝绿松石海水，芥末黄岸桥，
  珊瑚橘／薄荷绿集装箱，深海军蓝船体；长阴影、tilt-shift 微缩景深、ACES 色调映射。
- 不要裸奔的大色块：每个 >3m 的平面都要有分缝／条纹／污渍；
  建筑、船、吊机必须分件；倒角优先；重复元素用 InstancedMesh；细节宁多勿少。

内容：
- 岸壁、防波堤、扭王字消波块、突堤、海床、托盘与铭牌；
- 压型肋屋顶仓库、油罐区、控制塔、灯塔、围墙、路灯、行道树、道路标线；
- 3 台 STS 岸桥（小车／吊具／钢丝绳可动）、2 台 RTG、约 136 个高精度集装箱、集卡；
- 程序化海水：Gerstner 波、解析法线、深度渐变、菲涅尔、暖阳高光带、岸线泡沫；
- 货轮、拖轮、游艇、帆船、渔船、浮标、V 形尾迹与船首白沫；
- 天空球：日夜渐变、日月、星点、云团、远山与城市剪影、雾带、尘埃；
- 旗帜、海鸥、栏杆、爬梯、轮胎护舷、标识牌、救生圈、小人偶、缆绳、水渍等微细节；
- 日暮／夜航双模式，夜景有灯塔旋转光束与 17 盏注册灯光。

交互：OrbitControls 拖拽旋转／滚轮缩放／右键平移；六个预设视角、3D 投影热点与信息卡、
时段切换、自动环绕、微缩景深开关、三档画质、曝光滑块、保存画面。

性能要求（很重要）：
- 按「材质实例 + castShadow + receiveShadow」合并静态几何，但必须先用多帧 diff
  （世界矩阵／position.version／visible）自动识别动态对象及其后代并从合批中排除，
  不能破坏动画闭包；共享材质的 opacity／emissiveIntensity 变化不要纳入动态快照。
- 白天隐藏 17 盏夜景灯（visible=false，不是 intensity=0），装配期用 renderer.compile
  预编译另一时段的 shader variant，避免首次切夜集中重编译。
- 阴影图低频刷新、按世界包围盒裁剪小件投影物。
- 后处理只用 RenderPass + 轻量 tilt-shift + OutputPass，UnrealBloomPass 默认关，
  夜景用 4 采样的高亮扩散替代。
- EffectComposer 的离屏 RT 必须显式带 samples 开启 MSAA
  （WebGLRenderer 的 antialias 对离屏渲染完全无效）；
  DPR 自适应下限锁 1.0，绝不靠把分辨率降到 1 以下去救帧率。
- FPS 统计要用未截断的帧间隔，否则低帧率会被 clamp 虚高，自适应判断失灵。
```

## 功能亮点

- **沙盘本体**：圆角矩形石膏托盘、分层亚克力海水侧壁、黄铜／木质边框、金属铭牌；海床礁石只绕 Y 轴旋转并压在水下，用 rejection sampling 避开航道。
- **水与天**：水面是手写 `ShaderMaterial`，多层 Gerstner 波 + 解析法线 + 深度渐变 + 菲涅尔 + 岸线距离场泡沫；天空是 BackSide 天空球，日夜渐变、日月、星点、云、远山与城市剪影。
- **昼夜**：`applyNight()` 统一切换背景、雾、环境贴图、曝光与 UI；各模块通过 `setNight` 改发光强度。夜景有灯塔旋转光束、岸桥障碍灯、船桅灯与红绿导灯。
- **微缩感**：tilt-shift 只在画面上下边缘轻微失焦、增饱和暖调；尺寸对照靠 13 个小人偶、栏杆、救生圈、锥桶、轮胎护舷等小件建立。
- **交互**：全景／岸桥／船坞／灯塔／俯瞰／水线六个预设视角带补间；热点投影到屏幕并弹出信息卡；画质三档可运行时切换。

## 技术栈

- Three.js `^0.170.0`（ES Modules）、Vite `^6.0.0`
- `EffectComposer` / `RenderPass` / `ShaderPass` / `OutputPass`，手写 GLSL
- 无框架、无后端、无外部资产；构建时 `base: './'`

## 运行方式

直接起任意静态服务器即可，不需要 npm install：

```bash
cd miniature-port
python -m http.server 8080
# 打开 http://127.0.0.1:8080/
```

也可以用 `npx vite preview` 指向包含本目录的父级。可选 URL 参数：

| 参数 | 作用 |
| --- | --- |
| `?quality=smooth\|balanced\|fine` | 画质档：流畅／均衡／精细 |
| `?msaa=0\|2\|4` | 覆盖离屏 RT 的 MSAA 采样数 |
| `?time=night` | 直接以夜航模式打开 |
| `?view=overview\|cranes\|berth\|lighthouse\|top\|water` | 直接跳到指定视角 |
| `?capture=1` | 立即隐藏加载遮罩（截图验收用） |

## 目录结构

```text
miniature-port/
├── index.html                 # 页面骨架与 UI
├── assets/
│   ├── index-*.js             # 主程序（渲染器、装配、后处理、交互）
│   ├── index-*.css            # UI 样式
│   └── {base,infrastructure,machinery,vessels,water,atmosphere,lighting,details}-*.js
└── README.md
```

主程序用动态 `import()` 渐进装配 8 个 world 模块；共享上下文 `ctx` 提供坐标契约、配色、材质工厂、几何工具与随机数，模块之间不互相 import。

## 关键实现

### 清晰度

- **MSAA 在离屏 RT 上**：`new WebGLRenderTarget(w*dpr, h*dpr, { type: HalfFloatType, samples })` 显式传给 `EffectComposer`。r170 默认创建的 RT 没有 `samples`，而 `WebGLRenderer({ antialias:true })` 只作用于默认 framebuffer，对 composer 链路完全无效——这是早期画面发糊的头号根因。
- **分辨率不再被牺牲**：旧自适应把 DPR 一路压到 0.65，形成「卡 → 降分辨率 → 更糊」的死循环。现在下限锁死 1.0，均衡档上限 1.5、精细档 2.0；掉帧时优先关景深，MSAA 恒定保留。
- **减少全屏模糊**：Bloom 默认关（白天阈值 0.90 几乎无收益却要约 11 个全屏 pass），tilt-shift 从 16 次采样降到 4 次，UI 去掉 3 处叠在全屏 WebGL 上的 `backdrop-filter`。

### 帧率

| 指标 | 优化前 | 第一轮 | 定稿 |
| --- | --- | --- | --- |
| draw calls／帧 | 8968 | 2391 | **1746** |
| Mesh | 4907 | 2345 | 1689 |
| castShadow | 4014 | 758 | 220 |
| 三角面／帧 | 915251 | 509207 | 458994 |
| 白天可见灯 | 21 | 4 | 4 |
| 全屏后处理 pass | ~13 | ~13 | 2–3 |

- `findDynamicObjects()` 用多帧 diff 自动识别动态对象及其后代，让静态合批从两个白名单模块扩展到全部 8 个模块：infra 2314→41、base 309→20、details 487→42、machinery 201→14；vessels 的 421 个动画 Mesh 被正确排除。
- 水面细分 220×160→128×88、Gerstner 6→4 层；天空把夜景计算包进 `if (uNight > 0.001)`，白天跳过星点／月轮／城市余晖。
- `renderer.info.autoReset=false` + 每帧手动 reset，才能统计整帧所有 pass 的 draw calls。

## 验证与边界

- 8 个 world 模块全部通过静态验收；`npm run build` 成功（主包约 765 kB / gzip 202 kB）。
- 生产预览下白天、夜景、流畅三档截图均零 console／runtime／log 错误；三处顺序与缩略图由仓库测试守护。
- **性能边界**：项目开发机只有 headless Chrome + SwiftShader 纯软件渲染，HUD 仅 5 FPS，长时间 CDP 帧测量会超时，因此**没有在本机证明 60fps**。上表是可复现的结构性指标，不是真机帧率；请在有真实 GPU 的浏览器里看右下角 FPS，流畅档（`?quality=smooth`，关 MSAA／景深、DPR 1.0、512 阴影图）是最接近 60fps 的档位。
- 这是视觉演示，不是港口工程仿真：船体、潮汐、灯光与作业流程都是程序化示意，不对应任何真实港区，也不含碰撞检测。
- 需要 WebGL2 与 `EXT_color_buffer_float`（HalfFloat 离屏 RT）；极老设备或禁用硬件加速的浏览器可能无法运行。
