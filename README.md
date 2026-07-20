# 王瑞泽 Portfolio Demo

极简黑金静态站：主页 + 4 经历 + 工具 + 作品。可静态托管。

## 本地预览

```bash
# 任意静态服务器即可，例如：
npx --yes serve .
# 或 Python
python -m http.server 5173
```

打开 `http://localhost:5173`（或提示的端口）。

## 编辑模式

- 点右上角「编辑」，或访问 `/?edit=1#/home`
- 点击文案即可改字，**自动保存到 localStorage**
- 经历页可「新增 / 上移 / 下移 / 删除」产出模块
- 「导出 JSON」便于提交到仓库覆盖默认文案
- 「恢复默认」清除本机修改

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
