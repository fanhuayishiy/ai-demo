# docs/ASSET_CHECKLIST.md — 分阶段开发步骤清单（按序执行，完成打勾）

> 阶段 0~2 由主控完成。阶段 3 起资产逐个建模，可并行分发，但**一个文件只由一个人写**。
> 每完成一项：`npm run check` 必须通过，并在本文件打勾。

## 阶段 0 · 需求与规划（已完成）
- [x] 0.1 `AGENT.md` 核心需求与硬性约束固化
- [x] 0.2 `docs/LAYOUT.md` 布局方案（分区/坐标/机位/光影）
- [x] 0.3 `docs/CONTRACT.md` 资产接口契约
- [x] 0.4 本清单

## 阶段 1 · 工程骨架与引擎层（已完成）
- [x] 1.1 `package.json` / `vite.config.js` / `index.html`（仅入口，无 UI）
- [x] 1.2 `src/core/palette.js` 全场景调色板
- [x] 1.3 `src/core/textures.js` 程序化纹理库（沥青/混凝土/铺砖/木/树皮/金属/道床/盲道/海报/标签/花瓣/瓦/波纹/纸/织物/草/做旧贴花）
- [x] 1.4 `src/core/toon.js` 三渲二内核（渐变色阶 + 阴影冷染 + 卡通高光 + 边缘光 + 风动 + 呼吸 + 流光 + 抖动）
- [x] 1.5 `src/core/materials.js` 材质家族（42 个预设，含真实玻璃/水/金属/花瓣）
- [x] 1.6 `src/core/kit.js` 几何与组装工具（图元/曲线/阵列/做旧/贴花/实例化/收尾）
- [x] 1.7 `src/core/outline.js` 反壳描边
- [x] 1.8 `src/core/postfx.js` 屏幕空间描边 + 景深 + Bloom + 分级 + SMAA + 输出
- [x] 1.9 `src/core/lighting.js` 程序化天空环境 + 主光/半球/补光/反弹光
- [x] 1.10 `src/core/camera-rig.js` 拖拽 / 360° / 无极缩放
- [x] 1.11 `src/core/engine.js` 渲染主循环 + 多机位
- [x] 1.12 `tools/check-assets.mjs` 离线资产 smoke test
- [x] 1.13 `tools/shoot.mjs` 实拍校验（Playwright + 本机 Chrome）
- [x] 1.14 管线自检通过（材质/描边/阴影/景深/纹理全部可见证）

## 阶段 2 · 地图层（世界底图）
- [x] 2.1 `src/world/baseplate.js` 正方形纯色底座（40×40×1.6，倒角）
- [x] 2.2 `src/world/ground.js` 地表分层（草地/泥土/路基层/道床/法面高差）
- [x] 2.3 `src/world/road-network.js` 丁字路口柏油路网 + 路缘石 + 中心线 + 路侧带
- [x] 2.4 `src/world/crosswalk.js` 横断歩道（两处）+ 停止线 + 安全导流带
- [x] 2.5 `src/world/drainage.js` U 字側溝 + 集水桝 + 落し蓋
- [x] 2.6 `src/world/sidewalk.js` 歩道铺砖 + 段差 + 車道cpy 岛 + 南側法面
- [x] 2.7 `src/world/alley.js` 小巷（幅员 2.6m、側溝、注意標識、番地札、行き止まり）
- [x] 2.8 `src/world/station-platform.js` 站台（顶面 +0.72、端部階段、盲道、排水口）
- [x] 2.9 `src/world/station-track.js` 単線軌道（ゲージ 1.067、枕木、レール、道床、側溝）
- [x] 2.10 `src/world/level-crossing.js` 踏切（踏み板、遮断台、注意標識、誘導線）
- [x] 2.11 `src/world/index.js` 组装 + `src/world/placement.js` 落位总表（83 项清单，import.meta.glob 静态收集 + 异步装配）

## 阶段 3 · 植生（樱花优先，决定画面气质）
- [x] 3.1 `assets/flora/sakura-somei-yoshino.js` 染井吉野（树干分枝/树皮/花球/透光；seed 变化）
- [x] 3.2 `assets/flora/sakura-late-yaezeni.js` 晚樱八重红（浓密重瓣、深粉）
- [x] 3.3 `assets/flora/sakura-branch-detail.js` 近景细枝 + 花簇（地被枝、掉落枝）
- [x] 3.4 `assets/flora/street-tree-keyaki.js` 街路樹（新绿）
- [x] 3.5 `assets/flora/hedge.js` 生垣/植栽带
- [x] 3.6 `assets/flora/flower-bed.js` 站前花壇（パンジー・チューリップ）
- [x] 3.7 `assets/flora/grass-slope.js` 法面草 + 防護柵 + 田んぼ strip
- [x] 3.8 `assets/flora/potted-plant.js` 盆栽（店舗前・ホーム端）
- [x] 3.9 `assets/flora/ground-cover.js` 地被（苔、落叶层、土）

## 阶段 4 · 便利店建筑外壳
- [x] 4.1 `assets/store/convenience-store.js` 主体（基础/壁/天井/女墙/屋根/雨樋/配管/外部階段无）
- [x] 4.2 `assets/store/glass-curtain-wall.js` 大面積ガラスカーテンウォール（框・サッシ・反射・室内可见）
- [x] 4.3 `assets/store/auto-door.js` 自動ドア（センサー・開閉表示・床レール・安全ステッカー）
- [x] 4.4 `assets/store/awning.js` 雨棚 + 看板帯（三色帯）
- [x] 4.5 `assets/store/store-signage.js` 店招・立柱看板・夜間照明
- [x] 4.6 `assets/store/entrance-mat.js` 门口地垫
- [x] 4.7 `assets/store/exterior-poster-case.js` 屋外ポスターケース・チラシ
- [x] 4.8 `assets/store/backroom-door.js` 後扉（金属防火扉・施錠・表示）
- [x] 4.9 `assets/store/wall-facilities.js` 壁面設備（換気口・ダクト・ケーブル引き回し・避雷）
- [x] 4.10 `assets/store/pavement-frontage.js` 店舗前タイル・点字ブロック・段差・車止め

## 阶段 5 · 街道设施 A（店前点名项）
- [x] 5.1 `assets/street/vending-machine.js` **自动贩卖机（重点：真实玻璃门 + 每层饮料 + 面板/灯管/退出口/磨损）**
- [x] 5.2 `assets/street/vending-machine-tea.js` 第二形态（お茶/咖啡自販機，不同配色与商品）
- [x] 5.3 `assets/street/umbrella-stand.js` 雨伞架（含多把伞：透明塑料伞、折叠伞、长伞）
- [x] 5.4 `assets/street/trash-bin-combustible.js` 可燃ごみ箱
- [x] 5.5 `assets/street/trash-bin-recyclable.js` 資源ごみ（缶・瓶・ペットボトル 3 分类口）
- [x] 5.6 `assets/street/trash-bin-bottle-can.js` 瓶・缶専用箱（网罩/投入口）
- [x] 5.7 `assets/street/flower-planter.js` 花箱・花盆（葉ボタン・パンジー・土・苔）※ 実ファイル名に修正
- [x] 5.8 `assets/street/ac-outdoor-unit.js` 冷暖房室外機（羽根・金网・配管・ドレン水跡）
- [x] 5.9 `assets/street/bulletin-board.js` 公告掲示板（多张海报叠贴、日付、雨晒色褪）
- [x] 5.10 `assets/street/post-box.js` 郵便ポスト
- [x] 5.11 `assets/street/bench-wait.js` 待合ベンチ（街角）※主控代建

## 阶段 6 · 街道设施 B（电气与交通）
- [x] 6.1 `assets/street/utility-pole.js` 電柱（鉄筋・架台・碍子・変圧器・点検踏板・番号札）
- [x] 6.2 `assets/street/power-lines.js` 架空電線（**两端必须锚定在相邻两电线杆上**，多回路 + 引下線）
- [x] 6.3 `assets/street/street-lamp-retro.js` レトロ街灯（笠・グローブ・灯門・呼吸点灯）
- [x] 6.4 `assets/street/traffic-light-vehicle.js` 車両用信号機（三眼・バイザー・缓慢渐变）
- [x] 6.5 `assets/street/traffic-light-pedestrian.js` 歩行者用信号機（青人/赤人・点滅）
- [x] 6.6 `assets/street/road-sign-set.js` 道路標識群（一時停止・注意信号・速度制限・自転車・駐禁止・踏切）
- [x] 6.7 `assets/street/guard-rail.js` 护栏（波形ガードレール + 柱 + 反射標識）
- [x] 6.8 `assets/street/bollard.js` ボラード・車止め
- [x] 6.9 `assets/street/manhole-cover.js` 側溝蓋・manhole（鉄筋文様・錆・水たまり跡）
- [x] 6.10 `assets/street/parking-space.js` 駐車区画（白線・車輪止め・番号・砂利）
- [x] 6.11 `assets/street/fire-hydrant.js` 消火器ボックス / 防火水槽標識
- [x] 6.12 `assets/street/traffic-cone.js` カラーコーン・立て看板・路地注意鏡

