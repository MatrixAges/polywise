# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>O sistema open source de conteúdo agentic</strong></p>

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
  <img alt="No modo claro aparece uma ilustração de sol; no modo escuro, a lua com estrelas." src="../images/landing_light.png">
</picture>

## O que é o Polywise

Polywise é um sistema open source de conteúdo agentic. Você pode usar pela linha de comando ou pelo app desktop para conversar com modelos, salvar conhecimento, recuperar contexto e transformar jeitos de trabalhar que se repetem em agentes reutilizáveis.

## 🚀 Instalação

O Polywise tem dois pontos de entrada bem práticos: a CLI e o app desktop.

### CLI

Instale a CLI globalmente:

```bash
npm install -g polywise
```

Inicie o serviço local do Polywise:

```bash
polywise start
polywise start -d
```

`polywise start` mantém o serviço em primeiro plano. `polywise start -d` encerra o comando na hora e deixa o serviço rodando em segundo plano.

Depois, abra a Web UI em http://localhost:3072/app/ .

Você pode ativar login com Auth nas configurações. Depois de habilitar e definir uma senha, será preciso fazer login para acessar a Web UI, e a API também ficará protegida. Isso é essencial se você pretende rodar o Polywise em um servidor com acesso remoto.

### App desktop

Baixe a versão mais recente em [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Se você quiser explorar sessões, conteúdo salvo, agentes e posts sem depender do terminal o tempo todo, o app desktop é o caminho mais simples.

### Primeiro uso

Na primeira vez, o Polywise precisa basicamente de:

- um provider de modelos disponível
- modelos de embedding e rerank, caso você queira recuperar conteúdo salvo

Não é preciso configurar todos os providers e integrations logo no primeiro dia.

## ⬆️ Atualização

### CLI

```bash
polywise upgrade
```

### App desktop

Instale a versão mais recente em [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Início rápido

Se você quer chegar ao primeiro resultado útil pelo caminho mais curto:

1. Abra `Settings -> Model Provider` e configure um provider que você realmente consiga usar agora.
2. Abra `Settings -> Model Setting` e confira se o modelo de chat padrão está disponível.
3. Vá para `Session` e faça uma pergunta de verdade em vez de mandar só `hello`.
4. Salve no Polywise uma nota curta, um resumo de página ou uma resposta.
5. Mencione esse item salvo novamente no chat para verificar se a recuperação está funcionando.

## 🧭 Uso

Quando um provider já estiver conectado e o modelo padrão estiver definido, pare de mexer tanto em configuração e vá usar o produto.

### App desktop

O app fica muito mais fácil de entender quando cada área tem um papel concreto:

- `Session` para fazer perguntas reais, planejar trabalho e continuar dentro do contexto do seu workspace
- `Linkcase` para trazer conteúdo da web e extrair isso para dentro do sistema
- `Agent` para transformar estilos de instrução repetidos em colaboradores reutilizáveis
- `Posts` para guardar conhecimento que merece durar mais do que uma resposta de chat

Vale aprender dois atalhos logo cedo:

- `@` traz arquivos, agentes e outros contextos para dentro de uma sessão
- `/` coloca ferramentas e skills dentro do fluxo de trabalho

### CLI

A CLI é uma camada fina sobre a API de backend. Por padrão, ela conversa com `http://localhost:3072`; se o seu servidor estiver em outro lugar, defina `POLYWISE_SERVER_URL`.

Em vez de decorar comandos, comece pela ajuda:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Use `input_schema` quando precisar da estrutura exata de entrada de um comando:

```bash
polywise input_schema session.create
```

Comandos comuns:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Quando os payloads ficarem mais complexos, você pode passar JSON diretamente:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Documentação

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Motivação

O Polywise foi construído em cima de uma ideia simples: **uma IA realmente inteligente precisa de uma memória realmente inteligente**. Não se trata só de armazenar coisas, mas de criar um sistema capaz de formar conexões de maneira orgânica, ficar mais forte com o uso, esquecer com estratégia e continuar evoluindo.

## 📄 Referências

Este projeto foi inspirado pelos seguintes artigos de pesquisa:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Agradecimentos

O Polywise se apoia nestes excelentes projetos open source:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - O banco de dados embarcado de alta performance mais implantado no mundo
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Adiciona busca vetorial ao Sqlite
- ⚛️ **[React](https://react.dev/)** - Biblioteca de UI para frontend
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework para aplicativos desktop
- 🔗 **[tRPC](https://trpc.io/)** - APIs type-safe de ponta a ponta
- 📦 **[MobX](https://mobx.js.org/)** - Gerenciamento de estado simples e escalável
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- 🚀 **[Hono](https://hono.dev/)** - Framework web ultrarrápido
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Ferramenta de build de nova geração baseada em Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Ferramenta para build de bibliotecas baseada em Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Toolkit unificado para criar aplicações com IA
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Bindings de Node.js para llama-cpp, pensados para trabalhar com modelos locais

## 📜 Licença

MIT – Veja [LICENSE](LICENSE) para mais detalhes.
