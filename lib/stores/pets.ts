import 'server-only';
import type { RowDataPacket } from 'mysql2/promise';
import { db } from '../db';
import { readContentJson } from '../json-file';
import { cleanSrc, cleanText } from '../text';

/**
 * Port pets-store.php — Dữ liệu trang "Mua bán chó mèo" (các thẻ pet + trang chi tiết).
 * Lưu trong MySQL: bảng site_content, dòng id = 2 (không đụng tới nội dung trang chủ id = 1).
 * Lần đầu chưa có dữ liệu thì lấy mẫu từ content/mua-ban.json.
 *
 * Mỗi pet: type (cho|meo), slug, image (ảnh thẻ), breed (giống), name (tên), identity (nhận diện),
 *          price (giá), media[] (ảnh/video/YouTube cho trang chi tiết), description (mô tả SEO),
 *          seo_title, seo_description.
 * (Bảng site_content được tạo trong lib/db.ts → createPool.)
 */
export const PETS_ROW_ID = 2;
export const PETS_SEED_FILE = 'mua-ban.json';

export type PetType = 'cho' | 'meo';
export type PetMediaKind = 'image' | 'video' | 'youtube';
export interface PetMedia { src: string; kind: PetMediaKind }
export interface Pet {
  type: PetType;
  slug: string;
  image: string;
  breed: string;
  name: string;
  identity: string;
  price: string;
  media: PetMedia[];
  description: string;
  seo_title: string;
  seo_description: string;
}

/** pets_clean_text */
export const petsCleanText = (value: unknown, max: number, multiline = false): string => cleanText(value, max, multiline);

/** pets_clean_src — Ảnh/video: đường dẫn trong site (images/...) hoặc http(s). Sai định dạng → ''. */
export const petsCleanSrc = (value: unknown): string => cleanSrc(value);

/** pets_youtube_id */
export function petsYoutubeId(url: string): string {
  const m = /(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : '';
}

/** pets_media_kind — Loại media: image | video | youtube (nhúng). */
export function petsMediaKind(src: string): PetMediaKind {
  if (petsYoutubeId(src) !== '') return 'youtube';
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src)) return 'video';
  return 'image';
}

const VN_MAP: Record<string, string> = {
  'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
  'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
  'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
  'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
  'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
  'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y','đ':'d',
};

/** pets_slugify — Tạo slug không dấu từ tiếng Việt. */
export function petsSlugify(text: string): string {
  let t = String(text).toLowerCase();
  t = Array.from(t).map((ch) => VN_MAP[ch] ?? ch).join('');
  t = t.replace(/[^a-z0-9]+/g, '-');
  t = t.replace(/^-+|-+$/g, '');
  return t.slice(0, 70).replace(/^-+|-+$/g, '');
}

