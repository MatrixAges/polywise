# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>ওপেন সোর্স এজেন্টিক কনটেন্ট সিস্টেম</strong></p>

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
  <img alt="লাইট মোডে সূর্যের ইলাস্ট্রেশন দেখা যায়, ডার্ক মোডে দেখা যায় চাঁদ আর তারা।" src="../images/landing_light.png">
</picture>

## Polywise কী

Polywise হলো একটি ওপেন সোর্স এজেন্টিক কনটেন্ট সিস্টেম। কমান্ড লাইন বা ডেস্কটপ অ্যাপ থেকে এটি ব্যবহার করে আপনি মডেলের সঙ্গে কথা বলতে পারেন, জ্ঞান সংরক্ষণ করতে পারেন, কনটেক্সট আবার টেনে আনতে পারেন, আর বারবার ব্যবহৃত কাজের ধরনকে পুনর্ব্যবহারযোগ্য এজেন্টে বদলে নিতে পারেন।

## 🚀 ইনস্টল

Polywise শুরু করার জন্য সবচেয়ে ব্যবহারিক দুইটি পথ হলো CLI আর ডেস্কটপ অ্যাপ।

### CLI

CLI গ্লোবালি ইনস্টল করুন:

```bash
npm install -g polywise
```

লোকাল Polywise সার্ভিস চালু করুন:

```bash
polywise start
polywise start -d
```

`polywise start` সার্ভিসটিকে সামনে চালু রাখে। `polywise start -d` সঙ্গে সঙ্গে কমান্ড শেষ করে দেয়, কিন্তু সার্ভিস ব্যাকগ্রাউন্ডে চালু থাকে।

তারপর Web UI খুলুন: http://localhost:3072/app/ ।

Settings থেকে Auth login চালু করতে পারেন। এটি চালু করে পাসওয়ার্ড সেট করলে Web UI-তে ঢুকতে লগইন লাগবে, আর API-ও সুরক্ষিত হবে। Polywise-কে যদি রিমোট অ্যাক্সেসের জন্য সার্ভারে চালাতে চান, তাহলে এই সেটিং খুবই গুরুত্বপূর্ণ।

### ডেস্কটপ অ্যাপ

