/** Dữ liệu cố định của hệ thống Đa Quốc Gia (port từ i18n.php) — dùng được ở cả server lẫn client */

export const LANGS: Record<string, string> = {
  vi: 'Tiếng Việt', en: 'English', ja: '日本語', ko: '한국어', 'zh-TW': '繁體中文',
  'zh-CN': '简体中文', th: 'ไทย', lo: 'ລາວ', pt: 'Português',
};

/** [tên (tiếng Việt, sẽ được dịch), ngôn ngữ, mã vùng, khu vực, placeholder SĐT, lời chào mặc định] */
export type CountryInfo = [string, string, string, 'asia' | 'west', string, string];

export const COUNTRIES: Record<string, CountryInfo> = {
  VN: ['Việt Nam', 'vi', '+84', 'asia', '09xx xxx xxx hoặc +66 912 345 678', ''],
  US: ['Mỹ', 'en', '+1', 'west', '+1 202 555 0123', 'Welcome! We safely ship your dog or cat to the United States.'],
  CA: ['Canada', 'en', '+1', 'west', '+1 416 555 0123', 'Welcome! We safely ship your dog or cat to Canada.'],
  EU: ['Châu Âu', 'en', '+33', 'west', '+33 6 12 34 56 78', 'Welcome! We safely ship your dog or cat to Europe.'],
  AU: ['Úc', 'en', '+61', 'west', '+61 412 345 678', 'Welcome! We safely ship your dog or cat to Australia.'],
  SG: ['Singapore', 'en', '+65', 'asia', '+65 8123 4567', 'Welcome! We safely ship your dog or cat to Singapore.'],
  PH: ['Philippines', 'en', '+63', 'asia', '+63 917 123 4567', 'Welcome! We safely ship your dog or cat to the Philippines.'],
  JP: ['Nhật Bản', 'ja', '+81', 'asia', '+81 90 1234 5678', 'ようこそ！大切な犬・猫を日本へ安全にお届けします。'],
  KR: ['Hàn Quốc', 'ko', '+82', 'asia', '+82 10 1234 5678', '환영합니다! 반려견·반려묘를 한국으로 안전하게 운송합니다.'],
  TW: ['Đài Loan', 'zh-TW', '+886', 'asia', '+886 912 345 678', '歡迎！我們安全運送您的毛孩前往台灣。'],
  CN: ['Trung Quốc', 'zh-CN', '+86', 'asia', '+86 138 0013 8000', '欢迎！我们安全运送您的宠物前往中国。'],
  TH: ['Thái Lan', 'th', '+66', 'asia', '+66 81 234 5678', 'ยินดีต้อนรับ! เราขนส่งสุนัขและแมวของคุณไปประเทศไทยอย่างปลอดภัย'],
  LA: ['Lào', 'lo', '+856', 'asia', '+856 20 5555 1234', 'ຍິນດີຕ້ອນຮັບ! ພວກເຮົາຂົນສົ່ງໝາ ແລະ ແມວຂອງທ່ານໄປລາວຢ່າງປອດໄພ'],
  BR: ['Brazil', 'pt', '+55', 'west', '+55 11 91234-5678', 'Bem-vindo! Transportamos seu cão ou gato com segurança para o Brasil.'],
};

export const VN_PLACEHOLDER = '09xx xxx xxx hoặc +66 912 345 678';

/** Câu chữ dùng trong JavaScript / thông báo máy chủ (không nằm trong HTML) — luôn được dịch kèm. */
export const EXTRA_PHRASES = [
  'Vui lòng nhập họ và tên.', 'Vui lòng nhập số điện thoại.', 'Vui lòng nhập số điện thoại / Zalo.',
  'Vui lòng nhập số điện thoại / Zalo / WhatsApp.',
  'Số điện thoại không hợp lệ. Số quốc tế cần bắt đầu bằng + và mã quốc gia (vd: +66912345678).',
  'Gửi yêu cầu thành công!', 'Gửi yêu cầu thành công.',
  'Gửi yêu cầu thành công! CHUNORA PET sẽ liên hệ với bạn sớm nhất.',
  'Chưa gửi được, vui lòng thử lại hoặc gọi hotline.', 'Máy chủ phản hồi lỗi. Vui lòng thử lại hoặc gọi hotline.',
  'Không kết nối được máy chủ. Vui lòng thử lại hoặc gọi hotline.', 'Đang gửi...', 'Gửi thất bại. Vui lòng thử lại.',
  'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.', 'Hệ thống đang gặp sự cố, vui lòng thử lại sau hoặc gọi hotline.',
  'Phiên gửi biểu mẫu đã hết hạn. Vui lòng tải lại trang và thử lại.', 'Kênh nhận tư vấn không hợp lệ. Vui lòng chọn lại.',
  'Dịch vụ không hợp lệ. Vui lòng chọn lại.', 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.',
  'Hệ thống chưa nhận được yêu cầu. Vui lòng thử lại sau hoặc gọi hotline.', 'Dữ liệu gửi lên không hợp lệ.',
  'Số Zalo hoặc link Zalo', 'Username hoặc link Telegram', 'Số WhatsApp (kèm mã quốc gia)', 'Link Facebook của bạn',
  'Username hoặc link Instagram', 'Vui lòng nhập link hoặc số điện thoại Zalo của bạn.',
  'Vui lòng nhập link hoặc số điện thoại Telegram của bạn.', 'Vui lòng nhập link hoặc số điện thoại WhatsApp của bạn.',
  'Vui lòng nhập link hoặc số điện thoại Facebook của bạn.', 'Vui lòng nhập link hoặc số điện thoại Instagram của bạn.',
  'Đóng', 'Lên đầu trang', 'Mở menu', 'Đóng menu', 'Chọn quốc gia & ngôn ngữ', 'Châu Á', 'Châu Mỹ · Châu Âu · Úc',
  'Chat với chúng tôi', 'Gọi ngay',
];

export const VI_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
export const hasVi = (s: string) => VI_CHARS.test(s);
export const norm = (s: string) => s.replace(/\s+/gu, ' ').trim();
