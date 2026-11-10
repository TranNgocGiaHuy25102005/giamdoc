import 'server-only';
import { readContentJson, writeContentJson } from '../json-file';

/**
 * Port care-store.php — Dữ liệu trang "Chăm sóc tại store" (/cham-soc-tai-store).
 * Lưu tại content/care_service_data.json. Chưa có file thì dùng nội dung mặc định bên dưới.
 * Admin: /admin/ → "Nội dung navbar" → "Quản lý Chăm Sóc Store".
 */
export const CARE_FILE = 'care_service_data.json';

export interface CareItem { image: string; title: string; desc: string }
export interface CarePrice { name: string; weight: string; price: string }
export interface CareGalleryImage { src: string; alt: string }

export interface CareData {
  spa: { badge: string; title: string; desc: string; image: string; steps: CareItem[]; cta: string };
  hotel: { badge: string; title: string; desc: string; image: string; features: CareItem[]; cta: string };
  pricing: {
    title: string;
    desc: string;
    spa_tab: string;
    hotel_tab: string;
    note: string;
    spa: CarePrice[];
    hotel: CarePrice[];
  };
  gallery: { title: string; images: CareGalleryImage[] };
  booking: { title: string; desc: string; hotline: string; submit: string; services: string[] };
}

/** care_text(): is_scalar → chuỗi, bỏ ký tự điều khiển, trim, cắt theo số ký tự (mb_substr). */
export function careText(v: unknown, max: number, multi = false): string {
  let s = '';
  if (typeof v === 'string') s = v;
  else if (typeof v === 'number') s = Number.isFinite(v) ? String(v) : '';
  else if (typeof v === 'boolean') s = v ? '1' : ''; // (string) true === "1" trong PHP
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(multi ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g : /[\x00-\x1F\x7F]/g, '');
  return Array.from(s.trim()).slice(0, max).join('');
}

