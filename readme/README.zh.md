# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>开源的 Agent 内容系统</strong></p>

<p align="center">
<a href="https://x.com/xiewendao"><img src="https://img.shields.io/badge/Follow-222?logo=X" alt="X"></a>
<a href="https://discord.com/invite/6MDTdVzR3Y"><img alt="Discord" src="https://img.shields.io/badge/Discord-eee?logo=discord" />
</a>
<a href="../LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
 <a href="https://www.npmjs.com/package/polywise"><img alt="npm" src="https://img.shields.io/npm/v/polywise" /></a>
</p>

<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../images/landing_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="../images/landing_light.png">
  <img alt="浅色模式下显示太阳插画，深色模式下显示月亮和星星。" src="../images/landing_light.png">
</picture>

## Polywise 是什么

Polywise 是一个开源的 Agent 内容系统。你可以在命令行或桌面端里用它和模型对话、保存知识、检索上下文，还能把反复使用的工作方式沉淀成可复用的 agents。

## 🚀 安装

Polywise 主要有两个实用入口：CLI 和桌面应用。

### CLI

先全局安装 CLI：

```bash
npm install -g polywise
```

启动本地 Polywise 服务：

```bash
polywise start
polywise start -d
```

`polywise start` 会以前台方式运行服务。`polywise start -d` 会立刻退出终端，并让服务继续在后台运行。

然后打开 Web UI：http://localhost:3072/app/ 。

你可以在设置里开启 Auth 登录。启用后，只要设置了密码，访问 Web UI 时就必须先登录，API 也会一起受到保护。如果你准备把 Polywise 部署到服务器上，供远程访问使用，这一步非常重要。

### 桌面应用

可在 [GitHub Releases](https://github.com/MatrixAges/polywise/releases) 下载最新桌面版本。

如果你想更轻松地浏览 sessions、已保存内容、agents 和 posts，桌面应用会是最省事的入口，不用一直待在终端里。

### 首次运行

第一次用 Polywise，通常只需要准备：

- 一个可用的模型提供商
- 如果你想使用已保存内容的检索能力，再配置 embedding 和 rerank 模型

第一天不需要把所有 provider 和 integration 都配齐。

## ⬆️ 升级

### CLI

```bash
polywise upgrade
```

### 桌面应用

从 [GitHub Releases](https://github.com/MatrixAges/polywise/releases) 安装最新版本即可。

## ⚡ 快速开始

如果你想用最短路径感受到价值：

1. 打开 `Settings -> Model Provider`，先配一个你当前真的能用的 provider。
2. 打开 `Settings -> Model Setting`，确认默认聊天模型可用。
3. 进入 `Session`，问一个真实问题，不要只发一句 `hello`。
4. 保存一条简短笔记、页面摘要，或者一段回答到 Polywise 里。
5. 在聊天里再次提到这条已保存内容，确认检索能正常工作。

## 🧭 使用方式

当你已经连上一个 provider，并设置好默认模型后，就别一直停留在配置页面了，直接开始用产品。

### 桌面应用

如果你给每个区域都安排一个明确任务，整个应用会很好理解：

- `Session`：拿来提真实问题、规划工作，并保持在你的工作上下文里
- `Linkcase`：抓取网页内容并提取进系统
- `Agent`：把重复出现的指令风格整理成可复用的协作伙伴
- `Posts`：保存那些不该只停留在聊天回复里的知识

有两个快捷方式，建议尽早熟悉：

- `@` 可以把文件、agents 和其他上下文带进当前 session
- `/` 可以把工具和 skills 拉进当前工作流

### CLI

CLI 本质上是后端 API 的一层薄封装。默认连接 `http://localhost:3072`；如果你的服务跑在别处，设置 `POLYWISE_SERVER_URL` 即可。

与其死记命令，不如先从帮助开始：

```bash
polywise -h
polywise session -h
polywise session create -h
```

当你需要精确知道某个命令的输入结构时，用 `input_schema`：

```bash
polywise input_schema session.create
```

常用命令：

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

当参数开始变复杂时，可以直接传 JSON：

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 文档

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 为什么做 Polywise

Polywise 背后的核心信念是：**真正聪明的 AI，需要真正聪明的记忆系统**。它不只是“把内容存起来”，而是一个能自然建立连接、越用越强、会有策略地遗忘，并持续演化的系统。

## 📄 参考资料

这个项目受以下研究论文启发：

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 致谢

Polywise 站在这些优秀开源项目的肩膀上：

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - 全球部署最广的高性能嵌入式数据库之一
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - 为 Sqlite 增加向量检索能力
- ⚛️ **[React](https://react.dev/)** - 前端 UI 库
- 🖥️ **[Electron](https://www.electronjs.org/)** - 桌面应用框架
- 🔗 **[tRPC](https://trpc.io/)** - 端到端类型安全 API
- 📦 **[MobX](https://mobx.js.org/)** - 简单且可扩展的状态管理
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS 框架
- 🚀 **[Hono](https://hono.dev/)** - 超快的 Web 框架
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - 由 Rspack 驱动的新一代构建工具
- 📚 **[Rslib](https://rslib.dev/)** - 基于 Rsbuild 的库构建工具
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - 构建 AI 应用的统一工具集
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – 面向 llama-cpp 的 Node.js 绑定，用来对接本地模型

## 📜 许可证

MIT - 详见 [LICENSE](LICENSE)。
