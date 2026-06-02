# <p align="center"> <img src="../images/logo.png" width="24" height="24" alt="Polywise Logo"> Polywise </p>

<p align="center"><strong>Hệ thống nội dung agentic mã nguồn mở</strong></p>

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
  <img alt="Ở chế độ sáng là hình minh hoạ mặt trời, còn ở chế độ tối là mặt trăng cùng các vì sao." src="../images/landing_light.png">
</picture>

## Polywise là gì

Polywise là một hệ thống nội dung agentic mã nguồn mở. Bạn có thể dùng nó từ dòng lệnh hoặc ứng dụng desktop để trò chuyện với mô hình, lưu lại tri thức, gọi lại ngữ cảnh và biến những cách làm việc lặp đi lặp lại thành các agent có thể tái sử dụng.

## 🚀 Cài đặt

Polywise có hai điểm bắt đầu thực tế nhất: CLI và ứng dụng desktop.

### CLI

Cài CLI toàn cục:

```bash
npm install -g polywise
```

Khởi động dịch vụ Polywise cục bộ:

```bash
polywise start
polywise start -d
```

`polywise start` sẽ giữ dịch vụ chạy ở foreground. `polywise start -d` thoát ngay và để dịch vụ tiếp tục chạy ở background.

Sau đó mở Web UI tại http://localhost:3072/app/ .

Bạn có thể bật đăng nhập bằng Auth trong phần cài đặt. Khi đã bật và đặt mật khẩu, bạn sẽ phải đăng nhập để vào Web UI, đồng thời API cũng sẽ được bảo vệ. Điều này đặc biệt quan trọng nếu bạn định triển khai Polywise trên server để truy cập từ xa.

### Ứng dụng desktop

