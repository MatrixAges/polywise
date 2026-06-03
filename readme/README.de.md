# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Das Open-Source-System für agentische Inhalte</strong></p>

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
  <img alt="Im hellen Modus ist eine Sonne zu sehen, im dunklen Modus ein Mond mit Sternen." src="../images/landing_light.png">
</picture>

## Was ist Polywise?

Polywise ist ein Open-Source-System für agentische Inhalte. Du kannst es in der Kommandozeile oder als Desktop-App nutzen, um mit Modellen zu arbeiten, Wissen zu speichern, Kontext wiederzufinden und wiederkehrende Arbeitsweisen in wiederverwendbare Agents zu verwandeln.

## 🚀 Installation

Für den Einstieg in Polywise gibt es zwei praktische Wege: die CLI und die Desktop-App.

### CLI

Installiere die CLI global:

```bash
npm install -g polywise
```

Starte danach den lokalen Polywise-Dienst:

```bash
polywise start
polywise start -d
```

`polywise start` lässt den Dienst im Vordergrund laufen. `polywise start -d` beendet den Befehl sofort und lässt den Dienst im Hintergrund weiterlaufen.

Öffne anschließend die Web-Oberfläche unter http://localhost:3072/app/ .

In den Einstellungen kannst du Auth-Login aktivieren. Sobald das eingeschaltet ist und ein Passwort gesetzt wurde, musst du dich beim Zugriff auf die Web UI anmelden, und auch die API ist geschützt. Das ist besonders wichtig, wenn du Polywise auf einem Server für den Fernzugriff bereitstellst.

### Desktop-App

Die neueste Desktop-Version findest du unter [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Wenn du Sessions, gespeicherte Inhalte, Agents und Posts lieber ohne Terminal durchstöberst, ist die Desktop-App der einfachste Einstieg.

### Erster Start

Für den ersten Start brauchst du im Grunde nur:

- einen verfügbaren Modellanbieter
- Embedding- und Rerank-Modelle, falls du gespeicherte Inhalte durchsuchen möchtest

Du musst nicht am ersten Tag jeden Provider und jede Integration einrichten.

## ⬆️ Upgrade

### CLI

```bash
polywise upgrade
```

### Desktop-App

Installiere einfach die neueste Version aus den [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Schnellstart

Wenn du möglichst schnell zum ersten echten Nutzen kommen willst:

1. Öffne `Settings -> Model Provider` und richte einen Provider ein, den du wirklich verwenden kannst.
2. Öffne `Settings -> Model Setting` und prüfe, ob das Standard-Chatmodell verfügbar ist.
3. Geh zu `Session` und stelle eine echte Frage statt nur `hello` zu schicken.
4. Speichere eine kurze Notiz, eine Seitenzusammenfassung oder eine Antwort in Polywise.
5. Erwähne diesen gespeicherten Eintrag später noch einmal im Chat, um die Wiederauffindung zu testen.

## 🧭 Nutzung

Sobald ein Provider verbunden ist und das Standardmodell steht, hör auf weiter zu konfigurieren und benutze das Produkt einfach.

### Desktop-App

Am leichtesten wird die App verständlich, wenn jeder Bereich eine klare Aufgabe bekommt:

- `Session` für echte Fragen, Arbeitsplanung und Arbeit im Kontext deines Workspaces
- `Linkcase` zum Einsammeln und Extrahieren von Web-Inhalten ins System
- `Agent` um wiederkehrende Anweisungsstile in wiederverwendbare Mitstreiter zu verwandeln
- `Posts` für Wissen, das länger leben soll als eine einzelne Chat-Antwort

Zwei Kürzel lohnen sich besonders früh:

- `@` bringt Dateien, Agents und weiteren Kontext in eine Session
- `/` bringt Tools und Skills in deinen Workflow

### CLI

Die CLI ist ein schlanker Wrapper um die Backend-API. Standardmäßig spricht sie mit `http://localhost:3072`; falls dein Server woanders läuft, setze `POLYWISE_SERVER_URL`.

Statt Befehle auswendig zu lernen, starte besser mit der Hilfe:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Wenn du die exakte Eingabestruktur eines Befehls brauchst, nutze `input_schema`:

```bash
polywise input_schema session.create
```

Häufig genutzte Befehle:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Wenn die Payloads komplexer werden, kannst du JSON direkt übergeben:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Dokumentation

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Motivation

Polywise basiert auf der Überzeugung, dass **wirklich intelligente KI auch wirklich intelligentes Gedächtnis braucht**. Es geht nicht bloß ums Speichern, sondern um ein System, das Verbindungen organisch aufbaut, durch Nutzung stärker wird, strategisch vergisst und sich laufend weiterentwickelt.

## 📄 Referenzen

Dieses Projekt wurde von den folgenden Forschungsarbeiten inspiriert:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Danksagung

Polywise steht auf den Schultern dieser großartigen Open-Source-Projekte:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Die weltweit am weitesten verbreitete eingebettete Hochleistungsdatenbank
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Fügt Sqlite Unterstützung für Vektorsuche hinzu
- ⚛️ **[React](https://react.dev/)** - Frontend-UI-Bibliothek
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework für Desktop-Anwendungen
- 🔗 **[tRPC](https://trpc.io/)** - End-to-End typsichere APIs
- 📦 **[MobX](https://mobx.js.org/)** - Einfache, skalierbare Zustandsverwaltung
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-First-CSS-Framework
- 🚀 **[Hono](https://hono.dev/)** - Ultraschnelles Web-Framework
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Build-Tool der nächsten Generation auf Basis von Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Bibliotheks-Build-Tool auf Basis von Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Einheitliches Toolkit zum Bauen von KI-Anwendungen
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js-Bindings für llama-cpp zur Anbindung lokaler Modelle

## 📜 Lizenz

MIT – Details findest du in [LICENSE](LICENSE).
