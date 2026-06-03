# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>オープンソースのエージェント型コンテンツシステム</strong></p>

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
  <img alt="ライトモードでは太陽のイラスト、ダークモードでは月と星が表示されます。" src="../images/landing_light.png">
</picture>

## Polywise とは

Polywise はオープンソースのエージェント型コンテンツシステムです。コマンドラインやデスクトップアプリからモデルと会話し、知識を保存し、文脈を引き出し、繰り返し使う作業スタイルを再利用可能な agents に変えていけます。

## 🚀 インストール

Polywise を使い始める入口は、実用的には CLI とデスクトップアプリの 2 つです。

### CLI

まず CLI をグローバルにインストールします。

```bash
npm install -g polywise
```

ローカルの Polywise サービスを起動します。

```bash
polywise start
polywise start -d
```

`polywise start` はサービスをフォアグラウンドで実行します。`polywise start -d` はすぐに終了しますが、サービスはバックグラウンドで動き続けます。

その後、Web UI の http://localhost:3072/app/ を開いてください。

設定画面から Auth ログインを有効にできます。有効化してパスワードを設定すると、Web UI にアクセスするたびにログインが必要になり、API も保護されます。Polywise をサーバーにデプロイしてリモート利用するなら、ここはかなり重要です。

### デスクトップアプリ

最新のデスクトップビルドは [GitHub Releases](https://github.com/MatrixAges/polywise/releases) からダウンロードできます。

セッション、保存済みコンテンツ、agents、posts をターミナルなしで見て回りたいなら、デスクトップアプリがいちばん手軽です。

### 初回起動

最初に必要なのは、基本的には次の 2 点です。

- 利用可能なモデルプロバイダーを 1 つ
- 保存済みコンテンツの検索も使いたいなら、embedding モデルと rerank モデル

初日からすべての provider や integration を設定し切る必要はありません。

## ⬆️ アップグレード

### CLI

```bash
polywise upgrade
```

### デスクトップアプリ

[GitHub Releases](https://github.com/MatrixAges/polywise/releases) から最新リリースをインストールしてください。

## ⚡ クイックスタート

最短で価値を感じたいなら、まずは次の流れがおすすめです。

1. `Settings -> Model Provider` を開き、今すぐ実際に使える provider を 1 つ設定する。
2. `Settings -> Model Setting` を開き、デフォルトのチャットモデルが使える状態か確認する。
3. `Session` に移動し、`hello` ではなく本物の質問を 1 つ投げる。
4. 短いメモ、ページ要約、回答のどれかを 1 つ Polywise に保存する。
5. その保存した項目をチャットでもう一度触れて、検索できることを確かめる。

## 🧭 使い方

provider を 1 つつなぎ、デフォルトモデルも設定できたら、設定ばかり触らずそのまま使い始めるのがいちばんです。

### デスクトップアプリ

各エリアに 1 つずつ具体的な役割を持たせると、アプリの全体像がかなり掴みやすくなります。

- `Session` は本物の質問をしたり、作業を整理したり、ワークスペースの文脈の中で進めたりするときに使う
- `Linkcase` は Web コンテンツを取得してシステムに取り込むときに使う
- `Agent` は繰り返し出てくる指示スタイルを再利用可能な協働相手に育てるために使う
- `Posts` はチャット返信以上に長く残したい知識を保存するために使う

早めに覚えておくと便利なショートカットは 2 つあります。

- `@` はファイル、agents、そのほかの文脈を session に持ち込む
- `/` はツールや skills をワークフローに呼び出す

### CLI

CLI はバックエンド API を薄く包んだラッパーです。デフォルトでは `http://localhost:3072` に接続します。サーバーが別の場所にある場合は `POLYWISE_SERVER_URL` を設定してください。

コマンドを暗記するより、まずはヘルプから入るのがおすすめです。

```bash
polywise -h
polywise session -h
polywise session create -h
```

コマンドの入力形式を正確に知りたいときは `input_schema` を使います。

```bash
polywise input_schema session.create
```

よく使うコマンド:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

ペイロードが複雑になってきたら、JSON をそのまま渡せます。

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 ドキュメント

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Polywise の考え方

Polywise は、**本当に賢い AI には、本当に賢い記憶が必要だ**という考えを土台に作られています。単に保存するだけではなく、つながりを自然に作り、使うほど強くなり、必要に応じて忘れ、時間とともに進化していく仕組みを目指しています。

## 📄 参考文献

このプロジェクトは以下の研究論文から着想を得ています。

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 謝辞

Polywise は、以下の素晴らしいオープンソースプロジェクトに支えられています。

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - 世界でもっとも広く使われている高性能組み込みデータベースのひとつ
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Sqlite にベクトル検索機能を追加
- ⚛️ **[React](https://react.dev/)** - フロントエンド UI ライブラリ
- 🖥️ **[Electron](https://www.electronjs.org/)** - デスクトップアプリケーションフレームワーク
- 🔗 **[tRPC](https://trpc.io/)** - エンドツーエンドで型安全な API
- 📦 **[MobX](https://mobx.js.org/)** - シンプルで拡張しやすい状態管理
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - ユーティリティファーストの CSS フレームワーク
- 🚀 **[Hono](https://hono.dev/)** - 超高速な Web フレームワーク
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Rspack ベースの次世代ビルドツール
- 📚 **[Rslib](https://rslib.dev/)** - Rsbuild ベースのライブラリビルドツール
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - AI アプリケーション開発のための統合ツールキット
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – ローカルモデルとつなぐための llama-cpp 向け Node.js バインディング

## 📜 ライセンス

MIT - 詳細は [LICENSE](LICENSE) を参照してください。
