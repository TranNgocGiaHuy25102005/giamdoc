# Deploy CHUNORA PET lên Vercel

Code đã sẵn sàng cho Vercel: khi chạy trên Vercel, dữ liệu admin tự lưu vào MySQL (bảng `content_files`)
và ảnh/video tải lên lưu ở **Vercel Blob**. Trên máy/VPS vẫn chạy như cũ (lưu file).

## 1. Chuẩn bị MySQL trên mạng
Vercel không kết nối được MySQL XAMPP trên máy bạn. Dùng một trong các cách:
- MySQL trên VPS của bạn: mở cổng 3306 cho truy cập từ xa (tạo user riêng, mật khẩu mạnh).
- Dịch vụ cloud: TiDB Cloud Serverless, Aiven, Railway… (thường bắt buộc SSL → đặt `DB_SSL=1`).

Chuyển dữ liệu cũ: xuất database `chunorapet_cms` bằng phpMyAdmin (Export) rồi nhập (Import) vào MySQL mới.
Bảng `site_content`, `consultation_requests`, `content_files` sẽ tự tạo nếu chưa có.

## 2. Đưa code lên Vercel (chọn 1 cách)
**A. Vercel CLI (không cần GitHub)** — giải nén file zip, mở terminal trong thư mục đó:
```
npm i -g vercel
vercel login
vercel          # lần đầu: tạo project, trả lời các câu hỏi (giữ mặc định)
```
**B. GitHub** — đẩy thư mục lên một repo GitHub (private), rồi vào vercel.com → Add New → Project → Import repo.

(File zip KHÔNG kéo-thả trực tiếp vào Vercel được; phải dùng A hoặc B.)

## 3. Tạo Blob store
Vercel → Project → **Storage** → Create → **Blob** → Connect với project.
Vercel tự thêm biến `BLOB_READ_WRITE_TOKEN`.

## 4. Biến môi trường
Vercel → Project → Settings → **Environment Variables**, thêm (giống `.env.example`):
| Biến | Giá trị |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL ở bước 1 |
| `DB_SSL` | `1` nếu MySQL cloud yêu cầu SSL |
| `ADMIN_PASSWORD_HASH` | chuỗi `$2y$...` trong `config.php` cũ, hoặc `node scripts/hash-password.mjs "MAT_KHAU"` |
| `SESSION_SECRET` | chuỗi ngẫu nhiên ≥ 32 ký tự |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS` | báo lead Telegram (nhiều chat cách nhau dấu phẩy) |
| `FB_PAGE_ACCESS_TOKEN`, `FB_ADMIN_PSIDS` | báo lead Messenger |
| `MAIL_TO`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | email báo lead (tuỳ chọn) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | dịch tự động bằng AI (tuỳ chọn) |

Sau khi thêm biến: Deployments → Redeploy (hoặc `vercel --prod`).

## 5. Tên miền
Project → Settings → Domains → thêm `chunorapet.com`, rồi trỏ DNS theo hướng dẫn của Vercel.

## Lưu ý khi chạy trên Vercel
- Ảnh/nội dung đã có sẵn trong `public/images` vẫn hiển thị bình thường. Ảnh mới tải lên nằm trên Blob.
- Video tải lên không được đổi sang WebM (Vercel không có ffmpeg) → giữ nguyên MP4. Video dài nên đăng YouTube rồi dán link.
- Lần đầu admin bấm Lưu một mục, dữ liệu mặc định trong `content/*.json` được chép vào MySQL; từ đó MySQL là nơi lưu chính.
- Bản dịch cũ trong `content/lang` vẫn dùng được ngay; khi bấm "Tự động dịch", bản dịch mới lưu vào MySQL.
