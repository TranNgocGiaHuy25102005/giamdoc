# CHUNORA PET — bản Next.js (React)

Bản chuyển đổi từ website PHP (`../wwwroot`) sang **Next.js 15 + React 19 + TypeScript**. Giao diện, nội dung, URL dữ liệu,
MySQL, hệ thống đa quốc gia/dịch (dùng lại `content/lang/*/phrases.json`), form tư vấn + báo lead Telegram/Messenger/email
và trang quản trị đều được giữ nguyên chức năng.

## Cài đặt (máy Windows / VPS)

1. Cài **Node.js 20 LTS trở lên** (https://nodejs.org).
2. Mở terminal trong thư mục này rồi chạy:
   ```
   npm install
   ```
3. Sao chép `.env.example` thành `.env.local` và điền:
   - `DB_*` giống `config.php` cũ (MySQL XAMPP, database `chunorapet_cms` — dùng chung database với bản PHP được).
   - `ADMIN_PASSWORD_HASH`: dán **nguyên** chuỗi `admin_password_hash` trong `config.php` cũ (hash `$2y$...` dùng được), hoặc tạo mới:
     `node scripts/hash-password.mjs "MAT_KHAU"`.
   - `SESSION_SECRET`: chuỗi ngẫu nhiên ≥ 32 ký tự.
   - Telegram / Messenger / SMTP: chép từ `config.php` (email nay gửi qua SMTP thay cho hàm `mail()` của PHP).
4. Chạy thử: `npm run dev` → mở http://localhost:3000 (admin: http://localhost:3000/admin).
5. Chạy thật:
   ```
   npm run build
   npm start          # cổng 3000
   ```
   Nên chạy nền bằng PM2: `npm i -g pm2` → `pm2 start npm --name chunorapet -- start` → `pm2 save`.

### Deploy lên Vercel
Xem `DEPLOY-VERCEL.md`.

### Dùng với IIS
IIS chỉ làm cổng vào và chuyển request sang Node: cài **URL Rewrite** + **Application Request Routing** (bật *Enable proxy*),
trỏ Physical Path của site tới thư mục này — file `web.config` đi kèm đã cấu hình chuyển tiếp tới `127.0.0.1:3000`.

## Khác biệt so với bản PHP
- URL mới không còn `.php` (`/van-chuyen-quoc-te`, `/tin-tuc`…). Link cũ `.php` tự chuyển hướng 301 nên không mất SEO.
- Ảnh/nội dung: `images/` nay nằm trong `public/images/`, dữ liệu JSON vẫn ở `content/`. Nếu chạy song song với bản PHP,
  nhớ đồng bộ hai thư mục này (hoặc chỉ dùng một bản).
- Trang quản trị chuyển 1:1 (cùng giao diện, cùng cách lưu). Khi lưu bị lỗi, trang báo lỗi nhưng không giữ lại dữ liệu vừa gõ như bản PHP.
- Chuyển ảnh sang WebP dùng thư viện `sharp` (tự cài cùng `npm install`); video → WebM vẫn cần `ffmpeg` (đặt `FFMPEG_PATH` nếu không nằm trong PATH).
- Hệ thống dịch: trang được dịch ngay khi render phía server; nút "Quét / Tự động dịch" trong admin vẫn hoạt động như cũ.

## Cấu trúc
| Thư mục | Nội dung |
|---|---|
| `app/` | Các trang (mỗi thư mục = 1 URL), `app/admin` trang quản trị, `app/api` API form |
| `components/site` | Header, footer, khung trang + bộ dịch (`PageShell`) |
| `components/*` | Hành vi phía trình duyệt của từng trang (client component) |
| `lib/` | MySQL, đọc/ghi dữ liệu (`lib/stores`), đa quốc gia (`lib/i18n`), báo lead, admin (`lib/admin`) |
| `content/` | Dữ liệu JSON + bản dịch (giữ nguyên định dạng cũ) |
| `public/` | Ảnh, favicon, script trang admin |
