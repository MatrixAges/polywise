# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Det open source agentiske indholdssystem</strong></p>

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
  <img alt="I lyst tema vises en solillustration, og i mørkt tema en måne med stjerner." src="../images/landing_light.png">
</picture>

## Hvad er Polywise?

Polywise er et open source agentisk indholdssystem. Du kan bruge det fra kommandolinjen eller desktop-appen til at chatte med modeller, gemme viden, hente kontekst frem igen og gøre gentagne arbejdsformer til genbrugelige agenter.

## 🚀 Installation

Polywise har to praktiske indgange: CLI'en og desktop-appen.

### CLI

Installer CLI'en globalt:

```bash
npm install -g polywise
```

Start den lokale Polywise-tjeneste:

```bash
polywise start
polywise start -d
```

`polywise start` holder tjenesten kørende i forgrunden. `polywise start -d` afslutter med det samme og lader tjenesten køre videre i baggrunden.

Åbn derefter webgrænsefladen på http://localhost:3072/app/ .

Du kan slå Auth-login til i indstillingerne. Når det er aktiveret og der er sat en adgangskode, skal du logge ind for at få adgang til Web UI'et, og API'et bliver også beskyttet. Det er vigtigt, hvis du vil køre Polywise på en server med fjernadgang.

### Desktop-app

Download den nyeste desktop-build fra [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Hvis du vil udforske sessions, gemt indhold, agenter og posts uden hele tiden at arbejde i terminalen, er desktop-appen den nemmeste vej ind.

### Første opstart

Ved første opstart har Polywise mest af alt brug for:

- én tilgængelig modeludbyder
- embedding- og rerank-modeller, hvis du vil søge i gemt indhold

Du behøver ikke konfigurere alle providers og integrations på dag ét.

## ⬆️ Opgradering

### CLI

```bash
polywise upgrade
```

### Desktop-app

Installer den nyeste udgivelse fra [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Hurtig start

Hvis du vil hurtigst muligt frem til den første rigtige værdi:

1. Åbn `Settings -> Model Provider`, og sæt én provider op, som du rent faktisk kan bruge.
2. Åbn `Settings -> Model Setting`, og tjek at standard-chatmodellen er tilgængelig.
3. Gå til `Session`, og stil et rigtigt spørgsmål i stedet for bare at sende `hello`.
4. Gem en kort note, et side-resumé eller et svar i Polywise.
5. Nævn det gemte element igen i chatten for at bekræfte, at genfindingen virker.

## 🧭 Brug

Når én provider er forbundet, og standardmodellen er sat, så stop med at konfigurere og begynd at bruge produktet.

### Desktop-app

Appen er lettest at forstå, når hvert område har ét konkret job:

- `Session` til rigtige spørgsmål, arbejdsplanlægning og arbejde inde i din workspace-kontekst
- `Linkcase` til at hente og udtrække webindhold ind i systemet
- `Agent` til at gøre gentagne instruktionsstile til genbrugelige samarbejdspartnere
- `Posts` til viden, der skal leve længere end et chatsvar

To genveje er værd at lære tidligt:

- `@` trækker filer, agenter og anden kontekst ind i en session
- `/` trækker værktøjer og skills ind i workflowet

### CLI

CLI'en er et tyndt lag oven på backend-API'et. Som standard bruger den `http://localhost:3072`; hvis din server kører et andet sted, så sæt `POLYWISE_SERVER_URL`.

Start med hjælpeteksterne i stedet for at huske kommandoer udenad:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Brug `input_schema`, når du har brug for den præcise inputstruktur til en kommando:

```bash
polywise input_schema session.create
```

Almindelige kommandoer:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Når payloads bliver mere komplekse, kan du sende JSON direkte:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Dokumentation

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Motivation

Polywise bygger på troen på, at **virkelig intelligent AI kræver virkelig intelligent hukommelse**. Det handler ikke bare om at gemme data, men om et system, der kan danne forbindelser naturligt, blive stærkere gennem brug, glemme strategisk og udvikle sig løbende.

## 📄 Referencer

Dette projekt er inspireret af følgende forskningsartikler:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Tak

Polywise står på skuldrene af disse fremragende open source-projekter:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Verdens mest udbredte højtydende indlejrede database
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Tilføjer vektorsøgning til Sqlite
- ⚛️ **[React](https://react.dev/)** - Frontend-UI-bibliotek
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework til desktop-applikationer
- 🔗 **[tRPC](https://trpc.io/)** - End-to-end typesikre API'er
- 📦 **[MobX](https://mobx.js.org/)** - Enkel og skalerbar state management
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS-framework
- 🚀 **[Hono](https://hono.dev/)** - Ultrahurtigt webframework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Næste generations buildværktøj drevet af Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Biblioteks-buildværktøj drevet af Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Samlet værktøjskasse til AI-drevne applikationer
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js-bindings til llama-cpp, lavet til at arbejde med lokale modeller

## 📜 Licens

MIT – Se [LICENSE](LICENSE) for detaljer.