## 阶段 7 · 自行车与駐輪場
- [x] 7.1 `assets/bike/bicycle-commuter-a.js` 通勤自転車 A（前カゴ・ダイナモ・泥除け・チェーンガード・サドルバッグ）
- [x] 7.2 `assets/bike/bicycle-commuter-b.js` 通勤自転車 B（女子仕様・バスケット・低床・ライト）
- [x] 7.3 `assets/bike/bicycle-old-c.js` 旧型自転車（錆・塗装剥がれ・チェーン垂れ・パンク気味）
- [x] 7.4 `assets/bike/bicycle-parent-d.js` 子乗せ自転車（前チャイルドシート・バー・ヘルメット）
- [x] 7.5 `assets/bike/bike-parking-rack.js` 駐輪ラック（車輪止め・アーチ・区画表示）
- [x] 7.6 `assets/bike/bike-park-sign.js` 駐輪場看板・整理券ポスト
- [x] 7.7 `assets/bike/bike-pump.js` 空気入れ（立式・ゲージ・ホース）
- [x] 7.8 `assets/bike/bike-lock-post.js` 施錠柱・U 字ロック・チェーン

## 阶段 8 · 车站与电车
- [x] 8.1 `assets/station/platform-canopy.js` ホーム上屋（木柱・トタン・雨樋・梁・照明）
- [x] 8.2 `assets/station/station-name-sign.js` 駅名標（木製・白地・青帯・邻站表示）
- [x] 8.3 `assets/station/platform-bench.js` 候车长椅（木製・錆脚・ゴミ）
- [x] 8.4 `assets/station/timetable-board.js` 時刻表看板（便数・最終・雨晒）
- [x] 8.5 `assets/station/platform-bin.js` ホームゴミ箱 + 自販機横の灰皿
- [x] 8.6 `assets/station/crossing-barrier.js` 遮断機 + 踏切警報機 + 非常ボタン + 誘導標
- [x] 8.7 `assets/station/rail-signal.js` 閉そく信号機（色灯・腕木風）
- [x] 8.8 `assets/station/ticket-machine.js` 券売機（簡易）+ 乗車整理券箱
- [x] 8.9 `assets/station/train-car-front.js` 先頭車（ヘッドライト・目的地表示・窓・扉・台車・屋根上）
- [x] 8.10 `assets/station/train-car-rear.js` 後述車（連結面・尾灯・广告带）
- [x] 8.11 `assets/station/platform-stairs.js` 階段 + 手すり + 滑り止め + 矢印表示
- [x] 8.12 `assets/station/rail-furniture.js` レール周辺（転換機・ケーブル槽・防草シート・標識）

## 阶段 9 · 便利店内部（大件设备，透过玻璃全可见）
- [x] 9.1 `assets/interior/shelf-gondola.js` 背合わせ棚（4 段・価格札・フック）
- [x] 9.2 `assets/interior/shelf-wall.js` 壁側棚（文房具・日用）
- [x] 9.3 `assets/interior/drink-fridge.js` 飲料冷ケース（4 門ガラス・各層飲料・庫内灯）
- [x] 9.4 `assets/interior/bento-display.js` 弁当・おにぎり・寿司陳列（多段・冷気カーテン）
- [x] 9.5 `assets/interior/register-counter.js` レジカウンター（POS・レジ袋・金庫・モニター）
- [x] 9.6 `assets/interior/coffee-machine.js` カフェマシン（カップ・シロップ・排水・灯）
- [x] 9.7 `assets/interior/oden-counter.js` 关东煮柜台（仕切り・具材・湯気・たれ）
- [x] 9.8 `assets/interior/magazine-rack.js` 雑誌・新聞ラック
- [x] 9.9 `assets/interior/upright-freezer.js` 立式アイスクリーム庫
- [x] 9.10 `assets/interior/lockers.js` コインロッカー ※主控代建
- [x] 9.11 `assets/interior/poster-lightbox.js` 海报灯箱（内部可见，多面）
- [x] 9.12 `assets/interior/backroom-shelving.js` 後場棚（段ボール・コンテナ・台車）
- [x] 9.13 `assets/interior/ceiling-lights.js` 天井灯带 + 換気 + スプリンクラー + 梁 ※主控代建
- [x] 9.14 `assets/interior/floor-guidance.js` 床ガイドライン + 矢印 + 注意ステッカー
- [x] 9.15 `assets/interior/wall-and-floor.js` 内壁タイル・腰板・天井・床（无空白死角）※主控代建
- [x] 9.16 `assets/interior/basket-and-cart.js` カゴ・台車・傘立て（店内）
- [x] 9.17 `assets/products/price-tag.js` 店内価格表示・POP・新発売カード（棚札 / 床 POP / 新発売 / 100 円 / sale 全 variant）※ 実ファイル名に修正

## 阶段 10 · 便利店内部（商品单体，全部独立文件）
- [x] 10.1 `assets/products/onigiri.js` 饭团（3 种：鮭・コンブ・ツナマヨ + のり）
- [x] 10.2 `assets/products/bento-box.js` 弁当（蓋・米饭・おかず・仕切り）
- [x] 10.3 `assets/products/sushi-tray.js` 寿司托盘（握り 6 贯・シャリ・ネタ）
- [x] 10.4 `assets/products/drink-bottle.js` PET 饮料瓶（キャップ・ラベル・収缩膜・中身）
- [x] 10.5 `assets/products/drink-can.js` 铝罐（プルタブ・天面・condensation）
- [x] 10.6 `assets/products/milk-carton.js` 牛乳パック
- [x] 10.7 `assets/products/cup-noodle.js` カップ麺（蓋・スプーン・かやく）
- [x] 10.8 `assets/products/chip-bag.js` 薯片袋（充气・印刷・クリップ）
- [x] 10.9 `assets/products/candy-bar.js` 巧克力/糖果（箔・包装）
- [x] 10.10 `assets/products/tissue-pack.js` ティッシュ・ウェットティッシュ
- [x] 10.11 `assets/products/zen-sets.js` おでんの具（大根・卵・こんにゃく・さつまげ・海苔巻）
- [x] 10.12 `assets/products/ice-cream.js` アイスクリーム（バー・カップ・パフェ）
- [x] 10.13 `assets/products/coffee-cup.js` カップコーヒー（蓋・スリーブ・ストロー）
- [x] 10.14 `assets/products/magazine-item.js` 雑誌・漫画単行本
- [x] 10.15 `assets/products/daily-goods.js` 日用（電池・傘・タオル・文房具）
- [x] 10.16 `assets/products/snack-shelf-pack.js` スナック棚パック（複数個の一括生成 but 每个独立 Mesh）
- [x] 10.17 `assets/products/bread-set.js` 面包・サンドイッチ
- [x] 10.18 `assets/products/deli-tray.js` デリ・総菜（サラダ・唐揚）
- [x] 10.19 `assets/products/price-tag.js` 价格札・POP（多数独立小 Mesh）
- [x] 10.20 `assets/products/trash-liner.js` ゴミ袋・空ペット（細物）

## 阶段 11 · 民家与背景
- [x] 11.1 `assets/buildings/minka.js` 日式民家（瓦屋根・塀・庭・物干し・エアコン室外機）
- [x] 11.2 `assets/buildings/alley-houses.js` 巷内の隣家背面（勝手口・物置・自転車・植木鉢）
- [x] 11.3 `assets/buildings/fence-set.js` 塀・ブロックフェンス・メッシュ・生垣門柱
- [x] 11.4 `assets/buildings/utility-background.js` 背景（里山シルエット・送電鉄塔遠景・田んぼ）

## 阶段 12 · 动效系统
- [x] 12.1 `motion/petal-storm.js` 落樱（空中飘落 + 飞舞 + 地面堆积随风挪动）
- [x] 12.2 `motion/branch-sway.js` 花枝微风
- [x] 12.3 `motion/light-breath.js` 灯光呼吸
- [x] 12.4 `motion/glass-shimmer.js` 玻璃光影浮动（流光/反射漂移）
- [x] 12.5 `motion/traffic-signal.js` 交通信号缓慢渐变（含踏切赤色点灯）
- [x] 12.6 `motion/air-haze.js` 春日空气光晕（体积光斑/浮遊花粉）
- [x] 12.7 `motion/index.js` 汇总注册 + 与资产 userData 对接

## 阶段 13 · 装配与打磨
- [x] 13.1 `src/world/index.js` 全资产按 LAYOUT 落位（含 rot/scale/seed）
- [x] 13.2 移除 `src/core/probe.js` 与 `?probe` 逻辑（连带删除 tools/diag.mjs、_probe_shader.mjs；src/ 内已无 console.log）
- [x] 13.3 多机位实拍审查（hero / store / interior / corner / station / crossing / top / blossom / vending / bike / tight）
  · 工具：`node tools/shoot.mjs --views=... --wait=2400`（无头 Chrome + ANGLE/D3D11，1600×900）
  · 工具：`node tools/inspect.mjs`（逐资产世界包围盒 / 越界与错位检测）、`--in=x0,x1,z0,z1`（区域杂物体检）、`--deep=1`（单资产零件级定位）
