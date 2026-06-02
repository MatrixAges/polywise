# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>오픈소스 에이전트 콘텐츠 시스템</strong></p>

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
  <img alt="라이트 모드에서는 태양 일러스트가, 다크 모드에서는 달과 별이 표시됩니다." src="../images/landing_light.png">
</picture>

## Polywise란

Polywise는 오픈소스 에이전트 콘텐츠 시스템입니다. 커맨드라인이나 데스크톱 앱에서 모델과 대화하고, 지식을 저장하고, 문맥을 다시 불러오고, 반복되는 작업 방식을 재사용 가능한 에이전트로 정리할 수 있습니다.

## 🚀 설치

Polywise를 시작하는 가장 실용적인 방법은 두 가지입니다. CLI와 데스크톱 앱입니다.

### CLI

먼저 CLI를 전역 설치합니다.

```bash
npm install -g polywise
```

로컬 Polywise 서비스를 시작합니다.

```bash
polywise start
polywise start -d
```

`polywise start`는 서비스를 포그라운드에서 실행합니다. `polywise start -d`는 바로 종료되지만 서비스는 백그라운드에서 계속 돌아갑니다.

그다음 Web UI인 http://localhost:3072/app/ 에 접속합니다.

설정에서 Auth 로그인을 켤 수 있습니다. 활성화하고 비밀번호까지 설정하면 Web UI에 들어갈 때 로그인이 필요하고 API도 함께 보호됩니다. 서버에 Polywise를 올려 원격으로 접속하게 할 계획이라면 이 설정은 중요합니다.

### 데스크톱 앱

최신 데스크톱 빌드는 [GitHub Releases](https://github.com/MatrixAges/polywise/releases)에서 내려받을 수 있습니다.

세션, 저장된 콘텐츠, 에이전트, 포스트를 터미널 없이 둘러보고 싶다면 데스크톱 앱이 가장 편한 출발점입니다.

### 첫 실행

처음 실행할 때는 보통 이것만 있으면 됩니다.

- 사용 가능한 모델 제공자 하나
- 저장한 콘텐츠 검색까지 쓰고 싶다면 embedding 모델과 rerank 모델

첫날부터 모든 provider와 integration을 다 설정할 필요는 없습니다.

## ⬆️ 업그레이드

### CLI

```bash
polywise upgrade
```

### 데스크톱 앱

[GitHub Releases](https://github.com/MatrixAges/polywise/releases)에서 최신 릴리스를 설치하면 됩니다.

## ⚡ 빠른 시작

가장 짧은 경로로 바로 가치를 느끼고 싶다면:

1. `Settings -> Model Provider`를 열고 지금 실제로 쓸 수 있는 provider 하나를 설정합니다.
2. `Settings -> Model Setting`에서 기본 채팅 모델이 사용 가능한지 확인합니다.
3. `Session`으로 가서 `hello` 대신 실제 질문 하나를 던집니다.
4. 짧은 메모, 페이지 요약, 또는 답변 하나를 Polywise에 저장합니다.
5. 채팅에서 그 저장된 항목을 다시 언급해 검색이 잘 되는지 확인합니다.

## 🧭 사용 방법

provider 하나가 연결되고 기본 모델까지 설정됐다면, 설정만 만지지 말고 바로 제품을 써보는 편이 좋습니다.

### 데스크톱 앱

각 영역을 하나의 구체적인 용도로 쓰면 앱 구조가 금방 잡힙니다.

- `Session`은 실제 질문을 하고, 일을 계획하고, 작업 문맥 안에 머무를 때 사용
- `Linkcase`는 웹 콘텐츠를 가져와 시스템 안으로 추출할 때 사용
- `Agent`는 반복되는 지시 스타일을 재사용 가능한 협업자로 만들 때 사용
- `Posts`는 채팅 답변보다 오래 남겨야 할 지식을 저장할 때 사용

초반에 익혀두면 좋은 단축키는 두 가지입니다.

- `@` 는 파일, 에이전트, 기타 문맥을 세션 안으로 가져옵니다
- `/` 는 도구와 스킬을 워크플로에 끌어옵니다

### CLI

CLI는 백엔드 API 위에 얇게 감싼 래퍼입니다. 기본값은 `http://localhost:3072` 이고, 서버가 다른 곳에 있다면 `POLYWISE_SERVER_URL` 을 설정하면 됩니다.

명령을 외우기보다 도움말부터 시작하는 편이 낫습니다.

```bash
polywise -h
polywise session -h
polywise session create -h
```

명령의 입력 형태를 정확히 확인해야 할 때는 `input_schema` 를 사용합니다.

```bash
polywise input_schema session.create
```

자주 쓰는 명령:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

payload가 복잡해지면 JSON을 직접 넘기면 됩니다.

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 문서

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 왜 Polywise인가

Polywise는 **정말 똑똑한 AI에는 정말 똑똑한 메모리 시스템이 필요하다**는 믿음 위에서 만들어졌습니다. 단순히 저장만 하는 것이 아니라, 연결을 스스로 만들고, 쓸수록 강해지고, 전략적으로 잊어버리기도 하며, 계속 진화하는 시스템을 지향합니다.

## 📄 참고 자료

이 프로젝트는 아래 연구 논문들에서 영감을 받았습니다.

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 감사의 말

Polywise는 아래 훌륭한 오픈소스 프로젝트 위에서 자라고 있습니다.

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - 전 세계에서 가장 널리 배포된 고성능 임베디드 데이터베이스
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Sqlite에 벡터 검색 기능을 추가
- ⚛️ **[React](https://react.dev/)** - 프런트엔드 UI 라이브러리
- 🖥️ **[Electron](https://www.electronjs.org/)** - 데스크톱 앱 프레임워크
- 🔗 **[tRPC](https://trpc.io/)** - 엔드 투 엔드 타입세이프 API
- 📦 **[MobX](https://mobx.js.org/)** - 단순하고 확장 가능한 상태 관리
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - 유틸리티 퍼스트 CSS 프레임워크
- 🚀 **[Hono](https://hono.dev/)** - 초고속 웹 프레임워크
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Rspack 기반 차세대 빌드 도구
- 📚 **[Rslib](https://rslib.dev/)** - Rsbuild 기반 라이브러리 빌드 도구
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - AI 애플리케이션 개발을 위한 통합 툴킷
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – 로컬 모델과 연결하기 위한 llama-cpp용 Node.js 바인딩

## 📜 라이선스

MIT - 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.
