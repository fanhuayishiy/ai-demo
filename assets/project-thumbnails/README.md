# 项目截图缩略图

README 项目列表与网站选择卡片共用这些静态 WebP，统一为 640×360；README 显示为 160×90。17 张合计约 334 KB，单张约 5–36 KB。网页使用原生懒加载、异步解码和固定宽高，避免加载动画/3D 场景或未压缩大图。

所有缩略图来自实际项目画面或项目自带的 Blender 渲染，不使用 AI 海报代替运行截图。2026-10-20 选图来源如下：

| 项目 | 截图来源 |
| --- | --- |
| habitat-interactive-home | 本地 `dist/index.html` 实际运行截图 |
| orbit-heatpump-washer-dryer | `output/ORBIT-interactive-desktop.png` |
| boeing-787-digital-twin | `output/desktop-assembled.png` |
| sunny-side-kindergarten | `screenshots/desktop.jpg` |
| hydrogen-energy-system | 本地 `index.html` 实际运行截图 |
| campus-3d-dashboard | 本地 `index.html` 实际运行截图 |
| mcb-2p-c16-blender-animation | `00_Exterior_Preview.png` |
| voxel-construction-site | `first-view.png` |
| voxel-ramen-stall | `day-view.png` |
| sakura-station-corner | `first-view.png` |
| sanfang-qixiang-atlas | 本地 `dist/index.html` 实际运行截图 |
| terra-728-tractor-blender-animation | `01_Hero.png` |
| sunset-flight-study | `docs/screenshots/sunset-controls-music-final.jpg` |
| warehouse-demo | `docs/screenshots/overview.png` |
| modular-fire-response | 本地 `dist/index.html` 实际运行截图 |
| roadster-escape-toll | 本地 `index.html` 开始游戏后的实际截图 |
| ocean-shallows | 本地 `index.html` 实际运行截图 |

更新时保留对应文件名、16:9 比例及清晰可辨的主体。新增项目用 `npm run add:project -- --screenshot ./assets/project-thumbnails/<dir>.webp ...`，并确认 README、首页和实际预览链接一致。
