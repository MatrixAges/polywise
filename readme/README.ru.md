# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Открытая агентная система для работы с контентом</strong></p>

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
  <img alt="В светлой теме показано солнце, а в тёмной — луна и звёзды." src="../images/landing_light.png">
</picture>

## Что такое Polywise

Polywise — это открытая агентная система для работы с контентом. Её можно использовать из командной строки или через десктопное приложение, чтобы общаться с моделями, сохранять знания, возвращать нужный контекст и превращать повторяющиеся способы работы в переиспользуемых агентов.

## 🚀 Установка

У Polywise есть две самые удобные точки входа: CLI и десктопное приложение.

### CLI

Установите CLI глобально:

```bash
npm install -g polywise
```

Запустите локальный сервис Polywise:

```bash
polywise start
polywise start -d
```

`polywise start` держит сервис в переднем плане. `polywise start -d` сразу завершается, а сервис продолжает работать в фоне.

После этого откройте Web UI по адресу http://localhost:3072/app/ .

В настройках можно включить вход через Auth. Когда он включён и задан пароль, для доступа к Web UI потребуется авторизация, и API тоже будет защищён. Это особенно важно, если вы разворачиваете Polywise как сервис на сервере для удалённого доступа.

### Десктопное приложение

Скачайте последнюю сборку из [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Если вы хотите удобно просматривать сессии, сохранённый контент, агентов и посты без постоянной работы в терминале, десктопное приложение — самый простой вариант.

### Первый запуск

Для первого запуска Polywise в основном нужны:

- один доступный провайдер моделей
- модели embedding и rerank, если вы хотите искать по сохранённому контенту

Необязательно настраивать всех providers и integrations в первый же день.

## ⬆️ Обновление

### CLI

```bash
polywise upgrade
```

### Десктопное приложение

Установите последнюю версию из [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Быстрый старт

Если хотите получить первую реальную пользу как можно быстрее:

1. Откройте `Settings -> Model Provider` и настройте одного provider, которым вы реально можете пользоваться.
2. Откройте `Settings -> Model Setting` и убедитесь, что модель чата по умолчанию доступна.
3. Перейдите в `Session` и задайте настоящий вопрос вместо того, чтобы отправлять `hello`.
4. Сохраните в Polywise короткую заметку, краткое содержание страницы или ответ.
5. Снова упомяните этот сохранённый элемент в чате, чтобы проверить, что поиск по памяти работает.

## 🧭 Использование

Когда один provider уже подключён и модель по умолчанию настроена, перестаньте бесконечно крутить настройки и просто начните пользоваться продуктом.

### Десктопное приложение

Приложение проще всего понять, если у каждой зоны есть одна конкретная задача:

- `Session` для реальных вопросов, планирования работы и сохранения рабочего контекста
- `Linkcase` для загрузки веб-контента и переноса его в систему
- `Agent` для превращения повторяющихся стилей инструкций в переиспользуемых помощников
- `Posts` для знаний, которым нужно жить дольше, чем один ответ в чате

Два сочетания стоит освоить пораньше:

- `@` подтягивает в сессию файлы, агентов и другой контекст
- `/` добавляет в рабочий процесс инструменты и skills

### CLI

CLI — это тонкая оболочка над backend API. По умолчанию она работает с `http://localhost:3072`; если ваш сервер находится в другом месте, задайте `POLYWISE_SERVER_URL`.

Вместо того чтобы запоминать команды, лучше начать со справки:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Используйте `input_schema`, когда нужна точная структура входных данных для команды:

```bash
polywise input_schema session.create
```

Часто используемые команды:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Когда payload становится сложнее, можно передавать JSON напрямую:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Документация

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Зачем нужен Polywise

Polywise строится на простой идее: **по-настоящему умному ИИ нужна по-настоящему умная память**. Речь не просто о хранении данных, а о системе, которая естественно выстраивает связи, становится сильнее по мере использования, умеет стратегически забывать и постоянно развивается.

## 📄 Материалы

Этот проект вдохновлён следующими исследовательскими работами:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Благодарности

Polywise опирается на эти отличные open source-проекты:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Самая широко развёрнутая высокопроизводительная встроенная база данных в мире
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Добавляет векторный поиск в Sqlite
- ⚛️ **[React](https://react.dev/)** - Библиотека UI для фронтенда
- 🖥️ **[Electron](https://www.electronjs.org/)** - Фреймворк для десктопных приложений
- 🔗 **[tRPC](https://trpc.io/)** - Типобезопасные API end-to-end
- 📦 **[MobX](https://mobx.js.org/)** - Простое и масштабируемое управление состоянием
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS-фреймворк
- 🚀 **[Hono](https://hono.dev/)** - Очень быстрый веб-фреймворк
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Сборочный инструмент нового поколения на базе Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Инструмент для сборки библиотек на базе Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Единый набор инструментов для создания AI-приложений
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js bindings для llama-cpp, рассчитанные на работу с локальными моделями

## 📜 Лицензия

MIT — подробности в [LICENSE](LICENSE).
