import 'server-only';
import { readContentJson, writeContentJson } from '../json-file';
import { cleanText, cleanSrc } from '../text';

/**
 * Port transport-store.php — dữ liệu trang "Vận chuyển đa quốc gia" (/van-chuyen-quoc-te).
 * Lưu tại content/transport_service_data.json. Chưa có file thì dùng nội dung mặc định.
 * Admin: "Nội dung navbar" → "Quản lý Vận Chuyển".
 */
export const TRANSPORT_FILE = 'transport_service_data.json';

export interface TransportTextItem { title: string; desc: string }
export interface TransportImage { src: string; alt: string }
export interface TransportData {
  hero: { badge: string; title: string; desc: string; image: string; cta_primary: string; cta_secondary: string };
  pillars: TransportTextItem[];
  journey: { title: string; desc: string; steps: TransportTextItem[] };
  routes: {
    title: string;
    desc: string;
    intl_title: string;
    intl_desc: string;
    intl: string[];
    domestic_title: string;
    domestic_desc: string;
    domestic: string[];
  };
  gallery: { title: string; desc: string; images: TransportImage[] };
  quote: { title: string; desc: string; hotline: string; zalo: string; submit: string };
}

export function transportDefaults(): TransportData {
  return {
    hero: {
      badge: 'Vận chuyển thú cưng',
      title: 'Vận chuyển đa quốc gia',
      desc: 'Đưa thú cưng đi trong nước và quốc tế an toàn, với lồng đạt chuẩn và quy trình theo dõi suốt hành trình.',
      image: '',
      cta_primary: 'Nhận báo giá vận chuyển',
      cta_secondary: 'Tư vấn Zalo / Hotline',
    },
    pillars: [
      { title: 'Giấy tờ, kiểm dịch xuất nhập cảnh', desc: 'Hỗ trợ trọn gói hồ sơ thú y và sổ tiêm phòng.\nGắn chip ISO và xét nghiệm kháng thể dại (Rabies Titer Test).\nGiấy phép xuất nhập cảnh và thông quan tại sân bay.' },
      { title: 'Tư vấn tuyến bay và lồng vận chuyển', desc: 'Chọn hãng bay thân thiện, tối ưu chặng bay ngắn nhất (In-cabin, hành lý ký gửi hoặc Cargo).\nChuẩn bị lồng đạt chuẩn IATA, thoáng khí 4 chiều, đúng kích thước.' },
      { title: 'Cập nhật tình trạng bé trong hành trình', desc: 'Gửi hình ảnh, video thực tế của bé tại mọi điểm chạm: trước giờ bay, check-in, quá cảnh và khi hạ cánh.\nTheo dõi chuyến bay 24/7.' },
    ],
    journey: {
      title: 'Hành trình của bé',
      desc: 'Từ lúc bạn liên hệ đến khi bé về tận tay, mọi chặng đều được theo sát.',
      steps: [
        { title: 'Tư vấn & Báo giá', desc: 'Trao đổi điểm đến, thời gian bay và tình trạng của bé để báo giá rõ ràng.' },
        { title: 'Chuẩn bị hồ sơ & Kiểm dịch', desc: 'Hoàn tất tiêm phòng, chip, xét nghiệm và giấy phép theo quy định nước đến.' },
        { title: 'Vận chuyển an toàn với lồng chuẩn IATA', desc: 'Bé được đóng lồng đạt chuẩn, check-in và theo dõi suốt chuyến bay.' },
        { title: 'Đón bé & Bàn giao tận tay', desc: 'Làm thủ tục thông quan, đón bé và bàn giao cho chủ nuôi tại điểm hẹn.' },
      ],
    },
    routes: {
      title: 'Phạm vi tuyến bay',
      desc: 'CHUNORA PET đồng hành cùng bé trên nhiều tuyến phổ biến.',
      intl_title: 'Tuyến Quốc tế',
      intl_desc: 'Hồ sơ và kiểm dịch được hướng dẫn riêng theo quy định của từng nước.',
      intl: ['Mỹ', 'Canada', 'Châu Âu', 'Úc', 'Nhật Bản', 'Hàn Quốc', 'Singapore', 'Thái Lan'],
      domestic_title: 'Tuyến Nội địa',
      domestic_desc: 'Vận chuyển giữa các thành phố lớn, có thể gửi theo chuyến bay trong ngày.',
      domestic: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Cần Thơ'],
    },
    gallery: {
      title: 'Hình ảnh thực tế tại sân bay',
      desc: 'Các kiện lồng đạt chuẩn do CHUNORA PET chuẩn bị.',
      images: [],
    },
    quote: {
      title: 'Nhận báo giá vận chuyển',
      desc: 'Để lại thông tin, CHUNORA PET sẽ liên hệ báo giá chi tiết cho bạn sớm nhất.',
      hotline: '',
      zalo: '',
      submit: 'Gửi Yêu Cầu Báo Giá',
    },
  };
}

/** Chuỗi "rỗng" theo PHP (toán tử ?:): '' hoặc '0'. */
const phpEmpty = (s: string) => s === '' || s === '0';

