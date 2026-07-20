# 合并说明（GitHub 首页 × 子页 Demo）

## 结构

| 页面 | 作用 |
|------|------|
| `index.html` | GitHub 首页（Surendar 黑金壳）+ 中文导航 |
| `detail.html` | 详细子站：经历 / 工具 / 作品说明 |

## 导航对齐（以子页名为准）

- **主页** → `index.html#home`
- **经历** → `index.html#journey`（列表）→ 点击进 `detail.html#/experience/...`
- **工具** → `detail.html#/tools`
- **作品** → `index.html#work` + `detail.html#/works`

## 视觉统一

- 字体：Instrument Sans / Instrument Serif / Noto Serif SC
- 色板：`#0a0a0b` 底 + `#e9b872` 金（与 surendar.css 一致）
- 动效：首页 Lenis + reveal；子页 150–300ms fade（尊重 reduced-motion）

## 本地预览

```bash
npx --yes serve -l 5173 .
```

打开 http://localhost:5173/

## 推回 GitHub

将本目录内容覆盖到 `wangruzie-maker/Portfolio` 仓库后 push 即可（大资源 assets/covers 可从原仓库保留）。