সর্বশেষ ডেস্কটপ বিল্ড [GitHub Releases](https://github.com/MatrixAges/polywise/releases) থেকে ডাউনলোড করুন।

Session, saved content, agents আর posts টার্মিনালে বসে না থেকে ঘুরে দেখতে চাইলে ডেস্কটপ অ্যাপই সবচেয়ে সহজ উপায়।

### প্রথমবার চালু করা

প্রথমবার ব্যবহার করতে গেলে Polywise-এর মূলত দরকার:

- অন্তত একটি ব্যবহারযোগ্য model provider
- saved content retrieval ব্যবহার করতে চাইলে embedding আর rerank model

প্রথম দিনেই সব provider বা integration সেট করতে হবে না।

## ⬆️ আপগ্রেড

### CLI

```bash
polywise upgrade
```

### ডেস্কটপ অ্যাপ

[GitHub Releases](https://github.com/MatrixAges/polywise/releases) থেকে সর্বশেষ রিলিজ ইনস্টল করুন।

## ⚡ দ্রুত শুরু

সবচেয়ে কম ধাপে প্রথম কাজের ফল দেখতে চাইলে:

1. `Settings -> Model Provider` খুলে এমন একটি provider সেট করুন যা আপনি এখনই সত্যি ব্যবহার করতে পারবেন।
2. `Settings -> Model Setting` খুলে দেখুন default chat model পাওয়া যাচ্ছে কি না।
3. `Session`-এ গিয়ে শুধু `hello` না পাঠিয়ে একটি বাস্তব প্রশ্ন করুন।
4. Polywise-এ একটি ছোট নোট, পেজ সামারি, বা উত্তর সেভ করুন।
5. পরে চ্যাটে ওই সেভ করা জিনিসটি আবার উল্লেখ করুন, যাতে বোঝা যায় retrieval কাজ করছে।

## 🧭 ব্যবহার

একটি provider যুক্ত হয়ে গেলে আর default model সেট হয়ে গেলে, শুধু settings নিয়ে পড়ে না থেকে প্রোডাক্টটা ব্যবহার শুরু করুন।

### ডেস্কটপ অ্যাপ

প্রতিটি অংশকে যদি একটি নির্দিষ্ট কাজের জন্য ব্যবহার করেন, তাহলে অ্যাপটা খুব দ্রুত বোঝা যায়:

- `Session` আসল প্রশ্ন করা, কাজ পরিকল্পনা করা, আর workspace-এর কনটেক্সটের ভেতর কাজ চালিয়ে যাওয়ার জন্য
- `Linkcase` ওয়েব কনটেন্ট এনে সিস্টেমে তোলার জন্য
- `Agent` বারবার ব্যবহৃত instruction style-কে পুনর্ব্যবহারযোগ্য সহযোগীতে বদলানোর জন্য
- `Posts` এমন জ্ঞান রাখার জন্য যা শুধু একটা chat reply-তে আটকে থাকা উচিত না

শুরুর দিকেই দুইটা শর্টকাট শিখে নেওয়া ভালো:

- `@` দিয়ে ফাইল, agent, আর অন্য কনটেক্সট session-এ আনা যায়
- `/` দিয়ে tool আর skill workflow-তে আনা যায়

### CLI

CLI হলো backend API-এর ওপর পাতলা একটা wrapper। ডিফল্টভাবে এটা `http://localhost:3072`-এ কথা বলে; আপনার সার্ভার যদি অন্য কোথাও থাকে, তাহলে `POLYWISE_SERVER_URL` সেট করুন।

কমান্ড মুখস্থ করার বদলে help দিয়েই শুরু করুন:

```bash
polywise -h
polywise session -h
polywise session create -h
```

কোনো কমান্ডের exact input shape দরকার হলে `input_schema` ব্যবহার করুন:

```bash
polywise input_schema session.create
```

সাধারণ কিছু কমান্ড:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Payload জটিল হয়ে গেলে সরাসরি JSON পাঠাতে পারেন:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 ডকুমেন্টেশন

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 কেন Polywise

Polywise তৈরি হয়েছে একটি সহজ বিশ্বাস থেকে: **সত্যিকারের বুদ্ধিমান AI-এর জন্য সত্যিকারের বুদ্ধিমান মেমরি দরকার**। বিষয়টা শুধু স্টোরেজ নয়; বরং এমন একটি সিস্টেম, যা স্বাভাবিকভাবে সংযোগ গড়ে তোলে, ব্যবহার বাড়লে শক্তিশালী হয়, প্রয়োজনমতো ভুলে যেতে পারে, আর সময়ের সঙ্গে সঙ্গে আরও ভালো হয়।

## 📄 রেফারেন্স

এই প্রজেক্ট নিচের গবেষণা প্রবন্ধগুলো থেকে অনুপ্রাণিত:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 কৃতজ্ঞতা

Polywise দাঁড়িয়ে আছে এই অসাধারণ ওপেন সোর্স প্রজেক্টগুলোর কাঁধে:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - বিশ্বের সবচেয়ে বেশি ব্যবহৃত উচ্চক্ষমতার embedded database
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Sqlite-এ vector search যোগ করে
- ⚛️ **[React](https://react.dev/)** - ফ্রন্টএন্ড UI লাইব্রেরি
- 🖥️ **[Electron](https://www.electronjs.org/)** - ডেস্কটপ অ্যাপ ফ্রেমওয়ার্ক
- 🔗 **[tRPC](https://trpc.io/)** - end-to-end type-safe API
- 📦 **[MobX](https://mobx.js.org/)** - সহজ আর scalable state management
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - utility-first CSS framework
- 🚀 **[Hono](https://hono.dev/)** - খুব দ্রুত web framework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Rspack-চালিত নতুন প্রজন্মের build tool
- 📚 **[Rslib](https://rslib.dev/)** - Rsbuild-ভিত্তিক library build tool
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - AI অ্যাপ বানানোর জন্য একীভূত toolkit
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – স্থানীয় মডেলের সঙ্গে কাজ করার জন্য llama-cpp-এর Node.js bindings

## 📜 লাইসেন্স

MIT – বিস্তারিত [LICENSE](LICENSE)-এ দেখুন।
