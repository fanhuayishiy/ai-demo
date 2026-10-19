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
  --desc "2-4 句速览（进下方段落）"
```

可选参数：`--preview ./<dir>/dist/index.html`、`--dry-run`。

同时记得把 `index.html` 顶部 `<meta name="description">` 里的「N 个可运行项目」改成新的总数。

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

`tests/add-project.test.mjs` 会校验首页卡片顺序与 README 索引顺序一致、每个卡片都有对应目录与 README。改动索引后必须让 `npm test` 通过。
