# Wang Ruize · Ivory Monument Portfolio

本地备份目录：在象牙纪念碑视觉上，按现网 Portfolio 信息架构重建的个人简历站。

**原 `palais-aigc` 未改动；本目录为独立工作副本。** 确认满意后再自行上传到 GitHub。

## 预览

```bash
cd palais-aigc-portfolio-ivory
python3 -m http.server 8768
# 打开 http://localhost:8768
```

编辑模式：`http://localhost:8768/?edit=1` 或点右上角「编辑」。

## 结构

| 路由 | 说明 |
|------|------|
| `#/home` | 姓名 / 简介 / 联系 / 技能 / CTA + 轨迹 |
| `#/journey` | 教育 + 实习列表 → 详情 |
| `#/baidu` 等 | 实习详情（modules + GitHub 图） |
| `#/lab` | Wefly / 星阵 / 选题工具 |
| `#/tool-*` | 工具图文说明；Demo 链现网 |
| `#/work` `#/works` | 作品入口与说明（含飞书） |

星阵高保真：`xingzhen-hifi.html`（图文示意）+ `xingzhen-live.html`（可交互原型）。

## 资源

- 文案：`content.js`（来自 [wangruzie-maker/Portfolio](https://github.com/wangruzie-maker/Portfolio)）
- 图片：默认 `ASSET_BASE = https://wangruzie-maker.github.io/Portfolio/`
- Demo：同基址下 `demos/wefly`、`demos/topic-ai`；星阵指向本地高保真
- 编辑：本机 `localStorage`（与 GitHub 版能力对齐：改文案、模块显隐）

## 动效来源

交互语法参考 [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy)（wipe CTA、soft lift card、ink-dot loader、tooltip、shimmer tag），统一重染色为象牙 / 墨绿 / 金，避免组件拼贴感。
