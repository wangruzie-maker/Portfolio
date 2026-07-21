# 社媒选题与创作工具 · 作品集体验包
#
# 来源：https://github.com/wangruzie-maker/cuddly-guacamole
# 完整 B 方案：含 Python 后端 + static 前端 + 样例数据

## 线上（GitHub Pages）
打开本目录 `index.html` → 自动进入 `static/index.html?demo=1`
无后端时由 `demo-bridge.js` 加载 `demo/sample_data` 样例，可浏览界面与示例内容。

## 本机完整体验（推荐演示采集能力）
```powershell
cd demos\topic-ai
.\start-demo.ps1
```
浏览器打开 http://127.0.0.1:8765/?demo=1

需已安装 Python 3.10+，首次会 pip install -r requirements.txt
