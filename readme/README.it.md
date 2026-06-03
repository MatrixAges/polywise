# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Il sistema open source di contenuti agentici</strong></p>

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
  <img alt="In modalità chiara si vede un sole illustrato, in modalità scura una luna con le stelle." src="../images/landing_light.png">
</picture>

## Cos'è Polywise

Polywise è un sistema open source di contenuti agentici. Puoi usarlo da riga di comando oppure dall'app desktop per parlare con i modelli, salvare conoscenza, recuperare contesto e trasformare i modi di lavorare ripetuti in agenti riutilizzabili.

## 🚀 Installazione

Polywise ha due punti di ingresso davvero pratici: la CLI e l'app desktop.

### CLI

Installa la CLI globalmente:

```bash
npm install -g polywise
```

Avvia il servizio locale di Polywise:

```bash
polywise start
polywise start -d
```

`polywise start` mantiene il servizio in primo piano. `polywise start -d` termina subito e lascia il servizio attivo in background.

Poi apri la Web UI su http://localhost:3072/app/ .

Dalle impostazioni puoi attivare l'accesso con Auth. Una volta attivato e impostata una password, dovrai effettuare il login per accedere alla Web UI e anche l'API sarà protetta. È fondamentale se pensi di distribuire Polywise su un server per l'accesso remoto.

### App desktop

Scarica la build desktop più recente da [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Se vuoi esplorare sessioni, contenuti salvati, agenti e post senza stare sempre nel terminale, l'app desktop è il modo più semplice.

### Primo avvio

Per il primo utilizzo, a Polywise serve soprattutto:

- un provider di modelli disponibile
- modelli di embedding e rerank se vuoi recuperare i contenuti salvati

Non è necessario configurare tutti i provider e tutte le integrazioni il primo giorno.

## ⬆️ Aggiornamento

### CLI

```bash
polywise upgrade
```

### App desktop

Installa l'ultima release da [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Avvio rapido

Se vuoi arrivare al primo risultato utile nel modo più diretto:

1. Apri `Settings -> Model Provider` e configura un provider che puoi davvero usare subito.
2. Apri `Settings -> Model Setting` e verifica che il modello chat predefinito sia disponibile.
3. Vai in `Session` e fai una domanda vera invece di mandare soltanto `hello`.
4. Salva in Polywise una breve nota, un riassunto di pagina oppure una risposta.
5. Cita di nuovo quell'elemento salvato nella chat per verificare che il recupero funzioni.

## 🧭 Utilizzo

Quando hai collegato un provider e impostato il modello predefinito, smetti di configurare e inizia davvero a usare il prodotto.

### App desktop

L'app si capisce molto meglio se assegni a ogni area un compito concreto:

- `Session` per fare domande vere, pianificare il lavoro e restare nel contesto del tuo workspace
- `Linkcase` per recuperare contenuti dal web e portarli nel sistema
- `Agent` per trasformare stili di istruzioni ripetuti in collaboratori riutilizzabili
- `Posts` per salvare conoscenza che merita di vivere più a lungo di una risposta in chat

Ci sono due scorciatoie che conviene imparare presto:

- `@` porta file, agenti e altro contesto dentro una sessione
- `/` porta strumenti e skill nel flusso di lavoro

### CLI

La CLI è un wrapper leggero sopra l'API backend. Per impostazione predefinita parla con `http://localhost:3072`; se il tuo server si trova altrove, imposta `POLYWISE_SERVER_URL`.

Invece di imparare i comandi a memoria, parti dalla guida:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Usa `input_schema` quando ti serve la struttura esatta di input di un comando:

```bash
polywise input_schema session.create
```

Comandi comuni:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Quando i payload diventano più complessi, puoi passare direttamente JSON:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Documentazione

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Motivazione

Polywise nasce dalla convinzione che **un'IA davvero intelligente abbia bisogno di una memoria davvero intelligente**. Non si tratta solo di archiviare cose, ma di costruire un sistema capace di creare connessioni in modo organico, rafforzarsi con l'uso, dimenticare in modo strategico ed evolvere nel tempo.

## 📄 Riferimenti

Questo progetto è stato ispirato dai seguenti articoli di ricerca:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Ringraziamenti

Polywise si appoggia a questi eccellenti progetti open source:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Il database embedded ad alte prestazioni più distribuito al mondo
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Aggiunge la ricerca vettoriale a Sqlite
- ⚛️ **[React](https://react.dev/)** - Libreria UI frontend
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework per applicazioni desktop
- 🔗 **[tRPC](https://trpc.io/)** - API type-safe end-to-end
- 📦 **[MobX](https://mobx.js.org/)** - Gestione dello stato semplice e scalabile
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- 🚀 **[Hono](https://hono.dev/)** - Framework web ultrarapido
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Strumento di build di nuova generazione basato su Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Strumento per build di librerie basato su Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Toolkit unificato per creare applicazioni basate sull'IA
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Binding Node.js per llama-cpp pensati per collegarsi a modelli locali

## 📜 Licenza

MIT – Vedi [LICENSE](LICENSE) per i dettagli.