/** pets_normalize_media */
export function petsNormalizeMedia(raw: unknown): PetMedia[] {
  const out: PetMedia[] = [];
  const list: unknown[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
  for (const m of list) {
    const src = petsCleanSrc(m && typeof m === 'object' ? (m as Record<string, unknown>).src ?? '' : m);
    if (src !== '') out.push({ src, kind: petsMediaKind(src) });
  }
  return out.slice(0, 30);
}

/** pets_normalize_one */
export function petsNormalizeOne(raw: unknown): Pet {
  const r: Record<string, unknown> = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const name = petsCleanText(r.name ?? '', 100);
  const slug = petsSlugify(petsCleanText(r.slug ?? '', 80));
  return {
    type: (r.type ?? '') === 'meo' ? 'meo' : 'cho',
    slug,
    image: petsCleanSrc(r.image ?? ''),
    breed: petsCleanText(r.breed ?? '', 80),
    name,
    identity: petsCleanText(r.identity ?? '', 200),
    price: petsCleanText(r.price ?? '', 60),
    media: petsNormalizeMedia(r.media ?? []),
    description: petsCleanText(r.description ?? '', 20000, true),
    seo_title: petsCleanText(r.seo_title ?? '', 120),
    seo_description: petsCleanText(r.seo_description ?? '', 300),
  };
}

/** pets_ensure_slugs — Đảm bảo mỗi pet có slug riêng, không trùng. Slug trống → từ tên (hoặc giống). */
export function petsEnsureSlugs(pets: Pet[]): Pet[] {
  const used = new Set<string>();
  return pets.map((p) => {
    let base = p.slug !== '' ? p.slug : petsSlugify(p.name !== '' ? p.name : p.breed);
    if (base === '') base = 'pet';
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = base + '-' + n++;
    used.add(slug);
    return { ...p, slug };
  });
}

/** pets_seed — Dữ liệu mẫu ban đầu từ content/mua-ban.json (cấu trúc cũ: cho[] / meo[]). */
export function petsSeed(): Pet[] {
  const d = readContentJson(PETS_SEED_FILE);
  const out: Pet[] = [];
  if (d && typeof d === 'object') {
    for (const type of ['cho', 'meo'] as const) {
      const v = (d as Record<string, unknown>)[type];
      const list: unknown[] = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : v == null ? [] : [v];
      for (const p of list) {
        if (!p || typeof p !== 'object') continue;
        const q = p as Record<string, unknown>;
        const str = (x: unknown) => (x == null ? '' : typeof x === 'object' ? '' : String(x));
        const identity =
          q.identity != null
            ? q.identity
            : (str(q.coat) + (q.coat != null && q.color != null ? ' · ' : '') + str(q.color)).trim();
        out.push(
          petsNormalizeOne({
            type, image: q.image ?? '', breed: q.breed ?? '',
            name: q.name ?? '', identity, price: q.price ?? '',
          }),
        );
      }
    }
  }
  return petsEnsureSlugs(out);
}

/**
 * pets_load — Đọc danh sách pet. out.fromDb = true nếu đã có dữ liệu trong MySQL.
 * Lỗi kết nối MySQL → ném lỗi (giống PHP); trang công khai dùng petsLoadSafe().
 */
export async function petsLoad(out?: { fromDb: boolean }): Promise<Pet[]> {
  if (out) out.fromDb = false;
  const [rows] = await (await db()).query<RowDataPacket[]>('SELECT content_json FROM site_content WHERE id = ' + PETS_ROW_ID);
  const raw: unknown = rows.length ? rows[0].content_json : undefined;
  if (typeof raw === 'string' || Buffer.isBuffer(raw)) {
    let d: unknown = null;
    try {
      d = JSON.parse(String(raw));
    } catch {
      d = null;
    }
    if (d && typeof d === 'object' && 'pets' in d) {
      const pets = (d as { pets: unknown }).pets;
      if (pets && typeof pets === 'object') {
        if (out) out.fromDb = true;
        const list: unknown[] = Array.isArray(pets) ? pets : Object.values(pets);
        return petsEnsureSlugs(list.map((p) => petsNormalizeOne(p && typeof p === 'object' ? p : {})));
      }
    }
  }
  return petsSeed();
}

/** pets_load_safe — Đọc cho trang công khai: lỗi DB thì dùng dữ liệu mẫu, không làm hỏng trang. */
export async function petsLoadSafe(): Promise<Pet[]> {
  try {
    return await petsLoad();
  } catch {
    return petsSeed();
  }
}

/** pets_find */
export async function petsFind(slug: string): Promise<Pet | null> {
  for (const p of await petsLoadSafe()) if (p.slug === slug) return p;
  return null;
}

/** pets_save */
export async function petsSave(pets: unknown[]): Promise<void> {
  const clean = petsEnsureSlugs(pets.map((p) => petsNormalizeOne(p && typeof p === 'object' ? p : {})));
  const json = JSON.stringify({ pets: clean }, null, 4);
  const pool = await db();
  const [rows] = await pool.query<RowDataPacket[]>('SELECT 1 FROM site_content WHERE id = ' + PETS_ROW_ID);
  if (rows.length === 0) {
    await pool.query('INSERT INTO site_content (id, content_json) VALUES (' + PETS_ROW_ID + ', ?)', [json]);
  } else {
    await pool.query('UPDATE site_content SET content_json = ? WHERE id = ' + PETS_ROW_ID, [json]);
  }
}

/* ===== Hỗ trợ trang chi tiết (port phần dữ liệu đầu mua-ban/chi-tiet/index.php) ===== */

export interface PetGalleryItem { kind: PetMediaKind; url: string; thumb: string }

/**
 * Danh sách media hiển thị: ảnh thẻ trước, rồi các ảnh/video thêm vào trang chi tiết (bỏ trùng).
 * resolve(src) = URL ảnh/video trong site ('' nếu file không tồn tại) — truyền imgUrl từ @/lib/json-file.
 */
export function petsGalleryItems(pet: Pet, resolve: (src: string) => string): PetGalleryItem[] {
  const items: PetGalleryItem[] = [];
  const seen = new Set<string>();
  const all: PetMedia[] = [];
  if (pet.image !== '') all.push({ src: pet.image, kind: 'image' });
  for (const m of pet.media) all.push(m);
  for (const m of all) {
    if (seen.has(m.src)) continue;
    seen.add(m.src);
    if (m.kind === 'youtube') {
      const id = petsYoutubeId(m.src);
      items.push({ kind: 'youtube', url: 'https://www.youtube-nocookie.com/embed/' + id, thumb: 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' });
      continue;
    }
    const u = resolve(m.src);
    if (u !== '') items.push({ kind: m.kind, url: u, thumb: u });
  }
  return items;
}