/** Đối tượng/mảng PHP (is_array) — JSON object hoặc array. */
const isArr = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object';
const has = (o: Record<string, any>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Danh sách chữ: bỏ rỗng / trùng, tối đa $max mục, mỗi mục tối đa $len ký tự. */
export function transportCleanList(rows: unknown, max: number, len: number): string[] {
  const out: string[] = [];
  const list = isArr(rows) ? Object.values(rows) : [];
  for (const r of list) {
    const s = cleanText(r, len);
    if (s !== '' && !out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Hotline: chỉ giữ số và + ( ) khoảng trắng . - */
export function transportCleanHotline(v: unknown): string {
  return cleanText(v, 30).replace(/[^0-9+()\s.\-]/g, '');
}

/** Zalo: số điện thoại hoặc link http(s). Sai → ''. */
export function transportCleanZalo(v: unknown): string {
  const z = cleanText(v, 120);
  return /^https?:\/\/[^\s"'<>]+$/i.test(z) || /^[0-9+\s.\-]{6,20}$/.test(z) ? z : '';
}

/** Chuẩn hoá dữ liệu bất kỳ về đúng cấu trúc (phần thiếu lấy mặc định). */
export function transportNormalize(input: unknown): TransportData {
  const d = transportDefaults();
  const inp: Record<string, any> = isArr(input) ? input : {};
  const sec = (k: string): Record<string, any> => (isArr(inp[k]) ? inp[k] : {});
  const t = (src: Record<string, any>, k: string, max: number, def: string, multi = false): string =>
    has(src, k) ? cleanText(src[k], max, multi) : def;
  const out = transportDefaults();

  const h = sec('hero');
  out.hero.badge = t(h, 'badge', 60, d.hero.badge);
  out.hero.title = t(h, 'title', 160, d.hero.title);
  out.hero.desc = t(h, 'desc', 600, d.hero.desc, true);
  out.hero.image = cleanSrc(h.image ?? '');
  out.hero.cta_primary = t(h, 'cta_primary', 60, d.hero.cta_primary);
  out.hero.cta_secondary = t(h, 'cta_secondary', 60, d.hero.cta_secondary);

  // 3 trụ cột cố định (icon cố định theo vị trí)
  const p = sec('pillars');
  for (const i of [0, 1, 2]) {
    const row = isArr(p[i]) ? (p[i] as Record<string, any>) : null;
    if (row !== null) {
      const title = cleanText(row.title ?? '', 120);
      out.pillars[i] = {
        title: phpEmpty(title) ? d.pillars[i].title : title,
        desc: cleanText(row.desc ?? '', 1200, true),
      };
    }
  }

  const j = sec('journey');
  out.journey.title = t(j, 'title', 160, d.journey.title);
  out.journey.desc = t(j, 'desc', 400, d.journey.desc, true);
  if (has(j, 'steps')) {
    const steps: TransportTextItem[] = [];
    for (const s of isArr(j.steps) ? Object.values(j.steps) : []) {
      if (!isArr(s)) continue;
      const row = { title: cleanText(s.title ?? '', 120), desc: cleanText(s.desc ?? '', 400, true) };
      if (row.title !== '' || row.desc !== '') steps.push(row);
      if (steps.length >= 8) break;
    }
    out.journey.steps = steps.length ? steps : d.journey.steps;
  }

  const r = sec('routes');
  const singles: Array<['title' | 'intl_title' | 'domestic_title', number]> = [['title', 160], ['intl_title', 100], ['domestic_title', 100]];
  for (const [k, m] of singles) out.routes[k] = t(r, k, m, d.routes[k]);
  const multis: Array<['desc' | 'intl_desc' | 'domestic_desc', number]> = [['desc', 400], ['intl_desc', 400], ['domestic_desc', 400]];
  for (const [k, m] of multis) out.routes[k] = t(r, k, m, d.routes[k], true);
  for (const k of ['intl', 'domestic'] as const) {
    if (has(r, k)) out.routes[k] = transportCleanList(r[k], 40, 60);
  }

  const g = sec('gallery');
  out.gallery.title = t(g, 'title', 160, d.gallery.title);
  out.gallery.desc = t(g, 'desc', 400, d.gallery.desc, true);
  const imgs: TransportImage[] = [];
  for (const im of isArr(g.images) ? Object.values(g.images) : []) {
    const src = cleanSrc(isArr(im) ? im.src ?? '' : im);
    if (src !== '') imgs.push({ src, alt: cleanText(isArr(im) ? im.alt ?? '' : '', 160) });
    if (imgs.length >= 24) break;
  }
  out.gallery.images = imgs;

  const q = sec('quote');
  out.quote.title = t(q, 'title', 160, d.quote.title);
  out.quote.desc = t(q, 'desc', 400, d.quote.desc, true);
  out.quote.submit = t(q, 'submit', 60, d.quote.submit);
  out.quote.hotline = transportCleanHotline(q.hotline ?? '');
  // Zalo: số điện thoại hoặc link zalo.me
  out.quote.zalo = transportCleanZalo(q.zalo ?? '');
  return out;
}

/** Đọc dữ liệu + cho biết có đọc từ file không (tham số &$fromFile của PHP). */
export function transportLoadInfo(): { data: TransportData; fromFile: boolean } {
  const raw = readContentJson(TRANSPORT_FILE);
  if (isArr(raw)) return { data: transportNormalize(raw), fromFile: true };
  return { data: transportDefaults(), fromFile: false };
}

export function transportLoad(): TransportData {
  return transportLoadInfo().data;
}

export function transportSave(data: unknown): boolean {
  return writeContentJson(TRANSPORT_FILE, transportNormalize(data));
}