- [x] 13.4 修穿模 / 漏光 / z-fighting / 描边错误 / 色彩断层
  · 电线蜘蛛网：每档断面轴统一为档距直交方向，角柱 P3 改为转角杆（rotY −45）并把线位移到丁字路口 → 档内 6 线不再交叉
  · 花瓣糊镜头：空中/地面花瓣缩小到 ~2 cm 并按相机距离平滑收缩（1.1–2.6 m）
  · corner 机位原先落在 sakura-a3 树冠内 → 树移到 (16.6,12.2)、机位移到 (11.8,16.8)
  · 店内穿模：coin locker 原在 z=−1.6（建筑外，穿北壁）→ 移到东壁内侧；在庫ラック 穿东壁+北壁 → 移到收银前通道；杂志架与西壁棚冲突 → 西壁棚缩到 len 2.6
  · 屋上看板 7 个文字盘全黑：TEX.signboard 是 1024×256 横长，贴到方形盘上被纵向拉爆 → 新增 ar 参数 + 实测字宽自适应，15 处方形/竖形标牌补齐 ar
  · 玻璃：envMapIntensity 1.7/1.8 与整片 additive 反光带把橱窗变成镜子 → 改 glassLite 薄透 + 反光只留上部 1/3 带（opacity 0.07）
  · 底座越界：utility-background 的远家/草丛越过 −20 板边 → 收进 z ≥ −19.6
- [x] 13.5 光影与后期终调（对比、饱和、DOF、bloom、颗粒、暗角）
  · 阴影冷染 #7f97c6×0.82 是全画面发青的根因（toon 的阴影是乘算）→ 改 #aeb8d4×0.90
  · 花瓣阴影 #c99bb4×0.55 使花群压成赤紫 → 改 #f0c6d6×0.42，内层花色明度下限抬到 0.82
  · 分级：饱和 1.07→1.13、对比 1.05→1.13、雾霭 0.055→0.036、gain 更暖
  · 沥青基色从淡紫灰 #a9a5b2 系列改为晴日实测灰 #8b8892/#84818b/#7c7a84，补丁与龟甲裂纹降透明度、法线强度 1.5→0.8（消除路面「拉丝」）
  · 白线 #f6f3ec→#eeeade（避免 bloom 过曝）、民家瓦 #6b6a72→#8b8a93（阴面不再黑成一块）
- [x] 13.6a 频闪根因修复：EffectComposer 不在每帧开始复位 read/writeBuffer，只按 pass.needsSwap 交换。
  本链交换次数为奇数（toonEdge/dof/grade/smaa/output = 5），故 readBuffer 起点逐帧翻转 →
  RenderPass 一帧写进带 depthTexture 的 renderTarget2、下一帧写进没有深度贴图的 renderTarget1，
  描边与景深隔帧采到上一帧深度，整画面逐帧明暗交替（实测平均亮度 134.8↔146.2，约 4.5% 频闪）。
  修法：buildComposer 内包一层 composer.render，每帧把 readBuffer 钉回带深度贴图的那张。
  回归工具：`node tools/flicker.mjs`（逐帧 readPixels 求相邻帧亮度差与亮度方向翻转率）。
  修后：mean 帧差 18.38 → 4.30，翻转率 ~1.0 → 0.6，连续 7 帧亮度恒定。
  附带：bloom 阈值 1.35 → 2.55（1.35 低于晴日白色漫反射面的线性值 2.1~2.6，会让所有受光面白茫茫地发光）。
- [x] 13.60 启动响应性修复：装配原先用「每 3 个资产让出一帧」+ rAF 节拍。两个问题：
  ① 单个重资产（drink-fridge 上万 Mesh）本身就是数百毫秒长任务，固定步长仍会把主线程连续锁死约 57 秒，
     期间画面不动、OrbitControls 收不到指针事件（用户反馈「很卡，无法移动」的真相）；
  ② rAF 在后台标签页完全不触发 → 页面一失焦，装配就永久停住。
  改法：kit.yieldToBrowser() 用 MessageChannel 宏任务让出（前台让帧、后台不被节流），
  placeAll 改为 12 ms 时间预算式让出，地图层每模块、动效每系统各让一次；
  并新增 engine.built 标记（ready 只表示已渲染 >2 帧，不代表世界建完），三个工具改等 built。
  实测：后台失焦状态下装配仍能跑完（built=true / 143 实例）；剩余最长单任务≈1 s（单个重资产，无法被抢占）。
- [x] 13.6 性能与稳定性（帧率、显存、resize、无 console error）
  · 1600×900 / 72 746 节点（60 259 Mesh + 11 996 描边壳）/ missing 0
  · 实测：加载完成即采样 fps = 44；连续换机位后稳定采样 = 27（修复缓冲奇偶性前为 20，
    一半帧在采样陈旧深度/错位的叠加目标，既闪又慢）
  · 手段：pruneHulls（<0.16 m 不描边）+ autoInstance（同类零件 GPU 实例化，不合并几何）
    + markStatic（静止子树停算矩阵）+ installLod（投影小于 9 px 的零件与 16 m 外的描边壳隐藏）
    + 阴影贴图节流 0.45 s + 阴影类型 VSM→PCFSoft（见 14.3，顺带去掉 VSM 的两次 12 样本高斯）
  · console：src/ 内已无 console.log；无 page error；唯一 warning 为 ANGLE 对 three 自带着色器的
    X4122 双精度字面量提示（HLSL 翻译期注记，非本项目代码，无法在不 patch three 的情况下消除）
- [x] 13.7 `README.md` 与交付检查表逐项核对

## 阶段 14 · 红线取景后的「切剩杂物」收口
- [x] 14.1 三道裁剪闸门补齐（见 LAYOUT 0.5）：`clipRect`（铺面）+ `clipRun`（长条跑位：侧沟・レール・標線・路缘）+ `pruneToClip`（地图层自由散件按世界位置兜底）
  · 症状：台座已收窄，但 `ground.js` 的「縁の土こぼれ」26 块仍撒在 ±18.4、北法面 36 m 宽整幅斜面板、
    南北道側溝铺到 z=17.6（出台座 4.7 m）、站台端石一根 19.4 m 长箱 → 顶视图里就是一堆悬在天空里的杂物
- [x] 14.2 资产层改为**包围盒**判定（`placeAll` 内，越框 >6 cm 整件不落地并记入 `engine.overflow`）
  · 台座是实心板，资产不允许「切一半」；据此重排 8 件、判 4 件不落位（民家 / hedge-2 / 鉄塔背景 / 北法面）
  · 电线新增端杆落地校验（`poleOk`）：端杆被裁时该档电线一并去掉，杜绝悬空线头
- [x] 14.3 真渲染复核（`peek.mjs` 近摄 + `crop-check.mjs` 度量）暴露并修掉的实物缺陷：
  · **側溝落在车道上**：`drainRun` 的 `at` 用了车道侧 ±0.26，而沟是按步道天端 y=0.15 造的
    → 路面之上浮着 15 cm 的暗渠黑板（hero 图里那些黑色矩形）。改到缘石的步道侧
  · **路面梳齿纹**：土芯顶、最上层地層バンド、沥青三者都在 y=0 同一平面 → z-fighting。
    按「谁盖谁」把地表层高排成严格递增（土芯 −0.004 … 駐輪場 0.016），并把丁字路/踏切引道抬 4 mm
  · **VSM 漏光**：大平面接收者上出现软边椭圆亮斑（站台/屋顶看得到），且每帧两次 12 样本高斯
    → 阴影改 PCFSoftShadowMap，条纹与亮斑同时消失，成本更低
  · **站台上屋的 X 筋交**：跨 3 m 柱间的斜撑把站台切脚手架 → 撤掉（保留主梁/二重梁/柱頭金物/腕木）
  · **停车位杂草**：圆锥株最大 0.46 m 高、42 株排成一行，路面上一列绿圆锥 → 几何缩到 0.13 m、
    株数 30→16、大株 3→2，仍为独立立体株（不改合并）
  · **station 机位在店内**（pos z=4.6 落在 store 轮廓 z −0.8..4.8）→ 移到店北侧空地；删除遗留的 `probe` 预设
- [x] 14.4 沥青去紫：基色 #8b8892/#84818b/#7c7a84 → #8b8880/#83807a/#7a7772（含 speckle/blotch/补丁同调）
- [x] 14.5 新增核对工具：`tools/crop-check.mjs`（逐模块包围盒 + 越框零件 + 被丢弃资产）、`tools/peek.mjs`（自定义机位近摄）
  · 验证一律走无头页面：应用内浏览器会跑旧代码，其 `evaluate` 读数不可信
  · 当前状态：`npm run check` 135/135、`missing: []`、越框模块 0、悬出台座散件 0、被丢弃资产 0、无 pageerror
  · 交互帧率（`tools/perf.mjs` 真实拖拽 8 s）：中位 9.9 fps、draw calls 8.8 k、3.6 M tri、可见 Mesh 9.6 k/35.4 k
    （SwiftShader/ANGLE 无头环境实测；LOD 修复前为 2.5 fps）

