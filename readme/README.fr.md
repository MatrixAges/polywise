# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Le système de contenu agentique open source</strong></p>

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
  <img alt="En mode clair, on voit un soleil illustré ; en mode sombre, une lune avec des étoiles." src="../images/landing_light.png">
</picture>

## Qu'est-ce que Polywise ?

Polywise est un système de contenu agentique open source. Vous pouvez l'utiliser en ligne de commande ou via l'application desktop pour discuter avec des modèles, conserver des connaissances, retrouver du contexte et transformer des façons de travailler répétitives en agents réutilisables.

## 🚀 Installation

Polywise a deux points d'entrée vraiment pratiques : la CLI et l'application desktop.

### CLI

Installez la CLI globalement :

```bash
npm install -g polywise
```

Lancez ensuite le service local Polywise :

```bash
polywise start
polywise start -d
```

`polywise start` garde le service au premier plan. `polywise start -d` quitte tout de suite et laisse le service tourner en arrière-plan.

Ouvrez ensuite l'interface web à l'adresse http://localhost:3072/app/ .

Vous pouvez activer l'authentification dans les réglages. Une fois activée et un mot de passe défini, il faudra vous connecter pour accéder à la Web UI, et l'API sera protégée elle aussi. C'est particulièrement important si vous déployez Polywise sur un serveur pour y accéder à distance.

### Application desktop

Téléchargez la dernière version depuis [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Si vous voulez parcourir les sessions, les contenus sauvegardés, les agents et les posts sans rester dans le terminal, l'application desktop est le chemin le plus simple.

### Premier lancement

Pour un premier démarrage, Polywise a surtout besoin de :

- un fournisseur de modèles disponible
- des modèles d'embedding et de rerank si vous voulez retrouver du contenu sauvegardé

Vous n'avez pas besoin de configurer tous les providers et toutes les integrations dès le premier jour.

## ⬆️ Mise à jour

### CLI

```bash
polywise upgrade
```

### Application desktop

Installez la dernière version depuis [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Démarrage rapide

Si vous voulez atteindre la première vraie valeur le plus vite possible :

1. Ouvrez `Settings -> Model Provider` et configurez un provider que vous pouvez réellement utiliser.
2. Ouvrez `Settings -> Model Setting` et vérifiez que le modèle de chat par défaut est disponible.
3. Allez dans `Session` et posez une vraie question au lieu d'envoyer juste `hello`.
4. Enregistrez dans Polywise une note courte, un résumé de page ou une réponse.
5. Mentionnez ensuite cet élément sauvegardé dans le chat pour vérifier que la récupération fonctionne.

## 🧭 Utilisation

Une fois qu'un provider est connecté et que le modèle par défaut est prêt, arrêtez de tout configurer et servez-vous du produit.

### Application desktop

L'application devient beaucoup plus simple à comprendre si chaque zone a un rôle concret :

- `Session` pour poser de vraies questions, organiser le travail et rester dans le contexte de votre workspace
- `Linkcase` pour récupérer du contenu web et l'injecter dans le système
- `Agent` pour transformer des styles d'instructions répétés en collaborateurs réutilisables
- `Posts` pour garder des connaissances qui méritent de vivre plus longtemps qu'une simple réponse de chat

Deux raccourcis valent la peine d'être appris tôt :

- `@` fait entrer des fichiers, des agents et d'autres éléments de contexte dans une session
- `/` fait entrer des outils et des skills dans le workflow

### CLI

La CLI est une fine couche au-dessus de l'API backend. Par défaut, elle parle à `http://localhost:3072` ; si votre serveur se trouve ailleurs, définissez `POLYWISE_SERVER_URL`.

Plutôt que d'apprendre les commandes par cœur, commencez par l'aide :

```bash
polywise -h
polywise session -h
polywise session create -h
```

Utilisez `input_schema` quand vous avez besoin de la structure exacte d'entrée d'une commande :

```bash
polywise input_schema session.create
```

Commandes courantes :

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Quand les payloads deviennent plus complexes, vous pouvez passer du JSON directement :

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Documentation

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Motivation

Polywise repose sur une conviction simple : **une IA vraiment intelligente a besoin d'une mémoire vraiment intelligente**. Il ne s'agit pas seulement de stocker des données, mais de bâtir un système capable de créer des liens naturellement, de se renforcer à l'usage, d'oublier de manière stratégique et d'évoluer en continu.

## 📄 Références

Ce projet a été inspiré par les articles de recherche suivants :

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Remerciements

Polywise s'appuie sur ces excellents projets open source :

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - La base de données embarquée haute performance la plus largement déployée au monde
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Ajoute la recherche vectorielle à Sqlite
- ⚛️ **[React](https://react.dev/)** - Bibliothèque d'interface utilisateur front-end
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework d'application desktop
- 🔗 **[tRPC](https://trpc.io/)** - API type-safe de bout en bout
- 📦 **[MobX](https://mobx.js.org/)** - Gestion d'état simple et évolutive
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- 🚀 **[Hono](https://hono.dev/)** - Framework web ultra-rapide
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Outil de build nouvelle génération propulsé par Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Outil de build de bibliothèques basé sur Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Boîte à outils unifiée pour créer des applications dopées à l'IA
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Bindings Node.js pour llama-cpp, pensés pour se connecter à des modèles locaux

## 📜 Licence

MIT – Voir [LICENSE](LICENSE) pour les détails.
