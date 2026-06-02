# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>ระบบคอนเทนต์แบบเอเจนต์โอเพนซอร์ส</strong></p>

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
  <img alt="โหมดสว่างจะแสดงภาพดวงอาทิตย์ ส่วนโหมดมืดจะแสดงพระจันทร์กับดวงดาว" src="../images/landing_light.png">
</picture>

## Polywise คืออะไร

Polywise คือระบบคอนเทนต์แบบเอเจนต์โอเพนซอร์ส คุณสามารถใช้มันผ่านคำสั่งบนเทอร์มินัลหรือแอปเดสก์ท็อปเพื่อคุยกับโมเดล บันทึกความรู้ เรียกบริบทกลับมาใช้ และเปลี่ยนรูปแบบการทำงานที่ทำซ้ำบ่อยให้กลายเป็นเอเจนต์ที่นำกลับมาใช้ได้

## 🚀 การติดตั้ง

Polywise มีจุดเริ่มต้นที่ใช้งานจริงอยู่ 2 แบบ: CLI และแอปเดสก์ท็อป

### CLI

ติดตั้ง CLI แบบ global:

```bash
npm install -g polywise
```

เริ่มบริการ Polywise บนเครื่อง:

```bash
polywise start
polywise start -d
```

`polywise start` จะรันบริการไว้ด้านหน้าเทอร์มินัล ส่วน `polywise start -d` จะจบคำสั่งทันทีและปล่อยให้บริการทำงานต่ออยู่เบื้องหลัง

จากนั้นเปิด Web UI ที่ http://localhost:3072/app/ .

คุณสามารถเปิดใช้การล็อกอินด้วย Auth ได้ในหน้า settings เมื่อเปิดแล้วและตั้งรหัสผ่านไว้ การเข้า Web UI จะต้องล็อกอินก่อน และ API ก็จะถูกป้องกันไปพร้อมกันด้วย เรื่องนี้สำคัญมากถ้าคุณจะ deploy Polywise บนเซิร์ฟเวอร์เพื่อให้เข้าถึงจากระยะไกล

### แอปเดสก์ท็อป

