# <p align="center"> <img src="images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>The open source agentic content system</strong></p>

<p align="center">
<a href="https://x.com/xiewendao"><img src="https://img.shields.io/badge/Follow-222?logo=X" alt="X"></a>
<a href="https://discord.com/invite/6MDTdVzR3Y"><img alt="Discord" src="https://img.shields.io/badge/Discord-eee?logo=discord" />
</a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
 <a href="https://www.npmjs.com/package/polywise"><img alt="npm" src="https://img.shields.io/npm/v/polywise" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
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
  <source media="(prefers-color-scheme: dark)" srcset="images/landing_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="images/landing_light.png">
  <img alt="Shows an illustrated sun in light mode and a moon with stars in dark mode." src="images/landing_light.png">
</picture>

## What's Polywise

Polywise is the open-source agentic content system. You can use it from the command line or the desktop app to chat with models, save knowledge, retrieve context, and turn repeated working styles into reusable agents.

## 🚀 Install

Polywise has two practical entry points: the CLI and the desktop app.

### CLI

Install the CLI globally:

```bash
npm install -g polywise
```

Start the local Polywise service:

```bash
polywise start
polywise start -d
```

`polywise start` keeps the service in the foreground. `polywise start -d` exits immediately and leaves the service running in the background.

Then visit web UI at http://localhost:3072/app/ .

You can enable Auth login within the settings. Once enabled and a password has been set, you will be required to log in when accessing the Web UI in order to access the API. This is crucial if you are deploying Polywise as a service on a server for remote access.

### Desktop App

Download the latest desktop build from [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

The desktop app is the easiest way to explore sessions, saved content, agents, and posts without working from the terminal.

### First Run

For a first run, Polywise mainly needs:

- one available model provider
- embedding and rerank models if you want saved-content retrieval

You do not need to configure every provider or integration on day one.

## ⬆️ Upgrade

### CLI

```bash
polywise upgrade
```

### Desktop App

Install the latest release from [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Quick Start

If you want the shortest path to first value:

1. Open `Settings -> Model Provider` and configure one provider you can actually use.
2. Open `Settings -> Model Setting` and make sure the default chat model is available.
3. Go to `Session` and ask one real question instead of sending `hello`.
4. Save one short note, page summary, or answer into Polywise.
5. Mention that saved item again in chat to verify retrieval.

## 🧭 Usage

Once one provider is connected and the default model is set, stop configuring and go use the product.

### Desktop App

The app becomes easiest to understand when you use each area for one concrete job:

- `Session` for asking real questions, planning work, and staying inside your workspace context
- `Linkcase` for fetching and extracting web content into the system
- `Agent` for turning repeated instruction styles into reusable collaborators
- `Posts` for saving knowledge that should live longer than a chat reply

Two shortcuts are worth learning early:

- `@` brings files, agents, and other context into a session
- `/` brings tools and skills into the workflow

### CLI

The CLI is a thin wrapper over the backend API. By default it talks to `http://localhost:3072`; set `POLYWISE_SERVER_URL` if your server lives elsewhere.

Start with help instead of memorizing commands:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Use `input_schema` when you need the exact input shape for a command:

```bash
polywise input_schema session.create
```

Common commands:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

When payloads become more complex, pass JSON directly:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Docs

- [Intro](https://polywise.io/docs/intro)
- [CLI README](packages/polywise/README.md)

## 💭 Motivation

Polywise is built upon the belief that **truly intelligent AI requires truly intelligent memory**. It is not merely about storage, but rather a system capable of organically forming connections, strengthening through use, strategically forgetting, and continuously evolving.

## 📄 References

This project was inspired by the following research papers:

- [Long-lasting potentiation of synaptic transmission (1973)](<.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Acknowledgments

Polywise stands on the shoulders of these excellent open-source projects:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - The most widely deployed high-performance embedded database in the world
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Adds vector search support to Sqlite
- ⚛️ **[React](https://react.dev/)** - Front-end UI library
- 🖥️ **[Electron](https://www.electronjs.org/)** - Desktop application framework
- 🔗 **[tRPC](https://trpc.io/)** - End-to-end typesafe APIs
- 📦 **[MobX](https://mobx.js.org/)** - Simple, scalable state management
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- 🚀 **[Hono](https://hono.dev/)** - Ultra-fast Web framework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Next-generation build tool powered by Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Library build tool powered by Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Unified toolkit for building AI-powered applications
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js bindings for llama-cpp, designed for interfacing with local models.

## 📜 License

MIT – See [LICENSE](LICENSE) for details.
