---
name: chrome-cdp
description: 通过 Chrome DevTools Protocol 与本地浏览器交互（仅在用户明确要求检查、调试或与 Chrome 中打开的页面交互后触发）
---

# Chrome CDP

轻量级 Chrome DevTools Protocol CLI。通过 WebSocket 直连，无需 Puppeteer，支持 100+ 标签页，即时连接。

## 前置条件

- Chrome（或 Chromium、Brave、Edge、Vivaldi）启用远程调试：打开 `chrome://inspect/#remote-debugging` 并开启开关
- Node.js 22+（使用内置 WebSocket）
- 若浏览器 `DevToolsActivePort` 位于非标准位置，设置 `CDP_PORT_FILE` 为其完整路径

## 命令

所有命令使用 `scripts/cdp.mjs`。`<target>` 是 `list` 输出的唯一 targetId 前缀；复制显示的完整前缀（如 `6BE827FA`）。CLI 拒绝模糊前缀。

### 列出打开的页面

```bash
scripts/cdp.mjs list
```

### 截图

```bash
scripts/cdp.mjs shot <target> [file]    # 默认: runtime 目录下的 screenshot-<target>.png
```

仅捕获**视口**。若需视口外内容，先用 `eval` 滚动。输出包含页面的 DPR 和坐标转换提示（见下方**坐标**部分）。

### 无障碍树快照

```bash
scripts/cdp.mjs snap <target>
```

### 执行 JavaScript

```bash
scripts/cdp.mjs eval <target> <expr>
```

> **注意：** 避免在多次 `eval` 调用中使用基于索引的选择（`querySelectorAll(...)[i]`），因为 DOM 可能在调用之间改变（如点击忽略后，索引会偏移）。在一次 `eval` 中收集所有数据或使用稳定的选择器。

### 其他命令

```bash
scripts/cdp.mjs html    <target> [selector]   # 完整页面或元素 HTML
scripts/cdp.mjs nav     <target> <url>         # 导航并等待加载完成
scripts/cdp.mjs net     <target>               # 资源计时条目
scripts/cdp.mjs click   <target> <selector>    # 通过 CSS 选择器点击元素
scripts/cdp.mjs clickxy <target> <x> <y>       # 在 CSS 像素坐标处点击
scripts/cdp.mjs type    <target> <text>         # 在当前焦点处输入文本；可用于跨域 iframe
scripts/cdp.mjs loadall <target> <selector> [ms]  # 重复点击"加载更多"直到消失（默认 1500ms 间隔）
scripts/cdp.mjs evalraw <target> <method> [json]  # 原始 CDP 命令穿透
scripts/cdp.mjs open    [url]                  # 打开新标签页（每次触发允许提示）
scripts/cdp.mjs stop    [target>               # 停止守护进程
```

## 坐标

`shot` 以原生分辨率保存图片：图片像素 = CSS 像素 × DPR。CDP Input 事件（`clickxy` 等）使用 **CSS 像素**。

```
CSS px = 截图像素 / DPR
```

`shot` 为当前页面打印 DPR。典型 Retina (DPR=2)：将截图坐标除以 2。

## 技巧

- 优先使用 `snap --compact` 而非 `html` 查看页面结构。
- 在跨域 iframe 中输入文本使用 `type`（而非 eval）— 先用 `click`/`clickxy` 聚焦，再 `type`。
- Chrome 在首次访问每个标签页时显示"允许调试"模态框。后台守护进程保持会话活跃，后续命令无需再次批准。守护进程 20 分钟无活动后自动退出。
