# AGENTS.md

给在本仓库里工作的 AI 助手与人：以下规则是硬约束，不是建议。

## 新增项目：只能追加到最后一位

首页卡片顺序就是发布顺序（`scripts/prepare-pages.mjs` 按卡片顺序发现预览），因此三处顺序必须完全一致：

1. `index.html` 里 `.grid` 内的卡片；
2. `README.md`「项目列表」表格的行；
3. `README.md` 下方「项目速览」的 `##` 段落。

**新项目一律追加到这三处的末尾，不得插入任何已有项目之间，也不得重排既有项目。**

不要手改三处。用脚本一次追加到位：

```bash
npm run add:project -- \
  --dir new-project \
  --title "项目标题" \
  --tag "THREE.JS / 主题标签" \
  --summary "一句话简介（进表格与卡片）" \
  --screenshot ./assets/project-thumbnails/new-project.webp \
  --desc "2-4 句速览（进下方段落）"
```

可选参数：`--preview ./<dir>/dist/index.html`、`--dry-run`。

同时记得把 `index.html` 顶部 `<meta name="description">` 里的「N 个可运行项目」改成新的总数。

## 截图与卡片写法：所有新项目必须沿用

1. **先准备真实截图，再追加项目**：用项目实际运行画面或本项目的模型渲染，不用 AI 宣传海报、占位图、远程热链或加载失败画面代替。
2. **统一资源位置与格式**：`assets/project-thumbnails/<项目目录名>.webp`，实际图片尺寸必须是 **640×360**，静态 WebP，文件大于 1 KB、小于 80 KB。不能只修改 HTML 宽高冒充合格尺寸。
3. **首页卡片保持结构**：`img.project-shot`、`width="640" height="360"`、`loading="lazy" decoding="async"`，有明确 `alt`；原 `a.badge.cover` 仍进入项目，提示词入口保留。
4. **统一使用放大逻辑**：首页必须保留 `assets/gallery-preview.js` 的 `defer` 引用。新卡片的 `.project-shot` 会自动获得桌面悬停大图、手机放大按钮和可关闭弹层，不要逐项目复制或另写一套。
5. **README 维持五列表格**：`截图 | 项目 | 一句话简介 | 预览 | 详细文档`。小图显示 **160×90**，点击打开图片本身，独立“在线”链接进入项目，“README”链接进入详细文档。GitHub README 不支持自定义悬停脚本，禁止加入无效的 `onmouseover` 或自定义 JS。
6. **不能通过删检查来过关**：不得删除截图列、删项目、跳过测试、弱化图像格式/链接/顺序检查或修改既有项目顺序来消除报错。确需改变全站约定时，应说明理由，同步更新规则和有针对性的测试，不能只放松断言。

正式命令必须传 `--screenshot`；缺图、伪扩展名、错误尺寸、动画、大图或错误路径会在写入索引前被拒绝。`appendProject()` 保留旧格式纯函数兼容，仅供测试或迁移，不能作为绕过正式收录检查的发布入口。

## 项目目录要求

根目录一个独立文件夹，内含：

- `index.html`（或 `dist/index.html`）—— 可运行的静态预览；
- `README.md` —— 必须包含 `## 主生成提示（原文）`，逐字收录提示词，不改写、不精简。

早期原文无法核验时，必须在该小节里明确说明「原文未能核验」，另起一节标注「一键复现提示词」，**不得把复现提示冒充历史原文**。

## 校验

```bash
npm test              # 含顺序一致性校验，顺序漂移会直接失败
npm run build:pages   # 生成 _site，检查发布产物
```

`tests/add-project.test.mjs` 校验追加顺序；`tests/project-thumbnails.test.mjs` 校验每张卡片与 README 截图、链接、懒加载和统一放大入口；`tests/project-screenshot.test.mjs` 校验真实图片格式、尺寸和预算。改动索引后必须让 `npm test` 通过。

GitHub Actions 对 `main` 的推送和 PR 运行检查，检查失败不得部署；Cloudflare 部署也必须先通过测试。不要把“CI 阻止部署”说成 Git 本身禁止提交或推送。
