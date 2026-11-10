import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR, PUBLIC_DIR } from './config';

/**
 * Kho dữ liệu JSON (các file trong content/).
 *
 * - Chế độ "file" (mặc định khi chạy trên máy / VPS): đọc-ghi thẳng file như bản PHP.
 * - Chế độ "mysql" (tự bật trên Vercel, hoặc CONTENT_STORE=mysql): ổ đĩa chỉ đọc nên dữ liệu được lưu trong bảng
 *   MySQL `content_files` (name → json). File trong content/ chỉ còn là dữ liệu khởi tạo khi bảng chưa có dòng đó.
 *   Hàm đọc/ghi vẫn đồng bộ (sync) nhờ bộ nhớ đệm; mỗi request gọi `await syncContent()` trước khi đọc
 *   (lấy bản mới nếu có thay đổi), và các lần ghi được đẩy lên MySQL bằng `await flushContent()`.
 */

export const DB_MODE =
  process.env.CONTENT_STORE === 'mysql' || (!!process.env.VERCEL && process.env.CONTENT_STORE !== 'file');

/* --------------------------------------------------------------- chế độ MySQL */

type Entry = { ver: number; data: unknown };
const g = globalThis as unknown as {
  __cpStore?: { cache: Map<string, Entry>; pending: Set<Promise<unknown>>; tableReady: Promise<void> | null };
};
const store = (g.__cpStore ??= { cache: new Map(), pending: new Set(), tableReady: null });

async function pool() {
  const { db } = await import('./db');
  const p = await db();
  store.tableReady ??= p
    .query(`CREATE TABLE IF NOT EXISTS content_files (
        name VARCHAR(191) NOT NULL PRIMARY KEY,
        json LONGTEXT NOT NULL,
        ver BIGINT UNSIGNED NOT NULL DEFAULT 1,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
    .then(() => undefined)
    .catch((e: unknown) => {
      store.tableReady = null;
      throw e;
    });
  await store.tableReady;
  return p;
}

/** Nạp các dòng mới/đã đổi từ MySQL vào bộ nhớ đệm. Gọi ở đầu mỗi trang / route. Chế độ file: không làm gì. */
export async function syncContent(): Promise<void> {
  if (!DB_MODE) return;
  try {
    const p = await pool();
    const [rows] = await p.query('SELECT name, ver FROM content_files');
    const changed: string[] = [];
    const seen = new Set<string>();
    for (const r of rows as { name: string; ver: number }[]) {
      seen.add(r.name);
      if (store.cache.get(r.name)?.ver !== Number(r.ver)) changed.push(r.name);
    }
    for (const k of [...store.cache.keys()]) if (!seen.has(k) && store.cache.get(k)!.ver > 0) store.cache.delete(k);
    if (changed.length) {
      const [data] = await p.query('SELECT name, json, ver FROM content_files WHERE name IN (?)', [changed]);
      for (const r of data as { name: string; json: string; ver: number }[]) {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(r.json);
        } catch {}
        store.cache.set(r.name, { ver: Number(r.ver), data: parsed });
      }
    }
  } catch (e) {
    console.error('[content] Không đọc được bảng content_files:', (e as Error).message);
  }
}

/** Chờ mọi lần ghi lên MySQL hoàn tất (gọi trước khi trả response sau khi lưu). Trả false nếu có lỗi. */
export async function flushContent(): Promise<boolean> {
  const all = [...store.pending];
  const res = await Promise.allSettled(all);
  return res.every((r) => r.status === 'fulfilled');
}

function bundled(file: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- API chung */

/** Đọc JSON trong content/ — lỗi / chưa có → null (giống @file_get_contents + json_decode). */
export function readContentJson(file: string): any | null {
  if (DB_MODE) {
    const hit = store.cache.get(file);
    if (hit) return structuredClone(hit.data);
    return bundled(file);
  }
  return bundled(file);
}

/** Như readContentJson nhưng không sao chép (chỉ dùng để ĐỌC, không sửa kết quả) */
export function readContentJsonShared(file: string): any | null {
  if (DB_MODE) {
    const hit = store.cache.get(file);
    if (hit) return hit.data;
  }
  return bundled(file);
}

/** Ghi JSON vào content/ (hoặc MySQL trên Vercel). Trả true nếu thành công (chế độ MySQL: đã nhận để ghi). */
export function writeContentJson(file: string, data: unknown): boolean {
  if (DB_MODE) {
    const json = JSON.stringify(data, null, 4);
    const cur = store.cache.get(file);
    store.cache.set(file, { ver: -1, data: JSON.parse(json) }); // ver -1: đã sửa, chờ đồng bộ
    const job = pool()
      .then((p) =>
        p.query(
          'INSERT INTO content_files (name, json) VALUES (?, ?) ON DUPLICATE KEY UPDATE json = VALUES(json), ver = ver + 1',
          [file, json],
        ),
      )
      .catch((e: unknown) => {
        console.error('[content] Ghi MySQL lỗi:', file, (e as Error).message);
        if (cur) store.cache.set(file, cur);
        else store.cache.delete(file);
        throw e;
      })
      .finally(() => store.pending.delete(job));
    store.pending.add(job);
    job.catch(() => {});
    return true;
  }
  try {
    const p = path.join(CONTENT_DIR, file);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 4), 'utf8');
    fs.renameSync(tmp, p);
    return true;
  } catch {
    return false;
  }
}

/** Có dữ liệu (đã lưu hoặc file khởi tạo) cho tên này không */
export function contentExists(file: string): boolean {
  if (DB_MODE && store.cache.has(file)) return true;
  try {
    return fs.statSync(path.join(CONTENT_DIR, file)).isFile();
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------- ảnh */

/** Ảnh tải lên được lưu trên Vercel Blob (thay cho public/images/uploads) khi có BLOB_READ_WRITE_TOKEN */
export const BLOB_UPLOADS = !!process.env.BLOB_READ_WRITE_TOKEN;

/** File ảnh tồn tại trong public/ ? (thay cho is_file($root . '/' . $path)) */
export function publicFileExists(rel: string): boolean {
  if (!rel || rel.includes('..')) return false;
  // Trên Vercel thư mục public/ nằm trên CDN, không có trong ổ đĩa của hàm server → coi như có
  if (process.env.VERCEL) return /^images\//.test(rel);
  if (BLOB_UPLOADS && rel.startsWith('images/uploads/')) return true;
  try {
    return fs.statSync(path.join(PUBLIC_DIR, rel)).isFile();
  } catch {
    return false;
  }
}

/** URL ảnh dùng trên trang: http(s) giữ nguyên; images/... → /images/... nếu file có thật, ngược lại ''. */
export function imgUrl(p: string | undefined | null): string {
  const s = String(p ?? '');
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const rel = s.replace(/^\/+/, '');
  return publicFileExists(rel) ? '/' + rel : '';
}