## 阶段 15 · 交互流畅度（「一闪一闪的卡顿」）与动效幅度
- [x] 15.1 新增 `tools/hitch.mjs`：逐帧记录 (帧耗时, 该帧真实 draw calls)。
  `renderer.info.autoReset=false` + 累计值差分 → 阴影刷新帧会表现为 calls 尖峰，
  于是能区分「整体帧率低」和「周期性硬卡」。探针必须**真的移动指针**：只按住不动时
  相机是静止的，静止闸门会正常工作，测不出交互期表现。
- [x] 15.2 根因 A：`shadowMap.autoUpdate=false` + 每 0.45 s 无条件重绘整场景阴影。
  日光方向固定、正交视锥罩住整块台座，会动的只有花枝与吊幌子 → 拖动期间每 10 帧插入
  一个 calls 9.5k→15k 的尖峰帧（+35 ms），肉眼就是「一顿一顿」。
  改为**画面静止后才重绘**（相机位置/四元数带容差判定），静止 3 s 后刻线再放宽 5×；
  `built` 时 `markShadowsDirty()` 兜一次，保证最终状态阴影贴图完整。
  注：四元数判等必须用 `1-|dot|` 容差，阻尼是指数收敛，`equals()` 永远为 false。
- [x] 15.3 根因 B：LOD 没有滞回。`interval 0.12 s` 且相机带惯性拖尾，临界距离上的零件
  逐帧翻 visible → 画面持续闪烁 + visible 集合抖动。零件隐藏与描边壳开关都加了滞回带
  （零件 1.14×，描边壳 ±6%），只切换 visible，不碰几何。
- [x] 15.4 便利店广告乱动：`store/awning.js` 吊るし POP 的 `sway.amp = 0.9`（弧度 ≈ 51°，
  全场其他 sway 都在 0.001–0.085）→ 改 0.045（≈2.6°，板梢位移约 1 cm）。
- [x] 15.5 实测（无头 ANGLE，1600×900，持续拖拽 8 s）：
  · 修前 帧耗时 p50 286 / p90 414 / p99 527 ms，尖峰帧每 10 帧一次
  · 修后 帧耗时 p50 88.7 / p90 95.3 / p99 101.7 ms，**拖动期间尖峰帧 0**；静止时尖峰间隔 10 → 46 帧
  · 即基线 3.2×、交互期帧耗时波动从 1.85× 收敛到 1.15×
  · `npm run check` 135/135、`check:boot` 无 error、阴影仍正确（树影/柱影/屋影齐全）

## 阶段 16 · 绘制调用削减（「还是卡卡的」的第二轮）
- [x] 16.1 先定性再动手，新增三个探针：
  · `tools/fill-test.mjs`：只改渲染分辨率看耗时怎么动 → 400×300 仍要 65 ms（1600×900 是 77 ms），
    空场景 6.5 ms ⇒ **85% 是 CPU 提交，不是 GPU 填充**。所以优化目标是 draw call 数量，不是着色器。
  · `tools/state-cost.mjs`：数材质/几何/程序与排序后的状态切换 ⇒ 1701 材质、5162 几何、
    材质切换只占绘制的 20% ⇒ 不是状态抖动，就是**裸的 8.3 µs/次提交 × 8600 次**。
  · `tools/frame-cost.mjs`：逐资产「视锥内可见对象」归属 + 消融（藏掉某层看时间怎么掉）。
- [x] 16.2 实例化两处结构性缺陷：
  · `autoInstance` 按**材质对象**分桶 → 商品类资产习惯给每件单独 `MAT.plastic('#xxxx')`，
    同形状 40 个瓶子 = 40 个桶 = 40 次提交。改为按**材质配置签名**（`toJSON()` 去掉材质自身
    uuid/name，保留贴图 uuid）分桶，仅颜色不同时克隆一份把底色刷白、颜色走 instanceColor。
    min 4 → 2。
  · 资产普遍「每个小群组 inst() 一次」（樱花每个花房一套花瓣/叶/梗），新增 `mergeInstances`：
    把同一宿主下同几何+同材质的 InstancedMesh 再并一次。宿主取**最近的摆动祖先**，跨摆动根绝不并。
    （踩坑：`instanceColor.getColor()` 不存在，应为 `mesh.getColorAt()`；它抛在 place() 里被
    每资产的 try/catch 吞掉，表现为「改了没效果」—— 工具现在会打印 placement 警告。）
- [x] 16.3 樱花：卡片几何按 10 mm/卷曲 0.2 量化共享、花梗改为「单位曲线 + 旋转+缩放」共享，
  并取消花房与末端小枝的独立揺れノード（房自身 1–2° 的摆幅小于亚枝，风的表情保留）。
  单棵 yaezeni 的可见对象 2137 → 963。三棵树原本占全场景可见绘制的 40%。
- [x] 16.4 LOD：pxThreshold 18 → 26（`tools/lod-sweep.mjs` 实测曲线），
  同时给 `interior/*`、`products/*`、贩卖机单独 `lodPx = 16` —— 店内饮料是需求点名要「每层看得见」的
  内容，26 px 会在店门口视角把 20 cm 的瓶子整批剔掉。阈值改为可按资产实例覆盖（`userData.lodPx`）。
- [x] 16.5 顺带修掉一个摆放错误：`bike-storefront` 的 z=4.5 在玻璃内侧（店铺 z −0.8..4.8），
  等于把自行车停在店里 → 移到东北角人行道 (−1.25, 6.05)。
- [x] 16.6 实测（无头 ANGLE + RTX 4060，1600×900，固定机位 renderer.render）：
  · hero 8260 calls / 73.3 ms → 7904 / ~65 ms；store 9596 / 100.8 ms → 7977 / ~80 ms；
    interior 10207 / 109 ms → 8456 / ~85 ms
  · 持续拖拽（`tools/hitch.mjs`）：本轮起点 p50 88.7 ms → 61–89 ms（视角度而定），尖峰帧 0
  · 场景 Mesh 35447 → 31633（InstancedMesh 5511），`npm run check` 135/135、`check:boot` 无 error
- [ ] 16.7 遗留（下一轮）：店内视角从门口看过去**对比度不足** —— 内部材质几乎全白 + 玻璃轻微绿 tint，
  使「透过大玻璃看清店内陈设」在 store 机位下读成一片灰绿。要动的是室内曝光/材质明度层次与玻璃色调，
  不是继续削 draw call。

## 阶段 17 · 体积与启动（「打开太慢也太卡了」）
- [x] 17.1 把「启动耗时」变成可测指标：`main.js` 记录 `engine.timings`（engine / world / lod / motion），
  `tools/boot-check.mjs` 打印到 built 的墙钟、页面内分段耗时、Mesh/几何/材质/贴图数量与 JS 堆。
- [x] 17.2 货架商品改为**原型复用**：`kit.stockItem(key, factory)` —— 同「型号+变体」只 build 一次，
  其余 `clone()`（three 的 clone 共享 geometry/material 引用）。逐件位移与转角抖动照旧施加在克隆体上。
  真实货架本来就是同款重复摆放，所以这不是简化，是更准确的建模。
  · shelf-gondola 单件 2630 ms → 353 ms、8880 → 6545 对象；drink-fridge / shelf-wall / bento / freezer 同步下降
- [x] 17.3 **平涂模式不再生成会被剥掉的表面噪点贴图**：`flatShading()` 会把非 graphic 材质的
  map/normalMap 整个丢掉，但 `TEX.*` 仍然照画 —— 每张 512² canvas 绘制 + 一次 heightToNormal，
  位图还常驻缓存（一对 ≈ 2 MB）。`textures.js` 增加 SURFACE_NOISE 闸门，命中就返回共享的
  「白底 + 平法线」1×1。内容类（lightPanel / poster / signboard / drinkLabel / adStrip /
  wear / gradient / frost / paper / petal）照常生成，因为它们被 decal()/MeshBasicMaterial 真正采样。
  · 贴图位图从 ~1.2 GB 降到 454 MB，JS 堆 1620 → 610 MB
- [x] 17.4 实例批次纳入 LOD 判定（按**批次自身包围球**，不按单件尺寸 —— 按单件会把树冠和
  整排饮料在中景剔掉），并修正 16.4 引入的回归：合并后批次不受剔除曾让货架 236 → 538 次提交。
