# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>開源的 Agent 內容系統</strong></p>

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
  <img alt="淺色模式顯示太陽插圖，深色模式顯示月亮與星星。" src="../images/landing_light.png">
</picture>

## Polywise 是什麼

Polywise 是一個開源的 Agent 內容系統。你可以在命令列或桌面應用中用它與模型對話、保存知識、檢索上下文，還能把反覆使用的工作方式整理成可重用的 agents。

## 🚀 安裝

Polywise 主要有兩個實用入口：CLI 與桌面應用。

### CLI

先全域安裝 CLI：

```bash
npm install -g polywise
```

啟動本機 Polywise 服務：

```bash
polywise start
polywise start -d
```

`polywise start` 會讓服務以前景方式運行。`polywise start -d` 會立刻退出終端，但服務會繼續在背景運行。

接著打開 Web UI：http://localhost:3072/app/ 。

你可以在設定中啟用 Auth 登入。啟用後，只要設好了密碼，存取 Web UI 時就必須先登入，API 也會一併受到保護。如果你打算把 Polywise 部署到伺服器上供遠端使用，這一步非常重要。

### 桌面應用

可從 [GitHub Releases](https://github.com/MatrixAges/polywise/releases) 下載最新桌面版本。

如果你想更輕鬆地查看 sessions、已儲存內容、agents 與 posts，桌面應用會是最省力的入口，不必一直待在終端裡。

### 第一次執行

第一次使用 Polywise，通常只需要準備：

- 一個可用的模型供應商
- 如果你想使用已儲存內容的檢索功能，再配置 embedding 與 rerank 模型

第一天不需要把所有 provider 和 integration 都一次配完。

## ⬆️ 升級

### CLI

```bash
polywise upgrade
```

### 桌面應用

從 [GitHub Releases](https://github.com/MatrixAges/polywise/releases) 安裝最新版本即可。

## ⚡ 快速開始

如果你想用最短路徑感受到價值：

1. 打開 `Settings -> Model Provider`，先配置一個你現在真的能用的 provider。
2. 打開 `Settings -> Model Setting`，確認預設聊天模型可用。
3. 進入 `Session`，問一個真實問題，不要只輸入 `hello`。
4. 把一則短筆記、頁面摘要，或一段回答存進 Polywise。
5. 在聊天中再次提到那筆已儲存內容，確認檢索是否正常工作。

## 🧭 使用方式

當你已經連上一個 provider，並設定好預設模型後，就別一直停在設定頁了，直接開始用產品。

### 桌面應用

只要你替每個區域安排一個明確任務，整個應用就會變得很好理解：

- `Session`：用來提真實問題、規劃工作，並保持在你的工作上下文裡
- `Linkcase`：抓取網頁內容並匯入系統
- `Agent`：把反覆出現的指令風格整理成可重用的協作夥伴
- `Posts`：保存那些不該只停留在聊天回覆裡的知識

有兩個快捷方式，很值得早點熟悉：

- `@` 可以把檔案、agents 與其他上下文帶進目前的 session
- `/` 可以把工具與 skills 拉進當前工作流

### CLI

CLI 本質上是後端 API 的一層輕封裝。預設連到 `http://localhost:3072`；如果你的服務跑在別處，設定 `POLYWISE_SERVER_URL` 即可。

與其硬背命令，不如先從說明開始：

```bash
polywise -h
polywise session -h
polywise session create -h
```

當你需要精準知道某個命令的輸入結構時，用 `input_schema`：

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

當參數變得更複雜時，可以直接傳 JSON：

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 文件

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 為什麼要做 Polywise

Polywise 背後的核心信念是：**真正聰明的 AI，需要真正聰明的記憶系統**。它不只是「把內容存起來」，而是一個能自然建立連結、越用越強、會有策略地遺忘，並持續演化的系統。

## 📄 參考資料

這個專案受到以下研究論文啟發：

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 致謝

Polywise 站在這些優秀開源專案的肩膀上：

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - 全球部署最廣的高效能嵌入式資料庫之一
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - 為 Sqlite 加上向量檢索能力
- ⚛️ **[React](https://react.dev/)** - 前端 UI 函式庫
- 🖥️ **[Electron](https://www.electronjs.org/)** - 桌面應用框架
- 🔗 **[tRPC](https://trpc.io/)** - 端到端型別安全 API
- 📦 **[MobX](https://mobx.js.org/)** - 簡單且可擴充的狀態管理
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS 框架
- 🚀 **[Hono](https://hono.dev/)** - 超快的 Web 框架
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - 由 Rspack 驅動的新世代建構工具
- 📚 **[Rslib](https://rslib.dev/)** - 基於 Rsbuild 的函式庫建構工具
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - 建立 AI 應用的統一工具組
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – 面向 llama-cpp 的 Node.js 綁定，用來串接本地模型

## 📜 授權

MIT - 詳見 [LICENSE](LICENSE)。
