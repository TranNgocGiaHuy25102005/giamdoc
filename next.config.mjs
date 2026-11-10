/** @type {import('next').NextConfig} */
const legacy = [
  ['/index.php', '/'],
  ['/van-chuyen-quoc-te.php', '/van-chuyen-quoc-te'],
  ['/cham-soc-tai-store.php', '/cham-soc-tai-store'],
  ['/ve-chunora.php', '/ve-chunora'],
  ['/tin-tuc.php', '/tin-tuc'],
  ['/chinh-sach.php', '/chinh-sach'],
  ['/cam-on.php', '/cam-on'],
  ['/lien-he.php', '/#lien-he'],
  ['/mua-ban/index.php', '/mua-ban'],
  ['/mua-ban/chi-tiet/index.php', '/mua-ban/chi-tiet'],
  ['/admin/index.php', '/admin'],
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ảnh tải lên được lưu vào public/images/uploads khi chạy (không tối ưu qua next/image)
  images: { unoptimized: true },
  async redirects() {
    // Giữ link cũ (.php) đã được Google index / chia sẻ — chuyển hướng 301 sang URL mới
    return legacy.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async rewrites() {
    // Form cũ (không JS) vẫn POST về /contact.php, API cũ /api/send-consultation.php
    return [
      { source: '/contact.php', destination: '/api/contact' },
      { source: '/api/send-consultation.php', destination: '/api/send-consultation' },
    ];
  },
  // Dữ liệu khởi tạo + bản dịch trong content/ được đọc lúc chạy → đóng gói kèm hàm server (cần cho Vercel)
  outputFileTracingIncludes: { '/**': ['./content/**/*'] },
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