- [x] 17.5 修掉一个把需求核心堵死的建模错误：`store/glass-curtain-wall.js` 的「ガラス押さえゴム」
  做成了与玻璃同尺寸的一整块不透明 box，贴在玻璃室内侧 → 橱窗被 9 块橡胶板糊死，店内完全看不见。
  改成真正的四边压条。定位方法：`tools/peek.mjs --ray=x,y,z` 从相机向店内打射线，
  列出沿途每个物体（含透明/不透明/α 值），一次就指出 6.66 m 处那块无名不透明面。
  · 顺带把店内壳面从接近纯白压到中明度（storeWall / shelfBody / 壁・床タイル / 柱），
    橱窗玻璃去掉青绿味（#d7ecef → #eaf3f4，opacity 0.19 → 0.13），平涂模式关闭玻璃流光加算带
- [x] 17.6 实测（无头 ANGLE + RTX 4060）：
  · 启动到 built：74.4 s → **24.0 s**（world 装配 66.6 → 16.9 s）
  · JS 堆：1620 MB → **610 MB**；场景 Mesh 35447 → 27024；几何 11353；材质 3294；贴图位图 454 MB
  · 持续拖拽：p50 88.7 → **76.7 ms**（13 fps），draw calls 中位 9520 → 7575，尖峰帧 0
  · `npm run check` 135/135、`check:boot` 无 error、crop-check 全绿
- [ ] 17.7 还能继续压的（按性价比排序）：
  ① 内容贴图仍占 454 MB，可把只贴在 20 cm 面上的 poster/signboard 从 1024 降到 512；
  ② 树冠的揺れ改成逐实例顶点着色器风动，这样 mergeInstances 能跨小枝合并（三棵树还剩 ~2100 提交）；
  ③ 交互期把 LOD 阈值随相机角速度临时抬高（运动中少画、停下补全），可再要回 20-30% 帧时间。

## 阶段 18 · 落樱本体（「落下来的换成粉色的樱花」）
根因不在颜色，在**平涂剥贴图**：`flatShading()` 会把非 graphic 材质的 `map` 整个删掉，
而花瓣/叶片/苔/磨损这些「靠 alpha 抠形」的面片一旦没了图，`alphaTest` 就无图可测 →
每一片都退化成**粉白色小方块**，1500 片空中 + 5200 片地面 = 一把碎纸屑。
- [x] 18.1 形状做进几何：`kit.sakuraPetalGeo()`（10 顶点 8 三角：基部收窄 → 中部最宽 →
  先端樱花特有的缺口 + 横向反卷）、`sakuraPetalRestGeo()`（贴地躺平）、
  `sakuraLeafGeo()`（椭圆尖头）、`tuftGeo()`（5 枚叶的草むら）。都走 `cachedGeo` 共享。
  三角数反而下降：3×3 卡片 18 三角 → 花瓣 8 三角，全场景 5.1M → 4.8M/帧。
- [x] 18.2 樱花树冠 / 落枝 / 地面落花 / 干元苔 全部改成按 `IS_FLAT` 分派：
  平涂用实形轮廓，toon 仍用卡片＋贴图（两条路都不坏）。`FILL 1.35/1.25`：
  实形只占外接框约 45%，直接替换会让花冠透过去看见街景，放大一弁把茂密度补回来。
- [x] 18.3 颜色按**实际显示值**校准：`Color.setHSL` 在工作色空间（线性）里算，
  旧值 S 0.20–0.40 / L 0.90–0.98 再乘上生成色 pale，落到屏幕是 `#f6e0e7` —— 就是白色。
  现在空中 `#e5a0ba〜#f1b3c5`、地面 `#df95b1〜#f1b7c9`（= PAL.sakuraPetalDeep 附近）。
  内层花瓣的 `tint`（乘算遮色）在实形下会一朵朵读出来，`#b9a1ad` 像枯瓣 → 平涂改 `#e7cdd9`。
- [x] 18.4 修掉一个静默致命错误：材质 `vertexColors: true` 但几何没有 `color` 属性 →
  three 的 `color_fragment` 只在 `USE_COLOR` 时乘 `vColor`，而顶点着色器里 `USE_COLOR`
  需要 `material.vertexColors`，未绑定的 attribute 默认 (0,0,0,1) → 整片刷黑。
  实例化着色统一走 `instanceColor`（不需要 vertexColors）。
- [x] 18.5 撒花区域与裁剪框求交（`clipZones`），权重按剩余面积缩放；空中花瓣飘出台座立即回收。
- [x] 18.6 **新增 `kit.groundYAt(x,z)`**：`surface()` 是所有地图铺面的唯一出口，顺手登记矩形，
  于是「这一块地面多高」变成可查询的事实而不是各模块的猜测。落花落地高度、空中花瓣的地板
  都改问它。修掉两类老 bug：店前歩道（y=0.15）上 0.012 的花瓣整片埋在沥青里；
  「ホーム上」的 z 区间写错（−8.6..−3.4 根本不是站台 −12.2..−9.4），花瓣悬在 0.76 m 空中。
- [x] 18.7 树基：盛土剖面提出为 `MOUND` + `moundSurfY(k)`，苔与落花按半径取表面高度
  （原来内圈花瓣埋进土里 7 cm）。
- [x] 18.8 顺手（实拍发现）：`store/pavement-frontage` 的装配 y 写成 0.152，而资产自身天端
  已经是 0.158/0.162/0.222 → 整条店前铺面浮在歩道上 15 cm，接缝与段鼻条在画面里就是
  「人行道上躺着的几根黑棒」；相邻道具（自販機 0.16 / ゴミ箱 0.222）本来就按 y=0 的原点写的，
  等于全被埋进铺面。归零。定位工具：`tools/stray.mjs --in=... --y0= --y1=`（按形状反查杂物）。
- [x] 18.9 同一带还发现车輪痕是 8 根 4 mm 厚、最高悬空 30 mm 的细长 box → 改成贴面的
  `TEX.wear({kind:'streak'})` 新kind（单向擦痕），不再像钢筋。
- [x] 18.10 `PCFSoftShadowMap` 在 r186 已被删除（设了会回退并每次启动警告一条）→ 明确写 PCFShadowMap。
- [x] 18.11 实测：启动到 built 24.0 → **21.7 s**；几何 11353 → 11201；三角形 5.1M → 4.8M/帧；
  draw calls 中位 ~7200（持平）；持续拖拽 fps 中位 16.8（持平）；`npm run check` 135/135、
  `check:boot` 无 error。实拍核对：`shots/hero.png`、`petal-close4.png`、`frontage-fixed2.png`、
  `canopy-close4.png`（近景花冠是一朵朵带缺口的花瓣，不再是纸片）。
- [ ] 18.12 遗留：① 16.7 的店内对比度问题未动；② 其他用 `leafCluster`/`petal` 卡片做 alpha 抠形的
  资产（绿篱、花坛、ivy）在平涂下同样是方块，本轮只处理了樱花与店前；
  ③ 空中花瓣仍会从建筑屋顶「穿过去」再在地板出现（全局撒花层没有遮挡体概念）。

## 阶段 19 · 启动时间（「当前加载还是要很久，降到 10 秒以内」）
起点：dist 到 built **21.2 s**。先量后改，结论是「慢」几乎全在贴图与几何的**生成 + GPU 上传**上，
不是模型精度，也不是 draw call。
- [x] 19.1 测量协议先立起来，否则后面每一步都在猜：
  · `?trace=1` → `core/style.js` 的 TRACE 出口（零 UI 场景不能把调试画在屏幕上），
    `tools/boot-trace.mjs` 打印 map/asset/motion/misc/tex 五类逐项毫秒 + 贴图字节账
  · **踩过的坑**：单次 boot-check 会被并发 Chrome 与冷缓存污染，同一份产物实测 11.4 / 12.97 / 13.41 s，
    差点把「量化键」判成倒退。改成**两个产物交替跑 5 轮 + 丢掉第一轮冷启动 + 取中位**才可比。
- [x] 19.2 平涂剥 map 的连带浪费（一）：`TEX.paper` / `TEX.fabric` 把**底色放进缓存键**，
  140 个 `MAT.paper` 调用 = 161 张 512² 画布 + 161 次 heightToNormal（6.3 s，占同步耗时 1/3）。
  纸纹/织纹本身与底色无关 → 底稿一律画白，颜色交给材质 `color` 相乘：161 → 7、56 → 16。
  两处 `decal()` 直接吃这两张贴图（看板残胶、贩卖机橡胶垫）改为显式传 `color`。
- [x] 19.3 平涂剥 map 的连带浪费（二）：`pack()` 无条件做一次 `heightToNormal`，
  但平涂只有 `graphic` 材质保留贴图，而 `MAT.poster` / `MAT.glow` 从不接收 pack 的 normalMap
  → 平涂下每张法线必被剥掉。改成平涂不生成（省一次 512² 逐像素循环 + 一份上传）。
- [x] 19.4 修一个「闸门从来没生效过」的 bug：`SURFACE_NOISE` 里写的是 `'corrugated'`，
  而 `pack()` 的键前缀是 `'corru'`（同理 `'leafCluster'` vs `'leaf'`）→ 波纹铁皮/叶簇照样白画。
