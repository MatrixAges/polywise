# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Det åpne agentiske innholdssystemet</strong></p>

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
  <img alt="I lyst tema vises en solillustrasjon, og i mørkt tema vises månen med stjerner." src="../images/landing_light.png">
</picture>

## Hva er Polywise

Polywise er et åpent agentisk innholdssystem. Du kan bruke det fra kommandolinjen eller skrivebordsappen til å snakke med modeller, lagre kunnskap, hente fram kontekst og gjøre gjentatte arbeidsmåter om til agenter du kan bruke igjen og igjen.

## 🚀 Installasjon

Polywise har to praktiske innganger: CLI-en og skrivebordsappen.

### CLI

Installer CLI-en globalt:

```bash
npm install -g polywise
```

Start den lokale Polywise-tjenesten:

```bash
polywise start
polywise start -d
```

`polywise start` holder tjenesten i forgrunnen. `polywise start -d` avslutter kommandoen med én gang og lar tjenesten fortsette i bakgrunnen.

Åpne deretter webgrensesnittet på http://localhost:3072/app/ .

Du kan slå på Auth-innlogging i innstillingene. Når dette er aktivert og et passord er satt, må du logge inn for å få tilgang til Web UI, og API-et blir også beskyttet. Dette er spesielt viktig hvis du skal kjøre Polywise på en server for fjernbruk.

### Skrivebordsapp

Last ned den nyeste skrivebordsversjonen fra [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Hvis du vil utforske sesjoner, lagret innhold, agenter og innlegg uten å være bundet til terminalen, er skrivebordsappen den enkleste veien inn.

### Første oppstart

Ved første oppstart trenger Polywise først og fremst:

- én tilgjengelig modelltilbyder
- embedding- og rerank-modeller hvis du vil hente fram lagret innhold

Du trenger ikke å konfigurere alle providers og integrations den første dagen.

## ⬆️ Oppgradering

### CLI

```bash
polywise upgrade
```

### Skrivebordsapp

Installer den nyeste utgivelsen fra [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Kom raskt i gang

Hvis du vil nå den første reelle verdien så raskt som mulig:

1. Åpne `Settings -> Model Provider` og sett opp én provider du faktisk kan bruke.
2. Åpne `Settings -> Model Setting` og sjekk at standard chatmodell er tilgjengelig.
3. Gå til `Session` og still et ekte spørsmål i stedet for bare å sende `hello`.
4. Lagre et kort notat, et sidesammendrag eller et svar i Polywise.
5. Nevn dette lagrede elementet igjen i chatten for å bekrefte at gjenfinningen virker.

## 🧭 Bruk

Når én provider er koblet til og standardmodellen er satt opp, slutt å finjustere alt og bruk produktet.

### Skrivebordsapp

Appen blir enklest å forstå når hvert område har én konkret jobb:

- `Session` for ekte spørsmål, arbeidsplanlegging og arbeid innenfor konteksten til workspace-et ditt
- `Linkcase` for å hente og trekke ut nettinnhold inn i systemet
- `Agent` for å gjøre gjentatte instruksjonsstiler om til samarbeidspartnere du kan bruke igjen
- `Posts` for kunnskap som fortjener å leve lenger enn ett chatsvar

To snarveier er verdt å lære tidlig:

- `@` trekker inn filer, agenter og annen kontekst i en session
- `/` trekker verktøy og skills inn i arbeidsflyten

### CLI

CLI-en er et tynt lag over backend-API-et. Som standard bruker den `http://localhost:3072`; hvis serveren din ligger et annet sted, setter du `POLYWISE_SERVER_URL`.

I stedet for å pugge kommandoer er det bedre å starte med hjelpen:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Bruk `input_schema` når du trenger nøyaktig inputstruktur for en kommando:

```bash
polywise input_schema session.create
```

Vanlige kommandoer:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Når payloadene blir mer komplekse, kan du sende JSON direkte:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Dokumentasjon

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Motivasjon

Polywise er bygget på troen på at **virkelig intelligent AI trenger virkelig intelligent hukommelse**. Det handler ikke bare om lagring, men om et system som naturlig kan bygge forbindelser, bli sterkere gjennom bruk, glemme strategisk og fortsette å utvikle seg.

## 📄 Referanser

Dette prosjektet er inspirert av følgende forskningsartikler:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Takk

Polywise står på skuldrene til disse glimrende open source-prosjektene:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Verdens mest utbredte høyytelses innebygde database
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Legger til vektorsøk i Sqlite
- ⚛️ **[React](https://react.dev/)** - Frontend-UI-bibliotek
- 🖥️ **[Electron](https://www.electronjs.org/)** - Rammeverk for skrivebordsapplikasjoner
- 🔗 **[tRPC](https://trpc.io/)** - Ende-til-ende typesikre API-er
- 📦 **[MobX](https://mobx.js.org/)** - Enkel og skalerbar state management
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS-rammeverk
- 🚀 **[Hono](https://hono.dev/)** - Ultraraskt web-rammeverk
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Neste generasjons byggeverktøy drevet av Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Bibliotek-byggeverktøy drevet av Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Samlet verktøykasse for å bygge AI-drevne applikasjoner
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js-bindinger for llama-cpp, laget for å koble til lokale modeller

## 📜 Lisens

MIT – Se [LICENSE](LICENSE) for detaljer.