ดาวน์โหลดเวอร์ชันล่าสุดได้จาก [GitHub Releases](https://github.com/MatrixAges/polywise/releases)

ถ้าคุณอยากดู sessions, เนื้อหาที่บันทึกไว้, agents และ posts ได้สะดวกโดยไม่ต้องอยู่กับเทอร์มินัลตลอด แอปเดสก์ท็อปคือทางเลือกที่ง่ายที่สุด

### การใช้งานครั้งแรก

สำหรับการเริ่มต้นครั้งแรก Polywise ต้องมีหลัก ๆ แค่:

- ผู้ให้บริการโมเดลที่ใช้งานได้อย่างน้อย 1 ราย
- โมเดล embedding และ rerank ถ้าคุณต้องการค้นคืนเนื้อหาที่บันทึกไว้

วันแรกยังไม่จำเป็นต้องตั้งค่าทุก provider หรือทุก integration ให้ครบ

## ⬆️ การอัปเกรด

### CLI

```bash
polywise upgrade
```

### แอปเดสก์ท็อป

ติดตั้งรีลีสล่าสุดจาก [GitHub Releases](https://github.com/MatrixAges/polywise/releases)

## ⚡ เริ่มต้นอย่างรวดเร็ว

ถ้าคุณอยากเห็นคุณค่าจริงให้เร็วที่สุด:

1. เปิด `Settings -> Model Provider` แล้วตั้งค่า provider ที่คุณใช้งานได้จริงสัก 1 ตัว
2. เปิด `Settings -> Model Setting` แล้วตรวจสอบว่าโมเดลแชตเริ่มต้นพร้อมใช้งาน
3. ไปที่ `Session` แล้วถามคำถามจริง ๆ แทนการส่งแค่ `hello`
4. บันทึกโน้ตสั้น ๆ สรุปหน้าเว็บ หรือคำตอบสักชิ้นไว้ใน Polywise
5. พูดถึงรายการที่บันทึกไว้นั้นอีกครั้งในแชต เพื่อเช็กว่าระบบดึงกลับมาได้จริง

## 🧭 การใช้งาน

เมื่อเชื่อมต่อ provider ได้แล้ว และตั้งค่าโมเดลเริ่มต้นเรียบร้อย ก็เลิกหมกอยู่กับการตั้งค่าแล้วเริ่มใช้ตัวผลิตภัณฑ์ได้เลย

### แอปเดสก์ท็อป

แอปจะเข้าใจง่ายขึ้นมากถ้าคุณใช้แต่ละส่วนให้มีหน้าที่ชัดเจน:

- `Session` สำหรับถามคำถามจริง วางแผนงาน และทำงานต่อในบริบทของ workspace
- `Linkcase` สำหรับดึงและสกัดคอนเทนต์จากเว็บเข้ามาในระบบ
- `Agent` สำหรับเปลี่ยนสไตล์คำสั่งที่ใช้ซ้ำบ่อยให้กลายเป็นผู้ช่วยที่ใช้ต่อได้
- `Posts` สำหรับเก็บความรู้ที่ควรอยู่ยาวกว่าคำตอบในแชตเพียงครั้งเดียว

มีคีย์ลัด 2 ตัวที่ควรเรียนรู้ตั้งแต่ต้น:

- `@` ใช้ดึงไฟล์ เอเจนต์ และบริบทอื่น ๆ เข้ามาใน session
- `/` ใช้ดึงเครื่องมือและ skills เข้ามาใน workflow

### CLI

CLI เป็นเลเยอร์บาง ๆ ที่ครอบอยู่บน backend API โดยค่าเริ่มต้นจะคุยกับ `http://localhost:3072` ถ้าเซิร์ฟเวอร์ของคุณอยู่ที่อื่น ให้ตั้งค่า `POLYWISE_SERVER_URL`

แทนที่จะจำคำสั่ง แนะนำให้เริ่มจาก help:

```bash
polywise -h
polywise session -h
polywise session create -h
```

ใช้ `input_schema` เมื่อต้องการรู้โครงสร้าง input แบบเป๊ะ ๆ ของคำสั่ง:

```bash
polywise input_schema session.create
```

คำสั่งที่ใช้บ่อย:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

ถ้า payload เริ่มซับซ้อนขึ้น คุณสามารถส่ง JSON ตรง ๆ ได้:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 เอกสาร

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 แนวคิดเบื้องหลัง

Polywise ถูกสร้างขึ้นบนความเชื่อว่า **AI ที่ฉลาดจริง ต้องมีระบบความจำที่ฉลาดจริงด้วย** มันไม่ใช่แค่ที่เก็บข้อมูล แต่เป็นระบบที่สร้างความเชื่อมโยงได้อย่างเป็นธรรมชาติ แข็งแรงขึ้นเมื่อใช้งาน รู้จักลืมอย่างมีกลยุทธ์ และพัฒนาต่อเนื่องไปเรื่อย ๆ

## 📄 แหล่งอ้างอิง

โปรเจกต์นี้ได้รับแรงบันดาลใจจากงานวิจัยต่อไปนี้:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 คำขอบคุณ

Polywise ยืนอยู่บนไหล่ของโปรเจกต์โอเพนซอร์สชั้นเยี่ยมเหล่านี้:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - ฐานข้อมูลแบบฝังตัวประสิทธิภาพสูงที่ถูกใช้งานแพร่หลายที่สุดในโลก
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - เพิ่มความสามารถในการค้นหาเวกเตอร์ให้กับ Sqlite
- ⚛️ **[React](https://react.dev/)** - ไลบรารี UI ฝั่งฟรอนต์เอนด์
- 🖥️ **[Electron](https://www.electronjs.org/)** - เฟรมเวิร์กสำหรับแอปเดสก์ท็อป
- 🔗 **[tRPC](https://trpc.io/)** - API แบบ type-safe ตั้งแต่ต้นทางถึงปลายทาง
- 📦 **[MobX](https://mobx.js.org/)** - ระบบจัดการสถานะที่เรียบง่ายและขยายต่อได้
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - เฟรมเวิร์ก CSS แบบ utility-first
- 🚀 **[Hono](https://hono.dev/)** - เฟรมเวิร์กเว็บความเร็วสูงมาก
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - เครื่องมือ build รุ่นใหม่ที่ขับเคลื่อนด้วย Rspack
- 📚 **[Rslib](https://rslib.dev/)** - เครื่องมือ build สำหรับไลบรารีที่ทำงานบน Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - ชุดเครื่องมือรวมสำหรับสร้างแอปที่ขับเคลื่อนด้วย AI
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js bindings สำหรับ llama-cpp ที่ออกแบบมาเพื่อเชื่อมกับโมเดลบนเครื่อง

## 📜 ใบอนุญาต

MIT – ดูรายละเอียดได้ที่ [LICENSE](LICENSE)
