# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>El sistema de contenidos agentic de código abierto</strong></p>

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
  <img alt="En modo claro se ve un sol ilustrado; en modo oscuro, una luna con estrellas." src="../images/landing_light.png">
</picture>

## Qué es Polywise

Polywise es un sistema de contenidos agentic de código abierto. Puedes usarlo desde la línea de comandos o desde la app de escritorio para hablar con modelos, guardar conocimiento, recuperar contexto y convertir formas de trabajo repetidas en agentes reutilizables.

## 🚀 Instalación

Polywise tiene dos puntos de entrada realmente prácticos: la CLI y la app de escritorio.

### CLI

Instala la CLI de forma global:

```bash
npm install -g polywise
```

Inicia el servicio local de Polywise:

```bash
polywise start
polywise start -d
```

`polywise start` mantiene el servicio en primer plano. `polywise start -d` sale enseguida y deja el servicio corriendo en segundo plano.

Después abre la interfaz web en http://localhost:3072/app/ .

Puedes activar el inicio de sesión con Auth desde la configuración. Una vez habilitado y con contraseña definida, tendrás que iniciar sesión para entrar en la Web UI, y la API también quedará protegida. Esto es clave si vas a desplegar Polywise en un servidor para acceder de forma remota.

### App de escritorio

Descarga la versión más reciente desde [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Si quieres explorar sesiones, contenido guardado, agentes y publicaciones sin vivir en la terminal, la app de escritorio es la forma más sencilla.

### Primer arranque

Para el primer uso, Polywise necesita sobre todo:

- un proveedor de modelos disponible
- modelos de embedding y rerank si quieres recuperar contenido guardado

No hace falta configurar todos los providers e integrations el primer día.

## ⬆️ Actualización

### CLI

```bash
polywise upgrade
```

### App de escritorio

Instala la versión más reciente desde [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Inicio rápido

Si quieres llegar al primer resultado útil por el camino más corto:

1. Abre `Settings -> Model Provider` y configura un provider que realmente puedas usar ahora mismo.
2. Abre `Settings -> Model Setting` y asegúrate de que el modelo de chat por defecto está disponible.
3. Ve a `Session` y haz una pregunta de verdad en lugar de mandar `hello`.
4. Guarda en Polywise una nota corta, un resumen de página o una respuesta.
5. Vuelve a mencionar ese elemento guardado en el chat para comprobar que la recuperación funciona.

## 🧭 Uso

Cuando ya tengas un provider conectado y el modelo por defecto configurado, deja de ajustar opciones y ponte a usar el producto.

### App de escritorio

La app se entiende mucho mejor cuando cada área tiene un trabajo concreto:

- `Session` para hacer preguntas reales, planificar trabajo y seguir dentro del contexto de tu workspace
- `Linkcase` para traer y extraer contenido web al sistema
- `Agent` para convertir estilos de instrucciones repetidos en colaboradores reutilizables
- `Posts` para guardar conocimiento que merece durar más que una respuesta de chat

Hay dos atajos que conviene aprender pronto:

- `@` trae archivos, agentes y otro contexto a una sesión
- `/` mete herramientas y skills en el flujo de trabajo

### CLI

La CLI es una capa muy fina sobre la API del backend. Por defecto habla con `http://localhost:3072`; si tu servidor vive en otro sitio, define `POLYWISE_SERVER_URL`.

En lugar de memorizar comandos, empieza por la ayuda:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Usa `input_schema` cuando necesites la forma exacta de entrada de un comando:

```bash
polywise input_schema session.create
```

Comandos habituales:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Cuando los payloads se vuelvan más complejos, puedes pasar JSON directamente:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Documentación

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Motivación

Polywise nace de una idea muy simple: **una IA realmente inteligente necesita una memoria realmente inteligente**. No se trata solo de guardar cosas, sino de construir un sistema capaz de formar conexiones de manera orgánica, fortalecerse con el uso, olvidar con criterio y seguir evolucionando.

## 📄 Referencias

Este proyecto se inspira en los siguientes artículos de investigación:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Agradecimientos

Polywise se apoya en estos excelentes proyectos open source:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - La base de datos embebida de alto rendimiento más desplegada del mundo
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Añade búsqueda vectorial a Sqlite
- ⚛️ **[React](https://react.dev/)** - Biblioteca de UI para frontend
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework para aplicaciones de escritorio
- 🔗 **[tRPC](https://trpc.io/)** - APIs type-safe de extremo a extremo
- 📦 **[MobX](https://mobx.js.org/)** - Gestión de estado simple y escalable
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- 🚀 **[Hono](https://hono.dev/)** - Framework web ultrarrápido
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Herramienta de build de nueva generación impulsada por Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Herramienta para construir librerías sobre Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Kit unificado para crear aplicaciones impulsadas por IA
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Bindings de Node.js para llama-cpp pensados para conectar con modelos locales

## 📜 Licencia

MIT – Consulta [LICENSE](LICENSE) para más detalles.
