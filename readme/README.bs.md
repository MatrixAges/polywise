# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Open source agentni sistem za sadržaj</strong></p>

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
  <img alt="U svijetlom modu prikazano je sunce, a u tamnom mjesec i zvijezde." src="../images/landing_light.png">
</picture>

## Šta je Polywise

Polywise je open source agentni sistem za sadržaj. Možete ga koristiti iz komandne linije ili kroz desktop aplikaciju da razgovarate s modelima, sačuvate znanje, vratite potreban kontekst i pretvorite ponavljajuće načine rada u agente koje možete ponovo koristiti.

## 🚀 Instalacija

Polywise ima dvije praktične ulazne tačke: CLI i desktop aplikaciju.

### CLI

Instalirajte CLI globalno:

```bash
npm install -g polywise
```

Pokrenite lokalni Polywise servis:

```bash
polywise start
polywise start -d
```

`polywise start` drži servis u prvom planu. `polywise start -d` odmah završava komandu i ostavlja servis da radi u pozadini.

Zatim otvorite web interfejs na http://localhost:3072/app/ .

U postavkama možete uključiti Auth prijavu. Kada je aktivna i postavljena lozinka, prijava će biti obavezna za pristup Web UI-u, a API će također biti zaštićen. To je posebno važno ako Polywise postavljate na server za udaljeni pristup.

### Desktop aplikacija

Najnoviju desktop verziju preuzmite sa [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Ako želite lakše pregledati sesije, sačuvani sadržaj, agente i postove bez stalnog rada u terminalu, desktop aplikacija je najjednostavniji put.

### Prvo pokretanje

Za prvi start Polywise uglavnom treba:

- jedan dostupan provider modela
- embedding i rerank modeli ako želite pretragu po sačuvanom sadržaju

Ne morate prvog dana podesiti svaki provider i svaku integraciju.

## ⬆️ Nadogradnja

### CLI

```bash
polywise upgrade
```

### Desktop aplikacija

Instalirajte najnovije izdanje sa [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Brzi početak

Ako želite najkraći put do prve stvarne koristi:

1. Otvorite `Settings -> Model Provider` i podesite jednog providera kojeg zaista možete koristiti.
2. Otvorite `Settings -> Model Setting` i provjerite da li je zadani chat model dostupan.
3. Idite u `Session` i postavite pravo pitanje umjesto da pošaljete samo `hello`.
4. Sačuvajte kratku bilješku, sažetak stranice ili odgovor u Polywise.
5. Ponovo spomenite tu sačuvanu stavku u chatu da provjerite radi li dohvat sadržaja.

## 🧭 Korištenje

Kada povežete jednog providera i postavite zadani model, prestanite se vrtjeti po postavkama i počnite koristiti proizvod.

### Desktop aplikacija

Najlakše ćete razumjeti aplikaciju ako svako područje ima jedan konkretan posao:

- `Session` za stvarna pitanja, planiranje rada i ostajanje u kontekstu vašeg workspacea
- `Linkcase` za preuzimanje i izvlačenje web sadržaja u sistem
- `Agent` za pretvaranje ponavljajućih stilova instrukcija u saradnike koje možete ponovo koristiti
- `Posts` za znanje koje treba trajati duže od jednog chat odgovora

Dvije prečice vrijedi naučiti rano:

- `@` ubacuje fajlove, agente i drugi kontekst u sesiju
- `/` ubacuje alate i skillove u workflow

### CLI

CLI je tanak sloj preko backend API-ja. Podrazumijevano koristi `http://localhost:3072`; ako je vaš server negdje drugo, postavite `POLYWISE_SERVER_URL`.

Umjesto memorisanja komandi, krenite od pomoći:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Koristite `input_schema` kada vam treba tačan oblik ulaza za komandu:

```bash
polywise input_schema session.create
```

Česte komande:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Kada payload postane složeniji, JSON možete proslijediti direktno:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Dokumentacija

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Motivacija

Polywise je izgrađen na uvjerenju da **zaista inteligentnoj AI treba zaista inteligentna memorija**. Ne radi se samo o čuvanju podataka, nego o sistemu koji prirodno gradi veze, jača kroz upotrebu, strateški zaboravlja i stalno se razvija.

## 📄 Reference

Ovaj projekat inspirisan je sljedećim naučnim radovima:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Zahvale

Polywise stoji na ramenima ovih odličnih open source projekata:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Najrasprostranjenija visokoperformansna ugrađena baza podataka na svijetu
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Dodaje vektorsku pretragu u Sqlite
- ⚛️ **[React](https://react.dev/)** - Frontend UI biblioteka
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework za desktop aplikacije
- 🔗 **[tRPC](https://trpc.io/)** - End-to-end type-safe API-ji
- 📦 **[MobX](https://mobx.js.org/)** - Jednostavno i skalabilno upravljanje stanjem
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- 🚀 **[Hono](https://hono.dev/)** - Ultra-brzi web framework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Build alat nove generacije pokretan Rspackom
- 📚 **[Rslib](https://rslib.dev/)** - Alat za build biblioteka zasnovan na Rsbuildu
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Jedinstveni toolkit za izgradnju AI aplikacija
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js bindings za llama-cpp, namijenjen povezivanju s lokalnim modelima

## 📜 Licenca

MIT – Pogledajte [LICENSE](LICENSE) za detalje.