- [x] 19.5 印刷内容按**屏上 texel 密度**降采样（不是降精度，是本来就过采样 4–8 倍：
  60 cm 招牌在 8 m 外只占约 120 px）：signboard 1024→512、poster 512×768→256×384、
  adStrip 1024×256→512×128、drinkLabel 512×256→256×128、lightPanel 512×256→256×128、
  wear 256→128；`TEX.poster` 的 seed 分 6 桶（110 → 101 份，花纹相位看不出重复）。
- [x] 19.6 `fabric` 的 16 种 repeat 用 `Texture.clone()` 复用同一个 `source`
  —— three 按 source 上传 GPU，以前是同一张 512² 画 16 遍、传 16 遍。
- [x] 19.7 几何缓存键量化到 0.5 mm（box/rbox/cyl/cone/sph/tor/plane/circ/capsule）：
  0.0249 与 0.025 是同一个零件，不该各存一份几何各传一次 GPU。几何 11201 → 10432、Mesh 27025 → 26605。
  `retile()` 只作用于 `surface/wallX/wallZ` 自建的平面，不会污染共享几何 ✓
- [x] 19.8 装配期间挡住阴影重绘：`engine.built` 改成 `built` 存取器，同时翻起引擎内部的
  `booted` 闸门。world 挂上后相机本来就是静止的，每次让帧都被塞进一次全场景阴影 pass。
- [x] 19.9 最后一个结构性浪费：`materialSignature` 用 `JSON.stringify(material.toJSON())` 比材质配置，
  而 three 的 `TextureSource.toJSON` 会把每张贴图 `canvas.toDataURL('image/png')` 编码成 base64 ——
  3331 个材质各编一遍（CPU 剖析里 `getDataURL` 占 5% 采样，另外每次产生 100–300 KB 字符串喂给 GC）。
  改成显式列举「会改变绘制结果」的标准字段 + 贴图身份（uuid / repeat / wrap / colorSpace / anisotropy），
  语义与原来一致（同样忽略 color，颜色走 instanceColor），但不再序列化。再省约 0.8 s。

  **结果（dist，同一协议 5 次）**：
  · 到 built **21.2 s → 9.33 s**（中位 9.33，区间 9.24–9.78；本轮改动前同协议 10.16 s）
  · 贴图位图 455 MB → **148 MB**；JS 堆 591 → **~240 MB**；几何 11201 → 10432；Mesh 27025 → 26553
  · 交互无回退：draw calls 中位 ~7000（原 7200–7600）、拖拽 fps 中位 17.6（原 16.8）、三角 4.8M/帧
  · 画面复核：`shots/hero.png`、`shots/store.png` 招牌与海报文字仍清晰、无白块、无褪色
  · toon 模式复核：推进正常（10 个地图层 + 资产逐件落地、零 pageerror），但它要生成平涂跳过的全部
    噪点贴图，启动约 2 分钟 —— 平涂是默认路径，toon 只作对照，本轮没有为它优化
- [x] 19.10 ② 「把零件几何再合并一层」做出来量过了 —— **不划算，已撤回**。
  `mergeStaticParts()` 用 `BufferGeometryUtils.mergeGeometries` 把静止零件按
  （几何族 × 材质签名 × 包围盒邻接 ≤1.6 m）聚成 156 个 batch：5262 个静止件 →
  几何上传 **10196 → 7280（−29%）**。可 A/B（同一静态根、交替 5 轮、丢首轮）实测：
  · 合并 off：到 built 中位 **7.93 s**（7.72–8.14）｜on：**8.14 s**（8.09–8.20）—— 慢 0.15 s
  · 交互 off：121 帧（≈15.1 fps）｜on：125 帧（≈15.6 fps）—— +3%，噪声级
  结论：几何上传根本不在关键路径上（见 19.11 的归因），合并换不来时间，
  还直接违背「每个物件独立建模、不合并网格」。**已完整撤回 kit.js/world 的这层代码。**
  过程中另发现一个既有隐患：`fence-gate` 有一个 `matrixWorld` 含 NaN 的节点
  （合并时产出 NaN 包围盒才暴露）。当时加了「矩阵必须有限」的守卫绕过，
  守卫随合并层一起撤掉了，**NaN 本身还在资产里**，后续排查动画/拾取异常时先想到它。
- [x] 19.11 启动尾部那 3~5 s 到底是谁：把 `renderFrame` 的累计毫秒和帧数记进
  `engine.timings[*_render / *_frames]`（`boot-time.mjs` 直接读），一次就看清：
  · lod → built 之间墙钟 5.07 s，而动效同步代码只有 **0.03 s** —— 差的全是**帧渲染**：
    装配每 `await` 让出一次主线程，rAF 就插进一整帧，实测 **192 帧 / 3.09 s**（16 ms/帧）。
  · 着色器不是瓶颈：整场景只有 **49 个 program**（材质 3359 个但签名只有 8 类）。
  · 一次「脏」阴影 pass = **2415 ms**，热帧只要 54 ms —— 所以 `built` 时点必须只补一次。
  · `renderer.initTexture()` 逐张上传 512² 只要 0.01 ms —— 说明上传是异步排队的，
    **不能用提交耗时推断 GPU 成本**（这条曾经把我带偏过一次）。
- [x] 19.12 于是给装配期加了渲染节流开关 `?asm=slow|full|freeze`（默认 slow ≈ 8 fps，
  前 2 帧照常渲染以保住天空底图和 `ready` 语义）。三方对比（800×500，丢首轮取中位）：
  · `full`（原行为）：到 built **7.89 s** → 成帧 **8.13 s**
  · `slow`：到 built **4.82 s** → 成帧 **7.81 s**
  · `freeze`：到 built **4.88 s** → 成帧 **7.85 s**
  **关键结论：省下来的 3 s 没有变成用户提前看到画面，只是从装配期挪进了首帧。**
  那 3 s 的真实身份是把 26.5k Mesh / 10.2k 几何 / 831 张贴图分批灌进 GPU，省不掉、只能挪；
  分批还有额外好处（避免一次 3 s 的死等）。选 `slow`：两项指标都不劣于 `freeze`，
  又保住了「画面在动 = 还在建」的反馈。
  · 真正的收益在**大窗口**：1600×900 成帧时间 **9.54 s（区间 8.38–10.21）→ 7.94 s（7.90–8.02）**，
    方差从 ±0.9 s 收到 ±0.06 s —— 装配期不再有「随分辨率放大的无用帧」。
  · 复核：`npm run check` 135/135、`npm run check:boot` 无 pageerror、
    贴图位图 148 MB / 833 张，几何 10133–10196。
  · 交互无回退：`tools/perf.mjs` 拖拽 fps —— `asm=full` 中位 13.6 / `asm=slow` 中位 13.8，
    draw calls 6.9k–7.3k、三角 4.8M/帧，与节流前一致（两次背靠背测会互相污染：
    同一档位排在后面那次读到 10 fps，单独复测回到 13.8，所以**必须隔 40 s 再单测**）。
    注：本轮之前记录的 17.6 fps 现在同码同参只读到 13.6 —— 机器热状态漂移，
    不是代码回退；跨轮次比较 fps 之前，先用同一份产物把基线重测一遍。
  · 画面复核：`shots-check/hero.png`、`shots-check/store.png` 与基线逐像素级一致
    （只有花瓣位置不同），招牌「サクラ・マート / 24時間営業 / 春の限定メニュー」与 30 限速牌仍清晰；
    `tools/flicker.mjs` 相邻帧亮度差 max 0.06、方向翻转率 0（无频闪）。
  · 新增常驻工具 `tools/boot-time.mjs`：连续 N 次冷启动，同时报「到 built」与「成帧」
    两个中位数，并打印各阶段耗时 + 装配期帧数/帧毫秒。以后判断启动优化只看后者。
- [x] 19.13 **本地 7.9 s 是假的**：把同一份 `dist/` 推到 GitHub Pages 再测，成帧时间 **35.95 s**。
  差值全在 `world` 阶段（4.2 s → 31.4 s）：`placement.js` 用 `import.meta.glob` 收集资产，
  Vite 把它编译成 **~100 个 lazy chunk**，而清单循环是 `await resolveModule(file)` 逐个取 ——
  localhost 上往返 ≈ 0 ms 所以完全看不出来，公网就是 100 次**串行**往返。
  新增 `tools/net-lag.mjs`：本地静态服务给每个 `.js` 人为加 120 ms 往返，于是能在本地复现。
