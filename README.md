# Wang Ruize · Portfolio

黑金静态站：主页 + Journey / Lab / Work 详情。可静态托管。

## 线上地址

推送到 `main` 后由 GitHub Pages 自动部署：

**https://wangruzie-maker.github.io/Portfolio/**

线上版本会隐藏「编辑 / 导出同步包」；仅本机 `localhost` 可编辑。

## 本地预览

```bash
npx --yes serve -l 5173 .
```

打开 `http://localhost:5173`。本地仍可编辑并导出全局同步包。

用 `?public=1` 可在本地预览「线上只读」效果。

## 编辑模式（仅本地）

- 点「编辑内容」，或访问 `/?edit=1`
- 改字 / 换图自动保存在本机
- 「导出全局同步包」后放到 `sync-inbox/`，用 `scripts/apply-browser-sync.py` 写入仓库

## 路由

| Hash | 页面 |
|------|------|
| `#/home` | 主页 |
| `#/experience/baidu` | 百度 |
| `#/experience/quwan` | 趣丸 |
| `#/experience/iflytek` | 讯飞 |
| `#/experience/zixun` | 紫讯 |
| `#/tools` / `#/tools/wefly` | 工具中心 |
| `#/works` | 作品（跳转飞书） |

## 目录

```
index.html
css/main.css
js/content.js   # 默认文案
js/app.js       # 路由 / 渲染 / 编辑
```

## 明天合并主站

把 `css/`、`js/`、路由与黑金变量并入主项目即可；工具 Demo 可另放静态 HTML，面试现场打开。