Tải bản desktop mới nhất từ [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

Nếu bạn muốn khám phá session, nội dung đã lưu, agent và post mà không phải bám vào terminal suốt ngày, ứng dụng desktop là cách dễ nhất.

### Lần chạy đầu tiên

Ở lần đầu sử dụng, Polywise chủ yếu cần:

- một nhà cung cấp mô hình đang dùng được
- mô hình embedding và rerank nếu bạn muốn truy hồi nội dung đã lưu

Bạn không cần cấu hình mọi provider hay integration ngay từ ngày đầu.

## ⬆️ Nâng cấp

### CLI

```bash
polywise upgrade
```

### Ứng dụng desktop

Cài bản phát hành mới nhất từ [GitHub Releases](https://github.com/MatrixAges/polywise/releases).

## ⚡ Bắt đầu nhanh

Nếu bạn muốn chạm tới giá trị đầu tiên bằng con đường ngắn nhất:

1. Mở `Settings -> Model Provider` và cấu hình một provider mà bạn thực sự dùng được.
2. Mở `Settings -> Model Setting` và chắc chắn rằng mô hình chat mặc định đang khả dụng.
3. Vào `Session` và hỏi một câu thật sự thay vì chỉ gửi `hello`.
4. Lưu một ghi chú ngắn, bản tóm tắt trang hoặc một câu trả lời vào Polywise.
5. Nhắc lại mục đã lưu đó trong cuộc trò chuyện để kiểm tra xem khả năng truy hồi có hoạt động hay không.

## 🧭 Cách dùng

Khi đã kết nối được một provider và đặt xong mô hình mặc định, đừng mắc kẹt mãi trong phần cài đặt nữa, hãy bắt đầu dùng sản phẩm.

### Ứng dụng desktop

Ứng dụng sẽ dễ hiểu hơn nhiều nếu mỗi khu vực có một nhiệm vụ cụ thể:

- `Session` để hỏi những câu thật, lên kế hoạch công việc và làm việc trong đúng ngữ cảnh workspace
- `Linkcase` để lấy nội dung web và đưa nó vào hệ thống
- `Agent` để biến những kiểu hướng dẫn lặp lại thành cộng sự có thể dùng lại
- `Posts` để lưu giữ tri thức đáng sống lâu hơn một câu trả lời chat

Có hai phím tắt rất đáng học sớm:

- `@` đưa file, agent và các ngữ cảnh khác vào một session
- `/` đưa công cụ và skill vào workflow

### CLI

CLI là một lớp bọc mỏng phía trên backend API. Mặc định nó nói chuyện với `http://localhost:3072`; nếu server của bạn nằm ở nơi khác, hãy đặt `POLYWISE_SERVER_URL`.

Thay vì cố nhớ lệnh, hãy bắt đầu từ phần trợ giúp:

```bash
polywise -h
polywise session -h
polywise session create -h
```

Dùng `input_schema` khi bạn cần biết chính xác cấu trúc đầu vào của một lệnh:

```bash
polywise input_schema session.create
```

Một số lệnh thường dùng:

```bash
polywise start
polywise start -d
polywise version
polywise session create --title "Daily Review"
polywise search fullTextSearch --query "vector database"
polywise save --for user --content "Key takeaway..."
```

Khi payload trở nên phức tạp hơn, bạn có thể truyền JSON trực tiếp:

```bash
polywise search fullTextSearch --json '{"query":"agent memory","for_types":["wiki","memory"],"enable_recall":true}'
```

## 📚 Tài liệu

- [Intro](https://polywise.io/docs/intro)
- [CLI README](../packages/polywise/README.md)

## 💭 Động lực

Polywise được xây dựng trên một niềm tin rất rõ ràng: **AI thực sự thông minh cần một hệ thống trí nhớ thực sự thông minh**. Đây không chỉ là chuyện lưu trữ, mà là một hệ thống có thể tự nhiên hình thành kết nối, mạnh lên khi được sử dụng, biết quên có chiến lược và liên tục tiến hoá.

## 📄 Tài liệu tham khảo

Dự án này được truyền cảm hứng từ các bài nghiên cứu sau:

- [Long-lasting potentiation of synaptic transmission (1973)](<../.refs/papers/Long-lasting%20potentiation%20of%20synaptic%20transmission%20(1973).pdf>)
- [The Organization of Behavior (1949)](<../.refs/papers/The%20Organization%20of%20Behavior%20(1949).pdf>)
- [A Spreading-Activation Theory of Semantic Processing (1975)](<../.refs/papers/A%20Spreading-Activation%20Theory%20of%20Semantic%20Processing%20(1975).pdf>)

## 🙏 Lời cảm ơn

Polywise đứng trên vai những dự án mã nguồn mở tuyệt vời này:

### Libraries & Tools

- 🐘 **[Sqlite](https://github.com/sqlite/sqlite)** - Cơ sở dữ liệu nhúng hiệu năng cao được triển khai rộng rãi nhất thế giới
- 🏹 **[sqlite-vec](https://github.com/asg017/sqlite-vec)** - Bổ sung khả năng tìm kiếm vector cho Sqlite
- ⚛️ **[React](https://react.dev/)** - Thư viện UI frontend
- 🖥️ **[Electron](https://www.electronjs.org/)** - Framework cho ứng dụng desktop
- 🔗 **[tRPC](https://trpc.io/)** - API type-safe từ đầu đến cuối
- 📦 **[MobX](https://mobx.js.org/)** - Quản lý state đơn giản và mở rộng tốt
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS theo hướng utility-first
- 🚀 **[Hono](https://hono.dev/)** - Framework web siêu nhanh
- 🛠️ **[Rsbuild](https://rsbuild.dev/)** - Công cụ build thế hệ mới chạy trên Rspack
- 📚 **[Rslib](https://rslib.dev/)** - Công cụ build thư viện dựa trên Rsbuild
- 🤖 **[AI SDK](https://ai-sdk.dev/)** - Bộ công cụ thống nhất để xây dựng ứng dụng dùng AI
- 🤗 **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** – Node.js bindings cho llama-cpp, được thiết kế để làm việc với mô hình cục bộ

## 📜 Giấy phép

MIT – Xem [LICENSE](LICENSE) để biết chi tiết.