- [x] 19.14 修法：`placement.js` 求值时就把所有 `import()` 一次性并发发起（吞掉单个失败），
  循环里的 `await` 退化成查表；同一 URL 的第二次 `import()` 走 ES 模块注册表，不会重复请求。
  · 同一台机器、同样 120 ms/chunk：到 built **17.48 s → 7.63 s**（世界阶段 **13.88 → 5.44 s**）
  · 代价：localhost 成帧 7.94 → 8.32 s（+0.4 s，103 个模块集中求值与装配抢主线程）。
    公网省 28 s、本地贵 0.4 s，这笔账显然该做。
  · 复核：`npm run check` 135/135、`npm run build` 正常、JS 请求数 100 → 103（并发后仍是一次一图，
    没有重复下载）。
  · **公网实测（GitHub Pages，同一台机器）：成帧 35.95 s → 8.75 s**（`world` 阶段 31.4 → 4.5 s，800×500）。
    1600×900 单次复测 9.44 s。本地 8.3 s、公网 8.8～9.4 s，两条路径现在都在 10 s 以内。
- [ ] 19.15 还能再压（这次没做）：① signboard 一族 44.7 MB / 159 张仍是最大贴图户，
  可按「招牌实际占屏」分两档尺寸；② 去重后位图仍有 **1167 份 / 239 MB**
  （`texCacheInfo` 现在按 `source.uuid` 去重，之前按缓存条目累加会虚报），
  `wear` 一家就占 352 张 —— 把 `color` 也量化到少数几个做旧色调，可塌到 ~60 张；
  ③ 公网侧还能再收：主 chunk 2.57 MB（gzip 575 KB）是单张最贵的请求，
  要么让 Pages 走 brotli，要么把 `three` 拆成可并行的第二张；
  ④ `materialSignature` 目前不含 `userData.spec`（toon 自定义着色参数），与旧行为一致，
  但严格说同标准配置、不同 `steps/tint` 的两个材质仍会被并到一张 —— 要收紧就得同时接受 draw call 回升。

## 阶段 20 · 加载状态（用户追加：「前面加载增加一个加载状态」）

原需求的「无 UI、无文字、无控件」在**成品画面**上继续成立；装配期那一层是用户后来明确要的，
算对原条款的一次有意例外。做法是把例外压到最小：唯一一处 DOM 覆盖层，首帧画出来就摘掉。

- [x] 20.1 进度是真的，不是假动画：`engine.progress = {v,label}` + `engine.markProgress()`
  （`core/engine.js`），分段权重集中在 `BOOT_PHASES`（地图 0.03–0.30 / 资产 0.30–0.90 /
  LOD 0.92 / 动效 0.92–0.98）。写进 `world/index.js` 的 `mk()`、`placement.js` 的清单循环、
  `motion/index.js` 的注册循环 —— 10 + 122 + 6 次上报，屏幕上推进多少就是真做了多少。
  `markProgress` 单调不回退：阶段并发时进度条倒退比不走更难看。
- [x] 20.2 `core/boot-screen.js` 包住 `markProgress` 顺手写 DOM，而不是另开一个 rAF 刷新循环：
  后台标签页里 rAF 是挂起的，靠 rAF 刷新的进度条会冻在 0%，而装配用的是让出宏任务、照常推进。
- [x] 20.3 撤除时机是「首帧真的画上屏幕」，不是 `built`：built 之后还有约 3 s 的 GPU 首触，
  在那一刻撤会变成「进度条满了、画面还是空的」。用双 rAF 等两帧 + 6 s 定时器兜底
  （兜底是给无头工具/挂机场景的：那种标签页 rAF 不回来，加载层就永远摘不掉）。
- [x] 20.4 视觉：天空底色上「樱花街角」+ 1 px 细线（樱色 #d9879f 填充）+ 阶段名与百分比，
  240 px 一栏居中。`pointer-events:none`，不抢画布操作。
- [x] 20.5 工具跟上：新增 `tools/boot-shot.mjs`（常规截图工具都等 `built`，那张图里加载层早没了，
  永远拍不到它）；`shoot.mjs` / `peek.mjs` 在 `built` 之后还要等 `#boot` 从 DOM 消失才拍
  —— `page.screenshot()` 拍的是合成后的画面，会把 DOM 覆盖层一起拍进去；
  `boot-check.mjs` 断言加载层已摘除且 `progress.v === 1`。
- [x] 20.6 复核：`npm run check` 136/136、`npm run check:boot` 通过（含新断言）、
  `boot-shot` 第 2200 ms 读到 49.3%「摆放店铺与道具」、第 4500 ms 读到 84%；
  1600×900 成帧 8.32 → 8.53 s（+0.2 s，在装配期帧数抖动的噪声带内）。

## 阶段 21 · 天气切换（用户追加：「增加一个天气切换的」）

零 UI 的前提下「切换」不能是界面上的按钮，所以走三条不打扰画面的路：**键盘**（1–5 直选、W 顺序循环、
Shift+W 反向）、**URL 参数** `?weather=`、**API** `__DIORAMA__.setWeather('night')`。
`tools/weather-check.mjs` 用真按键验这条路（用 setWeather 验等于没验输入）。

- [x] 21.1 `src/weather/` 一物一文件：`clear / cloudy / rain / dusk / night` 各是一份**完整状态**
  （天空六级色阶 + 日轮 + 云 + 地平雾带、雾色雾浓、五盏灯的颜色/强度/方向、曝光、环境强度、
  后处理分级 10 项、breeze/lampGain/petal/rain 四个旋钮），不是「在原画面上叠一层滤镜」。
  `sky.js` 负责把色阶画成背景条与 equirect→PMREM。
- [x] 21.2 切换是**指数收敛**而不是两段动画：`easeInto(cur, target, 1-exp(-dt/0.42))`，
  约 1.3 s 走完 95%。中途连按不会打架，也不需要「上一段播完没」的簿记；
  数值/Color/Vector3/Color 数组都能走同一条插值路径。
- [x] 21.3 `clear` 的数值逐条抄自 `core/lighting.js` 与 `core/engine.js`，为的是让天气成为
  **唯一的色彩事实源**，而不是别的天气走新路径、默认态仍写死在引擎里。
  实测与加天气系统之前的基线截图比对：平均通道差 **0.58 / 255**、超 24 级的像素 2.1%
  （那些是花瓣位置与呼吸相位，本来就是动的）—— 默认外观没有被这次改动带走。
- [x] 21.4 灯具亮度走 `WX.lampGain` 乘数，由 `motion/light-breath.js` 作用在
  所有 `userData.breathe` 灯器的 `emissiveIntensity` 与其挂载的点光源上。
  夜景区间的亮度是**逐件灯具**给的（lampGain 3.1），不是整体提曝光 —— 后者会把黑位一起抬灰。
  花瓣量走 `InstancedMesh.count`（雨 0.18 / 夜 0.35），切回晴天立刻回到 1500/5200，不重建实例。
- [x] 21.5 雨丝的形状在**几何**里：平涂会剥掉非 graphic 材质的 map，靠 alpha 拉条的那套不成立。
  1×1 平面按实例缩放成 5.5–9.5 mm 宽、100–260 mm 长的竖条，每帧绕 Y 转到相机方位角，
  于是从任何角度看都是有一条厚度的斜线而不会侧成一条隐形边。rain=0 时 `count` 归 0，零代价。
- [x] 21.6 过渡期阴影必须跟着日光重画，但一次全场景阴影 pass 是几十毫秒级，
  每帧点脏会把 1.3 s 的过渡变成幻灯片 —— 限到每 0.2 s 一次，收尾再补最后一次。
- [x] 21.7 PMREM 按天气**惰性生成并缓存**：五种天气的预生成不能压进那 8 秒的启动预算，
  代价是第一次切到某个天气时多几十毫秒。
- [x] 21.8 复核：`npm run check` 137/137、五天气实拍（`tools/shoot.mjs --weather=clear,cloudy,rain,dusk,night`）、
  键盘链路逐档切换后 sun/fog/exposure/rain/petals 都实际改变、`check:boot` 与 flicker 见下。
- [ ] 21.9 还没做（诚实记录）：① 雨天地面不湿 —— **已在阶段 22 做掉**；
  ② 平涂模式没有 bloom，夜间的灯只亮不晕，氛围差一口气；
  ③ 雨没有水花与涟漪 —— **已在阶段 22 做掉**；④ 电车与信号灯不随天气变（夜里仍是白天节奏）。

## 阶段 22 · 湿地面 + 雨滴水花 + 屏幕上的天气控件

用户追加：「把地面做湿，加雨滴水花效果，切换增加ui」。第三条是对「成品画面零 UI」的
**第二次、也是更大的一次让步**（第一次是加载状态，那还在画面之外），所以 AGENT.md 里
那条要再改口径。

- [x] 22.1 湿地面**没有新增着色器分支，也没有换材质**。toon 内核 `inject()` 本来就给每个材质
  注入了一组 uniform（`uSpecStrength / uSpecPower / uSpecCut / uSat / uContrast / uShadowAmt`），
  「湿」在这六个值上就是：反光更强更宽、颜色更暗更饱和、阴影更实。
  `src/weather/wet.js` 只做这件事。
- [x] 22.2 登记口选在 `kit.surface()` —— 它是所有铺面的唯一出口（`groundYAt` 就靠它登记矩形），
  顺手把**材质对象**收进 `WETTABLE`。同一条 `MAT.asphalt` 铺了整张路网，登记一次就全湿地面，
  不必遍历 26.5k 个 Mesh。