/** care_src(): ảnh images/... hoặc http(s). Sai định dạng → ''. */
export function careSrc(v: unknown): string {
  const s = careText(v, 400);
  if (/^https?:\/\/[^\s"'<>]+$/i.test(s)) return s;
  if (/^images\/[A-Za-z0-9_\-./]+$/.test(s) && !s.includes('..')) return s;
  return '';
}

export function careDefaults(): CareData {
  return {
    spa: {
      badge: 'SPA & GROOMING',
      title: 'Spa, tắm sấy & cắt tỉa tạo kiểu',
      desc: 'Mỗi bé được chăm chút bởi groomer có kinh nghiệm trong không gian sạch sẽ, yên tĩnh. Chúng tôi dùng sản phẩm dịu nhẹ phù hợp từng loại lông và da.',
      image: '',
      steps: [
        { image: '', title: 'Tắm dưỡng', desc: 'Sữa tắm dịu nhẹ theo loại lông, massage thư giãn và xả sạch kỹ.' },
        { image: '', title: 'Sấy tơi', desc: 'Sấy khô từng lớp lông, chải tơi mượt, tránh nóng và bết rối.' },
        { image: '', title: 'Vệ sinh móng & tai', desc: 'Cắt dũa móng, làm sạch tai, vệ sinh vùng mắt và tuyến hôi.' },
        { image: '', title: 'Cắt tỉa tạo kiểu', desc: 'Tỉa gọn theo giống và mong muốn của chủ, giữ bé thoải mái suốt buổi.' },
      ],
      cta: 'Đặt lịch Spa',
    },
    hotel: {
      badge: 'KHÁCH SẠN VIP',
      title: 'Khách sạn lưu trú VIP cho thú cưng',
      desc: 'Khi bạn đi công tác hoặc du lịch, các bé có một căn phòng riêng an toàn, yên tĩnh và được chăm sóc như ở nhà.',
      image: '',
      features: [
        { image: '', title: 'Phòng cách âm', desc: 'Từng phòng riêng, cách âm tốt, giúp bé ngủ ngon và ít căng thẳng.' },
        { image: '', title: 'Điều hòa lọc khí 24/7', desc: 'Không khí sạch, nhiệt độ ổn định suốt ngày đêm.' },
        { image: '', title: 'Camera riêng từng phòng', desc: 'Chủ nuôi theo dõi bé trực tiếp bất cứ lúc nào qua điện thoại.' },
        { image: '', title: 'Ăn uống theo yêu cầu', desc: 'Giữ đúng khẩu phần, loại thức ăn và giờ ăn quen thuộc của bé.' },
      ],
      cta: 'Đặt phòng VIP',
    },
    pricing: {
      title: 'Bảng giá dịch vụ minh bạch',
      desc: 'Giá theo hạng cân, đã gồm sản phẩm chăm sóc. Giá có thể thay đổi nhẹ tùy tình trạng lông và da của bé.',
      spa_tab: 'Bảng giá Spa & Grooming',
      hotel_tab: 'Bảng giá Khách sạn VIP',
      note: '* Giá tham khảo, chưa gồm phụ thu (lông rối nặng, bé khó tính…). Liên hệ để được báo giá chính xác.',
      spa: [
        { name: 'Tắm sấy cơ bản', weight: 'Dưới 5 kg', price: '150.000đ' },
        { name: 'Tắm sấy cơ bản', weight: '5 – 10 kg', price: '220.000đ' },
        { name: 'Tắm sấy cơ bản', weight: 'Trên 10 kg', price: '300.000đ' },
        { name: 'Spa & cắt tỉa tạo kiểu', weight: 'Dưới 5 kg', price: '300.000đ' },
        { name: 'Spa & cắt tỉa tạo kiểu', weight: '5 – 10 kg', price: '420.000đ' },
        { name: 'Spa & cắt tỉa tạo kiểu', weight: 'Trên 10 kg', price: '550.000đ' },
      ],
      hotel: [
        { name: 'Phòng VIP tiêu chuẩn / đêm', weight: 'Dưới 5 kg', price: '180.000đ' },
        { name: 'Phòng VIP tiêu chuẩn / đêm', weight: '5 – 10 kg', price: '250.000đ' },
        { name: 'Phòng VIP tiêu chuẩn / đêm', weight: 'Trên 10 kg', price: '350.000đ' },
        { name: 'Phòng VIP camera riêng / đêm', weight: 'Mọi hạng cân', price: 'Liên hệ' },
      ],
    },
    gallery: {
      title: 'Không gian store',
      images: [],
    },
    booking: {
      title: 'Đặt lịch hẹn trực tuyến',
      desc: 'Để lại thông tin, CHUNORA PET sẽ gọi xác nhận lịch cho bạn sớm nhất.',
      hotline: '',
      submit: 'Gửi yêu cầu đặt lịch',
      services: ['Spa & Grooming', 'Tắm sấy', 'Cắt tỉa tạo kiểu', 'Khách sạn lưu trú VIP'],
    },
  };
}

type Obj = Record<string, unknown>;
/** is_array() của PHP: mảng JSON hoặc object JSON (mảng kết hợp). */
const isArr = (x: unknown): x is Obj => !!x && typeof x === 'object';
/** foreach (is_array($rows) ? $rows : [] as $r) */
const rowsOf = (x: unknown): unknown[] => (Array.isArray(x) ? x : isArr(x) ? Object.values(x) : []);
const has = (o: Obj, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** care_clean_pairs(): danh sách cặp 2 khoá (ka, kb) — giữ cho admin dùng lại. */
export function careCleanPairs(rows: unknown, maxRows: number, maxA: number, maxB: number, ka: string, kb: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const r of rowsOf(rows)) {
    if (!isArr(r)) continue;
    const a = careText(r[ka] ?? '', maxA);
    const b = careText(r[kb] ?? '', maxB, true);
    if (a === '' && b === '') continue;
    out.push({ [ka]: a, [kb]: b });
    if (out.length >= maxRows) break;
  }
  return out;
}

/** care_clean_items(): danh sách mục có ảnh: title, desc, image. */
export function careCleanItems(rows: unknown, maxRows = 12): CareItem[] {
  const out: CareItem[] = [];
  for (const r of rowsOf(rows)) {
    if (!isArr(r)) continue;
    const row: CareItem = { image: careSrc(r.image ?? ''), title: careText(r.title ?? '', 100), desc: careText(r.desc ?? '', 400, true) };
    if (row.title === '' && row.desc === '') continue;
    out.push(row);
    if (out.length >= maxRows) break;
  }
  return out;
}

/** care_strip_num(): bỏ số thứ tự đầu huy hiệu cũ (VD "4.1 · SPA" → "SPA"). */
export function careStripNum(s: string): string {
  return s.replace(/^\d+(\.\d+)?\s*[·.\-–:]\s*/u, '').trim();
}

/** care_clean_prices() */
export function careCleanPrices(rows: unknown): CarePrice[] {
  const out: CarePrice[] = [];
  for (const r of rowsOf(rows)) {
    if (!isArr(r)) continue;
    const row: CarePrice = { name: careText(r.name ?? '', 120), weight: careText(r.weight ?? '', 60), price: careText(r.price ?? '', 60) };
    if (row.name === '' && row.price === '') continue;
    out.push(row);
    if (out.length >= 60) break;
  }
  return out;
}

/** care_normalize(): chuẩn hoá dữ liệu bất kỳ về đúng cấu trúc (phần thiếu lấy mặc định). */
export function careNormalize(input: unknown): CareData {
  const d = careDefaults();
  const inp: Obj = isArr(input) ? input : {};
  const sub = (k: string): Obj => (isArr(inp[k]) ? (inp[k] as Obj) : {});
  const sp = sub('spa'), ht = sub('hotel'), pr = sub('pricing'), ga = sub('gallery'), bk = sub('booking');

  const t = (src: Obj, k: string, max: number, multi = false): string | null => (has(src, k) ? careText(src[k], max, multi) : null);
  const pick = (v: string | null, def: string): string => (v === null ? def : v);

  const out = careDefaults();
  for (const [k, m] of [['badge', 60], ['title', 160], ['cta', 40]] as const) {
    out.spa[k] = pick(t(sp, k, m), d.spa[k]);
    out.hotel[k] = pick(t(ht, k, m), d.hotel[k]);
  }
  out.spa.badge = careStripNum(out.spa.badge);
  out.hotel.badge = careStripNum(out.hotel.badge);
  out.spa.desc = pick(t(sp, 'desc', 1200, true), d.spa.desc);
  out.hotel.desc = pick(t(ht, 'desc', 1200, true), d.hotel.desc);
  out.spa.image = careSrc(sp.image ?? '');
  out.hotel.image = careSrc(ht.image ?? '');
  out.spa.steps = has(sp, 'steps') ? careCleanItems(sp.steps) : d.spa.steps;
  out.hotel.features = has(ht, 'features') ? careCleanItems(ht.features) : d.hotel.features;

  for (const [k, m] of [['title', 160], ['spa_tab', 60], ['hotel_tab', 60]] as const) {
    out.pricing[k] = pick(t(pr, k, m), d.pricing[k]);
  }
  out.pricing.desc = pick(t(pr, 'desc', 600, true), d.pricing.desc);
  out.pricing.note = pick(t(pr, 'note', 400, true), d.pricing.note);
  out.pricing.spa = has(pr, 'spa') ? careCleanPrices(pr.spa) : d.pricing.spa;
  out.pricing.hotel = has(pr, 'hotel') ? careCleanPrices(pr.hotel) : d.pricing.hotel;

  out.gallery.title = pick(t(ga, 'title', 160), d.gallery.title);
  const imgs: CareGalleryImage[] = [];
  for (const g of isArr(ga.images) ? rowsOf(ga.images) : []) {
    const src = careSrc(isArr(g) ? (g.src ?? '') : g);
    if (src !== '') imgs.push({ src, alt: careText(isArr(g) ? (g.alt ?? '') : '', 160) });
    if (imgs.length >= 24) break;
  }
  out.gallery.images = imgs;

  out.booking.title = pick(t(bk, 'title', 160), d.booking.title);
  out.booking.desc = pick(t(bk, 'desc', 400, true), d.booking.desc);
  out.booking.submit = pick(t(bk, 'submit', 60), d.booking.submit);
  out.booking.hotline = careText(bk.hotline ?? '', 30).replace(/[^0-9+()\s.\-]/g, '');
  if (has(bk, 'services')) {
    const sv: string[] = [];
    for (const s0 of rowsOf(bk.services)) {
      const s = careText(s0, 80);
      if (s !== '' && !sv.includes(s)) sv.push(s);
    }
    const sliced = sv.slice(0, 20);
    out.booking.services = sliced.length ? sliced : d.booking.services;
  }
  return out;
}

/** care_load(): file lỗi / chưa có → mặc định. */
export function careLoad(): CareData {
  const raw = readContentJson(CARE_FILE);
  return isArr(raw) ? careNormalize(raw) : careDefaults();
}

/** Như careLoad() nhưng cho biết dữ liệu có đến từ file không (tham số &$fromFile của PHP). */
export function careLoadWithSource(): { data: CareData; fromFile: boolean } {
  const raw = readContentJson(CARE_FILE);
  return isArr(raw) ? { data: careNormalize(raw), fromFile: true } : { data: careDefaults(), fromFile: false };
}

/** care_save(): chuẩn hoá rồi ghi file. */
export function careSave(data: unknown): boolean {
  return writeContentJson(CARE_FILE, careNormalize(data));
}
