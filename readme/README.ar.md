# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>نظام المحتوى الوكيلي مفتوح المصدر</strong></p>

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
  <img alt="في الوضع الفاتح تظهر شمس مرسومة، وفي الوضع الداكن يظهر القمر مع النجوم." src="../images/landing_light.png">
</picture>

## ما هو Polywise

Polywise هو نظام محتوى وكيلي مفتوح المصدر. يمكنك استخدامه من سطر الأوامر أو من تطبيق سطح المكتب للدردشة مع النماذج، وحفظ المعرفة، واسترجاع السياق، وتحويل أساليب العمل المتكررة إلى وكلاء يمكن إعادة استخدامهم.

## 🚀 التثبيت

لدى Polywise طريقتان عمليتان للبدء: واجهة الأوامر CLI وتطبيق سطح المكتب.

### CLI

ثبّت واجهة الأوامر بشكل عام:

```bash
npm install -g polywise
```

ثم شغّل خدمة Polywise المحلية:

```bash
polywise start
polywise start -d
```

الأمر `polywise start` يُبقي الخدمة في الواجهة. أما `polywise start -d` فينهي الأمر مباشرة ويترك الخدمة تعمل في الخلفية.

بعد ذلك افتح واجهة الويب على http://localhost:3072/app/ .

يمكنك تفعيل تسجيل الدخول عبر Auth من الإعدادات. بعد التفعيل وتعيين كلمة مرور، سيصبح تسجيل الدخول مطلوبًا للوصول إلى Web UI، وسيتم أيضًا حماية الـ API. هذا مهم جدًا إذا كنت ستنشر Polywise على خادم للوصول عن بُعد.

### تطبيق سطح المكتب

حمّل أحدث نسخة من [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

إذا كنت تريد استكشاف الجلسات والمحتوى المحفوظ والوكلاء والمنشورات بدون الاعتماد الدائم على الطرفية، فتطبيق سطح المكتب هو الخيار الأسهل.

### التشغيل الأول

عند أول تشغيل، يحتاج Polywise بشكل أساسي إلى:

- مزوّد نماذج واحد متاح
- نماذج embedding و rerank إذا كنت تريد استرجاع المحتوى المحفوظ

لا تحتاج إلى إعداد كل provider وكل integration من اليوم الأول.

## ⬆️ الترقية

### CLI

```bash
polywise upgrade
```

### تطبيق سطح المكتب

ثبّت أحدث إصدار من [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ بداية سريعة

إذا كنت تريد أقصر طريق للوصول إلى أول فائدة حقيقية:

1. افتح `Settings -> Model Provider` واضبط مزودًا واحدًا يمكنك استخدامه فعليًا.
2. افتح `Settings -> Model Setting` وتأكد من أن نموذج الدردشة الافتراضي متاح.
3. انتقل إلى `Session` واسأل سؤالًا حقيقيًا بدلًا من إرسال `hello` فقط.
4. احفظ ملاحظة قصيرة أو ملخص صفحة أو إجابة داخل Polywise.
5. اذكر هذا العنصر المحفوظ مرة أخرى في الدردشة للتأكد من أن الاسترجاع يعمل.

## 🧭 الاستخدام

بعد توصيل مزود واحد وضبط النموذج الافتراضي، توقّف عن كثرة الإعدادات وابدأ باستخدام المنتج فعليًا.

### تطبيق سطح المكتب

يصبح فهم التطبيق أسهل عندما يكون لكل قسم وظيفة واضحة:

- `Session` لطرح أسئلة حقيقية، وتخطيط العمل، والبقاء داخل سياق مساحة العمل
- `Linkcase` لجلب محتوى الويب واستخلاصه داخل النظام
- `Agent` لتحويل أساليب التعليمات المتكررة إلى مساعدين يمكن إعادة استخدامهم
- `Posts` لحفظ المعرفة التي تستحق أن تعيش أطول من مجرد رد في الدردشة

هناك اختصاران من المفيد تعلمهما مبكرًا:

- `@` يجلب الملفات والوكلاء وسياقات أخرى إلى الجلسة
- `/` يجلب الأدوات والمهارات إلى سير العمل

### CLI

واجهة CLI هي غلاف خفيف فوق الـ backend API. افتراضيًا تتصل بـ `http://localhost:3072`؛ وإذا كان الخادم عندك في مكان آخر، فاضبط `POLYWISE_SERVER_URL`.

بدلًا من حفظ الأوامر، ابدأ من المساعدة:

```bash
polywise -h
polywise session -h
polywise session create -h
```

استخدم `input_schema` عندما تحتاج إلى شكل الإدخال الدقيق لأمر معين:

```bash
polywise input_schema session.create
```

أوامر شائعة:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

عندما تصبح الحمولة أكثر تعقيدًا، يمكنك تمرير JSON مباشرة:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 التوثيق

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 الدافع

تم بناء Polywise على قناعة بسيطة: **الذكاء الاصطناعي الذكي فعلًا يحتاج إلى ذاكرة ذكية فعلًا**. الفكرة ليست مجرد التخزين، بل بناء نظام يستطيع أن يكوّن الروابط بشكل طبيعي، ويزداد قوة مع الاستخدام، وينسى بشكل استراتيجي، ويواصل التطور.

## 📄 المراجع

استُلهم هذا المشروع من الأوراق البحثية التالية:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 الشكر

يقف Polywise على أكتاف هذه المشاريع المفتوحة المصدر الممتازة:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - قاعدة البيانات المضمنة عالية الأداء الأكثر انتشارًا في العالم
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - يضيف البحث المتجهي إلى Sqlite
- ⚛️ **[React](https://react.dev/)** - مكتبة واجهات أمامية
- 🖥️ **[Electron](https://www.electronjs.org/)** - إطار عمل لتطبيقات سطح المكتب
- 🔗 **[tRPC](https://trpc.io/)** - واجهات API آمنة الأنواع من الطرف إلى الطرف
- 📦 **[MobX](https://mobx.js.org/)** - إدارة حالة بسيطة وقابلة للتوسع
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - إطار CSS بنهج utility-first
- 🚀 **[Hono](https://hono.dev/)** - إطار ويب فائق السرعة
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - أداة بناء من الجيل الجديد مدعومة بـ Rspack
- 📚 **[Rslib](https://rslib.dev/)** - أداة بناء مكتبات مبنية على Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - مجموعة أدوات موحّدة لبناء تطبيقات مدعومة بالذكاء الاصطناعي
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – ربط Node.js مع llama-cpp للتعامل مع النماذج المحلية

## 📜 الترخيص

MIT – راجع [LICENSE](LICENSE) للتفاصيل.