- [x] 22.3 全部按**基准值乘系数**，不是设成固定值：草皮/泥土/道砟的 spec 基准本来就低，
  写死一个高反光会得到一片塑料草坪；乘法让它们只变暗一点、变艳一点。
  基准值在第一次应用时用 WeakMap 快照，`wet` 回到 0 就精确复原。
- [x] 22.4 雨滴水花 `src/motion/rain-splash.js`：`RingGeometry` 转平后实例化，
  扩散用 ease-out、收尾用缩回来做（InstancedMesh 共享材质，做不到逐实例 alpha，
  为这个再加一套 instanceColor 驱动的属性不值得）。
  落点高度一律问 `groundYAt`，跟花瓣同一条规矩。
- [x] 22.5 水花**跟着注视点走**（半径 7 m 圆盘内均匀采样），不是在 40 m 台座上均摊：
  均摊时镜头里只剩两三圈，看着像没做。320 个实例、life 0.42–0.72 s。
- [x] 22.6 天气控件 `src/weather/ui.js`：按钮由预设表生成（NAME + LABEL），加一档天气只改预设文件。
  常驻可见，指针离开时压到 0.42 透明度，不玩「hover 才出现」那种把功能藏起来的把戏。
  配色分亮/暗两套，由预设的 `DARK` 标记切换 —— 夜景上顶着一个白药丸很刺眼。
  状态回显走每帧一次字符串比较，所以键盘 / URL 改天气时按钮也跟着动。
- [x] 22.7 控件这条路**用真点击验**（`weather-check.mjs` 点第 5 个 → night、点第 1 个 → clear，
  并回读 `.is-on` 的高亮项）：按钮是 JS 生成的，光看截图不知道它到底连没连上。
- [x] 22.8 `img-diff.mjs` 加了 `--crop=`，因为控件条本身每次都不同，把它算进「默认画面有没有漂」
  会得到一个假回归。
- [ ] 22.9 还没做：① 只有地面有水花，店前铺面以外的**垂直面**（玻璃、车棚、垃圾桶盖）没有
  顺痕与溅起；② 湿地面只改了铺面材质，自行车/贩卖机/汽车外壳这些**道具**干了；
  ③ 水洼没有真实倒影（要做需要一套反射平面或 SSR，与平涂方向是否相容还没定）。

## 阶段 23 · 修掉招牌上的白横杆（用户报：「路边的几个招牌上都出现了三条横杆」）

- [x] 23.1 不是三条、也不是某一家的建模问题：**每一块牌面都多了一块实心矩形**。
  `tools/peek.mjs` 拉到牌面前才看清 —— 停止标、黄色菱形标、蓝色看板、屋顶看板全中。
- [x] 23.2 根因是**贴图类型用错了地方**，不是平涂剥贴图：`MAT.decal` / `kit.decal` 是
  `MeshBasicMaterial`，绕开 `flatShading()`，所以 map 一定还在。但**贴花的形状来自贴图的 alpha**，
  而 `road-sign-set.js` 把 `TEX.paper()` 当贴花贴图传了进去 —— paper 是「表面贴图」，
  整幅画布 `fillRect` 铺满底色，alpha 处处 255，于是贴花退化成一塊 `w*0.2 × h*0.14`、
  72% 不透明的奶油色实心矩形（`color: '#efe6cf'`）。`vending-machine-tea.js` 拿
  `TEX.fabric()` 干的是同一件事（一块 50% 不透明的深色矩形盖在橡胶垫上）。
- [x] 23.3 修法是**换成自带 alpha 的贴图**：残糊改用 `TEX.wear({ kind: 'dirt' })`
  （背景是 `clearRect` 出来的，有真正的斑驳形状），opacity 0.72 → 0.5；
  贩卖机那块直接删 —— 垫子本来就有 `MAT.rubber` 的实体网格，平涂下织纹也读不出来。
- [x] 23.4 加了**结构性闸门**，因为这类错误不会只犯一次：`paper()` / `fabric()` 在自己的
  map 上打 `userData.opaqueSurface`，`kit.decal()` 见到就 `console.warn` 指出挂在谁身上。
  跑一遍全场景**零条警告** —— 说明这两处就是全部，这个类别现在是空的。
- [x] 23.5 顺带纠正一个此前的错误结论：`clear` 相对「加天气系统之前」基线的平均通道差
  从 **0.82 降到 0.65**（`img-diff --crop=0,0,1600,830`）。也就是说那几块奶油矩形一直在把
  默认画面往「不像原版」的方向推，之前 0.82 被当成了动画噪声。
  **教训**：画面回归的比对数字变大时，先怀疑自己画错了，别急着归因给「花瓣位置本来就在动」。
- [x] 23.6 复核：`npm run check` 138/138、无 `[decal]` 警告、无 pageerror；
  招牌 / 看板 / 贩卖机实拍干净；三张发布截图与两张天气配图全部重拍（旧图里那些白杆是看得见的）。

## 阶段 24 · 整体建模复查（用户：「整体建模全部查一下，不合理的地方修一下」）

11 个预设机位全部重拍（`shots/audit/`），另派两个子代理分头看图列缺陷，回来再逐条自己复验
—— 子代理报的坐标有超出画面高度的，说明它没在真读像素，**所以它的每条结论都必须自己看一眼才算**。

已修（都有前后对比）：

- [x] 24.1 **路面的「奇怪方块」**：`road-network.js` 的補修パッチ是 `rbox(w, 0.014, d, 0.06, 2)` ——
  14 mm 厚、带圆角、还会投影的**盒子**，落在路面上就是几块深灰瓷砖（顶视最明显）。
  改成贴地平面（`Y.road + 0.008`，`cast:false`，`noOutline`），yaw 从随机 ±0.5 rad 改为顺着车行道
  ±0.06 rad，并且**避开三处斑马线与踏切**（原来补丁直接压在斑马线上）。
- [x] 24.2 **店招色带上的白条**：`awning.js` 左右两条资讯带用 `TEX.adStrip({bg: PAL.paintWarm})` ——
  等于在红/金/蓝三色条上各贴一张 84 mm 高的白纸。改成印在色带上（底色取带自身的红/蓝，字用暖白）。
  顺带修了 `adStrip` 的一个静默 bug：它**不接 `fg`**，传了也会被忽略且不进 memo key
  —— 现在接了，并且 `fg` 进 key，否则「同文案不同底色」会命中同一张贴图。
- [x] 24.3 **`fadeWear` 把褪色画进了 alpha 通道**：canvas 的 alpha 就是贴花的 alpha，
  `globalAlpha = 0.1` 画出来的褪色斑在贴图里是 10% 半透明像素，`alphaTest 0.02` 挡不住，
  于是牌面会透出背后的东西。改用 `globalCompositeOperation = 'source-atop'`：只与已有像素合成、
  保留目标 alpha。同类写法在 `src/assets/**` 里还有十几处（grass-slope / sakura-* /
  basket-and-cart / backroom-shelving…），**但它们都是画在已经铺满底色之上**，结果仍是不透明，
  所以没有一并改 —— 只有「必须保留透明边角」的牌面贴图会中招。
- [x] 24.4 新增 `tools/part-dump.mjs`：资产级 inspect 看不到「这一块矩形是谁」，
  这个把零件的 材质/贴图尺寸/opacity/alphaTest/renderOrder 逐条打出来。

**没修完的，先记账**：

- [x] 24.5 **限速牌上的横杠（用户复确认）—— 真因是 LOD 与实例化的相互作用**：（`shots/sign4.png`）：能看到背后的色带、货架与补强筋。
  牌板后面那两根 w*0.72 的补强筋被 autoInstance 并成一个批次，而 core/lod.js 对批次
  是按「批次自身包围球直径」判定的（那条规则本是为了让一树花瓣、一排饮料不被整批剔掉）。
  两根筋上下相距 0.24 m，合并后批次直径 ≈ 0.43 m，比牌面还"大" —— 于是远景把牌板与牌面
  剔掉、却把两根筋留下：实拍里就是招牌上横着几条浅色杠，并且能透过消失的牌面看到立柱和店招。
  修法：给筋打 `userData.noInstancing`，逐件判定就会先剔筋、再剔板。角位与店前机位复拍确认干净。
  **走过的弯路**（都被实验否掉，记下来免得重走）：air-haze（藏掉后依旧）、fadeWear 的 alpha
  （改 source-atop 后依旧）、标板单面（DoubleSide 后依旧）。最后是**把筋染成品红重拍**一次定案的 ——
  颜色没变才说明不是筋本身画在前面，而是筋"活"得比牌板久。
- [ ] 24.6 子代理另报的、我还没逐条复验的：站台空招牌框、自行车互相穿插、砖柱顶到空处、
  店内悬浮木条与横板、侧沟附近的白色环与棕色弯管、黄色虚线断块、信号灯头偏离立柱、
  电车车身广告块、踏切外三块波纹板与棕色地面。
