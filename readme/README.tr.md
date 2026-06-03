# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Açık kaynaklı agentik içerik sistemi</strong></p>

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
  <img alt="Açık temada güneş illüstrasyonu, koyu temada ise ay ve yıldızlar gösterilir." src="../images/landing_light.png">
</picture>

## Polywise nedir?

Polywise açık kaynaklı bir agentik içerik sistemidir. Komut satırından ya da masaüstü uygulamasından kullanarak modellerle konuşabilir, bilgi saklayabilir, bağlamı geri çağırabilir ve tekrar eden çalışma biçimlerini yeniden kullanılabilir ajanlara dönüştürebilirsiniz.

## 🚀 Kurulum

Polywise için iki pratik giriş noktası vardır: CLI ve masaüstü uygulaması.

### CLI

CLI'ı global olarak kurun:

```bash
npm install -g polywise
```

Yerel Polywise servisini başlatın:

```bash
polywise start
polywise start -d
```

`polywise start` servisi ön planda çalıştırır. `polywise start -d` ise komuttan hemen çıkar ve servisi arka planda çalışır halde bırakır.

Daha sonra web arayüzünü http://localhost:3072/app/ adresinde açın.

Ayarlar içinden Auth girişini etkinleştirebilirsiniz. Etkinleştirip bir parola belirledikten sonra Web UI'a erişmek için giriş yapmanız gerekir ve API de korunmuş olur. Polywise'i uzak erişim için bir sunucuya kurmayı düşünüyorsanız bu özellikle önemlidir.

### Masaüstü uygulaması

En güncel masaüstü sürümünü [GitHub Releases](https://github.com/MatrixAges/polywise/releases) sayfasından indirin.

Session'ları, kayıtlı içerikleri, ajanları ve post'ları sürekli terminalde kalmadan gezmek istiyorsanız masaüstü uygulaması en kolay yoldur.

### İlk çalıştırma

İlk kullanım için Polywise'in esas olarak ihtiyacı olanlar şunlardır:

- kullanılabilir bir model sağlayıcısı
- kayıtlı içeriği geri getirmek istiyorsanız embedding ve rerank modelleri

İlk gün bütün provider ve integration ayarlarını tamamlamanız gerekmez.

## ⬆️ Güncelleme

### CLI

```bash
polywise upgrade
```

### Masaüstü uygulaması

En son sürümü [GitHub Releases](https://github.com/MatrixAges/polywise/releases) sayfasından kurun.

## ⚡ Hızlı başlangıç

İlk gerçek faydaya en kısa yoldan ulaşmak istiyorsanız:

1. `Settings -> Model Provider` bölümünü açın ve gerçekten kullanabileceğiniz bir provider ayarlayın.
2. `Settings -> Model Setting` bölümünü açın ve varsayılan sohbet modelinin kullanılabilir olduğundan emin olun.
3. `Session` bölümüne gidin ve sadece `hello` göndermek yerine gerçek bir soru sorun.
4. Polywise'e kısa bir not, sayfa özeti ya da bir cevap kaydedin.
5. Geri getirmenin çalıştığını doğrulamak için bu kayıtlı öğeden sohbette tekrar bahsedin.

## 🧭 Kullanım

Bir provider bağlanıp varsayılan model ayarlandıktan sonra, ayarlarla oyalanmayı bırakıp ürünü kullanmaya başlayın.

### Masaüstü uygulaması

Uygulama, her alanı tek bir somut iş için kullandığınızda çok daha anlaşılır hale gelir:

- `Session` gerçek sorular sormak, işi planlamak ve workspace bağlamı içinde kalmak için
- `Linkcase` web içeriğini sisteme çekip çıkarmak için
- `Agent` tekrar eden talimat stillerini yeniden kullanılabilir iş ortaklarına dönüştürmek için
- `Posts` tek bir sohbet yanıtından daha uzun yaşaması gereken bilgileri saklamak için

Erken öğrenmeye değer iki kısayol vardır:

- `@` dosyaları, ajanları ve diğer bağlam öğelerini bir session içine getirir
- `/` araçları ve skill'leri iş akışına dahil eder

### CLI

CLI, backend API'nin üstünde duran ince bir sarmalayıcıdır. Varsayılan olarak `http://localhost:3072` ile konuşur; sunucunuz başka bir yerdeyse `POLYWISE_SERVER_URL` ayarlayın.

Komutları ezberlemek yerine yardım çıktısıyla başlayın:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Bir komutun tam giriş şeklini gerektiğinde `input_schema` kullanın:

```bash
polywise input_schema session.create
```

Yaygın komutlar:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Payload'lar karmaşıklaştığında JSON'u doğrudan geçebilirsiniz:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Dokümantasyon

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 🎬 Intro Video

<video src="../videos/polywise_intro.mp4" controls width="100%"></video>

[Open the intro video file](../videos/polywise_intro.mp4)

## 💭 Motivasyon

Polywise şu inanç üzerine kuruldu: **gerçekten akıllı bir yapay zekâ, gerçekten akıllı bir hafızaya ihtiyaç duyar**. Mesele sadece depolamak değil; bağlantıları doğal biçimde kurabilen, kullanım oldukça güçlenen, stratejik olarak unutabilen ve sürekli evrilen bir sistem kurmaktır.

## 📄 Referanslar

Bu proje aşağıdaki araştırma makalelerinden ilham aldı:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Teşekkürler

Polywise şu harika açık kaynak projelerinin omuzlarında yükseliyor:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Dünyada en yaygın kullanılan yüksek performanslı gömülü veritabanı
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Sqlite'e vektör arama desteği ekler
- ⚛️ **[React](https://react.dev/)** - Ön yüz UI kütüphanesi
- 🖥️ **[Electron](https://www.electronjs.org/)** - Masaüstü uygulama çatısı
- 🔗 **[tRPC](https://trpc.io/)** - Uçtan uca type-safe API'ler
- 📦 **[MobX](https://mobx.js.org/)** - Basit ve ölçeklenebilir durum yönetimi
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS çatısı
- 🚀 **[Hono](https://hono.dev/)** - Ultra hızlı web çatısı
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Rspack destekli yeni nesil build aracı
- 📚 **[Rslib](https://rslib.dev/)** - Rsbuild tabanlı kütüphane build aracı
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Yapay zekâ destekli uygulamalar geliştirmek için birleşik araç seti
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Yerel modellerle çalışmak üzere tasarlanmış llama-cpp için Node.js binding'leri

## 📜 Lisans

MIT – Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
