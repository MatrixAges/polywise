# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Відкрита агентна система для роботи з контентом</strong></p>

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
  <img alt="У світлій темі видно сонце, а в темній — місяць і зорі." src="../images/landing_light.png">
</picture>

## Що таке Polywise

Polywise — це відкрита агентна система для роботи з контентом. Нею можна користуватися з командного рядка або через десктопний застосунок, щоб спілкуватися з моделями, зберігати знання, повертати потрібний контекст і перетворювати повторювані способи роботи на агентів, яких зручно використовувати знову.

## 🚀 Встановлення

Для старту з Polywise є два найзручніші входи: CLI та десктопний застосунок.

### CLI

Встановіть CLI глобально:

```bash
npm install -g polywise
```

Запустіть локальний сервіс Polywise:

```bash
polywise start
polywise start -d
```

`polywise start` тримає сервіс у передньому плані. `polywise start -d` одразу завершує команду, а сервіс продовжує працювати у фоні.

Після цього відкрийте Web UI за адресою http://localhost:3072/app/ .

У налаштуваннях можна ввімкнути Auth-логін. Після активації й встановлення пароля для доступу до Web UI потрібно буде увійти в систему, а API також буде захищене. Це особливо важливо, якщо ви розгортаєте Polywise на сервері для віддаленого доступу.

### Десктопний застосунок

Останню збірку можна завантажити з [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Якщо ви хочете зручно переглядати сесії, збережений контент, агентів і дописи без постійної роботи в терміналі, десктопний застосунок буде найпростішим шляхом.

### Перший запуск

Для першого запуску Polywise переважно потрібні:

- один доступний провайдер моделей
- embedding- і rerank-моделі, якщо ви хочете працювати з пошуком по збереженому контенту

Не потрібно налаштовувати всіх providers та integrations у перший же день.

## ⬆️ Оновлення

### CLI

```bash
polywise upgrade
```

### Десктопний застосунок

Встановіть останній реліз із [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Швидкий старт

Якщо хочете якнайшвидше відчути першу реальну користь:

1. Відкрийте `Settings -> Model Provider` і налаштуйте одного provider, яким ви реально можете користуватися.
2. Відкрийте `Settings -> Model Setting` і переконайтеся, що модель чату за замовчуванням доступна.
3. Перейдіть у `Session` і поставте справжнє запитання замість того, щоб просто надсилати `hello`.
4. Збережіть у Polywise коротку нотатку, підсумок сторінки або відповідь.
5. Згадайте цей збережений елемент у чаті ще раз, щоб перевірити, що пошук по пам'яті працює.

## 🧭 Використання

Коли один provider уже підключений і модель за замовчуванням налаштована, перестаньте нескінченно крутити параметри й просто почніть користуватися продуктом.

### Десктопний застосунок

Застосунок найпростіше зрозуміти, якщо в кожної зони є одна чітка роль:

- `Session` для реальних запитань, планування роботи та збереження контексту вашого workspace
- `Linkcase` для завантаження й витягування вебконтенту в систему
- `Agent` для перетворення повторюваних стилів інструкцій на агентів, з якими зручно працювати знову і знову
- `Posts` для знань, які мають жити довше, ніж одна відповідь у чаті

Два скорочення варто вивчити раніше:

- `@` підтягує в сесію файли, агентів та інший контекст
- `/` додає у workflow інструменти й skills

### CLI

CLI — це тонка оболонка над backend API. За замовчуванням вона працює з `http://localhost:3072`; якщо ваш сервер знаходиться в іншому місці, задайте `POLYWISE_SERVER_URL`.

Замість того щоб вчити команди напам'ять, краще почати з довідки:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Використовуйте `input_schema`, коли потрібна точна структура вхідних даних для команди:

```bash
polywise input_schema session.create
```

Поширені команди:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Коли payload стає складнішим, можна передавати JSON напряму:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Документація

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Мотивація

Polywise побудований на простій ідеї: **по-справжньому розумному ШІ потрібна по-справжньому розумна пам'ять**. Йдеться не просто про зберігання даних, а про систему, яка природно вибудовує зв'язки, стає сильнішою з використанням, уміє стратегічно забувати й постійно розвивається.

## 📄 Джерела

Цей проєкт натхненний такими дослідницькими роботами:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Подяки

Polywise спирається на ці чудові open source-проєкти:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Найбільш поширена у світі високопродуктивна вбудована база даних
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Додає до Sqlite векторний пошук
- ⚛️ **[React](https://react.dev/)** - Фронтендна UI-бібліотека
- 🖥️ **[Electron](https://www.electronjs.org/)** - Фреймворк для десктопних застосунків
- 🔗 **[tRPC](https://trpc.io/)** - Type-safe API від початку до кінця
- 📦 **[MobX](https://mobx.js.org/)** - Просте й масштабоване керування станом
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - CSS-фреймворк у стилі utility-first
- 🚀 **[Hono](https://hono.dev/)** - Надшвидкий вебфреймворк
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Білд-інструмент нового покоління на базі Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Інструмент для збірки бібліотек на базі Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Єдиний набір інструментів для створення AI-застосунків
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js bindings для llama-cpp, створені для роботи з локальними моделями

## 📜 Ліцензія

MIT — деталі дивіться у [LICENSE](LICENSE).
