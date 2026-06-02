# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Otwartoźródłowy system treści agentowych</strong></p>

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
  <img alt="W jasnym motywie widać ilustrację słońca, a w ciemnym księżyc i gwiazdy." src="../images/landing_light.png">
</picture>

## Czym jest Polywise

Polywise to otwartoźródłowy system treści agentowych. Możesz korzystać z niego z poziomu wiersza poleceń albo aplikacji desktopowej, aby rozmawiać z modelami, zapisywać wiedzę, odzyskiwać kontekst i zamieniać powtarzalne sposoby pracy w agentów, których da się używać ponownie.

## 🚀 Instalacja

Polywise ma dwa naprawdę praktyczne punkty wejścia: CLI i aplikację desktopową.

### CLI

Zainstaluj CLI globalnie:

```bash
npm install -g polywise
```

Uruchom lokalną usługę Polywise:

```bash
polywise start
polywise start -d
```

`polywise start` trzyma usługę na pierwszym planie. `polywise start -d` kończy się od razu i zostawia usługę działającą w tle.

Następnie otwórz Web UI pod adresem http://localhost:3072/app/ .

W ustawieniach możesz włączyć logowanie przez Auth. Po aktywacji i ustawieniu hasła dostęp do Web UI będzie wymagał logowania, a API też zostanie zabezpieczone. To bardzo ważne, jeśli chcesz wystawić Polywise jako usługę na serwerze z dostępem zdalnym.

### Aplikacja desktopowa

Najnowszą wersję desktopową pobierzesz z [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Jeśli chcesz wygodnie przeglądać sesje, zapisane treści, agentów i posty bez siedzenia w terminalu, aplikacja desktopowa jest najprostszą drogą.

### Pierwsze uruchomienie

Przy pierwszym uruchomieniu Polywise potrzebuje głównie:

- jednego dostępnego dostawcy modeli
- modeli embedding i rerank, jeśli chcesz odzyskiwać zapisane treści

Nie musisz pierwszego dnia konfigurować wszystkich providerów i integracji.

## ⬆️ Aktualizacja

### CLI

```bash
polywise upgrade
```

### Aplikacja desktopowa

Zainstaluj najnowsze wydanie z [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Szybki start

Jeśli chcesz jak najszybciej dojść do pierwszego sensownego efektu:

1. Otwórz `Settings -> Model Provider` i skonfiguruj jednego providera, z którego naprawdę możesz skorzystać.
2. Otwórz `Settings -> Model Setting` i upewnij się, że domyślny model czatu jest dostępny.
3. Wejdź do `Session` i zadaj prawdziwe pytanie zamiast wysyłać samo `hello`.
4. Zapisz w Polywise krótką notatkę, podsumowanie strony albo odpowiedź.
5. Wspomnij ten zapisany element ponownie w czacie, żeby sprawdzić, czy odzyskiwanie działa.

## 🧭 Użycie

Gdy masz już podłączonego jednego providera i ustawiony model domyślny, przestań klikać w konfigurację i po prostu zacznij używać produktu.

### Aplikacja desktopowa

Najłatwiej zrozumieć aplikację, gdy każdemu obszarowi przypiszesz jedno konkretne zadanie:

- `Session` do zadawania prawdziwych pytań, planowania pracy i działania w kontekście workspace'u
- `Linkcase` do pobierania i wyciągania treści z sieci do systemu
- `Agent` do zamieniania powtarzalnych stylów instrukcji w agentów, z którymi da się pracować wielokrotnie
- `Posts` do zapisywania wiedzy, która powinna żyć dłużej niż jedna odpowiedź na czacie

Dwa skróty warto poznać od razu:

- `@` przenosi pliki, agentów i inny kontekst do sesji
- `/` dodaje narzędzia i skille do workflow

### CLI

CLI to cienka warstwa nad backendowym API. Domyślnie łączy się z `http://localhost:3072`; jeśli Twój serwer działa gdzie indziej, ustaw `POLYWISE_SERVER_URL`.

Zamiast uczyć się komend na pamięć, zacznij od pomocy:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Użyj `input_schema`, gdy potrzebujesz dokładnego kształtu wejścia dla komendy:

```bash
polywise input_schema session.create
```

Najczęstsze komendy:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Gdy payloady robią się bardziej złożone, możesz przekazać JSON bezpośrednio:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Dokumentacja

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Motywacja

Polywise powstał z przekonania, że **naprawdę inteligentna AI potrzebuje naprawdę inteligentnej pamięci**. Nie chodzi tylko o samo przechowywanie danych, ale o system, który naturalnie buduje połączenia, wzmacnia się przez użycie, potrafi zapominać strategicznie i stale się rozwija.

## 📄 Źródła

Ten projekt został zainspirowany następującymi publikacjami naukowymi:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Podziękowania

Polywise stoi na barkach tych świetnych projektów open source:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Najszerzej wdrożona wysokowydajna baza osadzona na świecie
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Dodaje wyszukiwanie wektorowe do Sqlite
- ⚛️ **[React](https://react.dev/)** - Biblioteka UI dla frontendu
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework aplikacji desktopowych
- 🔗 **[tRPC](https://trpc.io/)** - Type-safe API end to end
- 📦 **[MobX](https://mobx.js.org/)** - Proste i skalowalne zarządzanie stanem
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- 🚀 **[Hono](https://hono.dev/)** - Ultraszybki framework webowy
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Narzędzie build nowej generacji oparte na Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Narzędzie do budowania bibliotek oparte na Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Ujednolicony zestaw narzędzi do budowania aplikacji AI
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Wiązania Node.js dla llama-cpp zaprojektowane do pracy z modelami lokalnymi

## 📜 Licencja

MIT – Szczegóły znajdziesz w [LICENSE](LICENSE).
