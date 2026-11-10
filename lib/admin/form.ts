/**
 * Đọc FormData theo kiểu PHP: name="a[b][]" → $_POST['a']['b'][] ; file → $_FILES (lá là File).
 * Ô chọn tệp để trống (size 0, không tên) được bỏ qua (tương đương UPLOAD_ERR_NO_FILE).
 */
export type PhpValue = string | File | PhpObject;
export interface PhpObject { [k: string]: PhpValue }

const ORDER = Symbol('order');
/** Giữ thứ tự khoá như PHP (object JS tự sắp khoá số tăng dần) */
function track(o: PhpObject, key: string) {
  const anyO = o as any;
  if (!anyO[ORDER]) Object.defineProperty(o, ORDER, { value: [] as string[], enumerable: false });
  if (!anyO[ORDER].includes(key)) anyO[ORDER].push(key);
}
/** Danh sách khoá theo thứ tự gửi lên */
export function keysOf(o: unknown): string[] {
  if (!isObj(o)) return [];
  return ((o as any)[ORDER] as string[] | undefined) ?? Object.keys(o);
}

function setPath(root: PhpObject, keys: string[], value: PhpValue) {
  let cur: PhpObject = root;
  keys.forEach((k, i) => {
    const last = i === keys.length - 1;
    let key = k;
    if (key === '') {
      const n = Object.keys(cur).filter((x) => /^\d+$/.test(x)).map(Number);
      key = String(n.length ? Math.max(...n) + 1 : 0);
    }
    track(cur, key);
    if (last) cur[key] = value;
    else {
      if (typeof cur[key] !== 'object' || cur[key] instanceof File) cur[key] = {};
      cur = cur[key] as PhpObject;
    }
  });
}

export function parsePhpForm(fd: FormData): { post: PhpObject; files: PhpObject } {
  const post: PhpObject = {};
  const files: PhpObject = {};
  for (const [name, value] of fd.entries()) {
    const m = name.match(/^([^[]+)((?:\[[^\]]*\])*)$/);
    const keys = m ? [m[1], ...[...m[2].matchAll(/\[([^\]]*)\]/g)].map((x) => x[1])] : [name];
    if (typeof value === 'string') setPath(post, keys, value);
    else if (value.size > 0 || value.name) setPath(files, keys, value);
  }
  return { post, files };
}

/** Lấy giá trị lồng nhau; không có → undefined */
export function pick(o: unknown, ...keys: (string | number)[]): any {
  let cur: any = o;
  for (const k of keys) {
    if (cur === null || typeof cur !== 'object' || cur instanceof File) return undefined;
    cur = cur[String(k)];
  }
  return cur;
}

export const str = (v: unknown): string => (typeof v === 'string' ? v : '');
export const isObj = (v: unknown): v is PhpObject => !!v && typeof v === 'object' && !(v instanceof File);
/** Mảng PHP (object có khoá) → mảng giá trị theo thứ tự khoá như foreach của PHP */
export const values = (v: unknown): PhpValue[] => (isObj(v) ? keysOf(v).map((k) => v[k]) : []);
/** [khoá, giá trị] theo thứ tự gửi lên (foreach ($arr as $k => $v)) */
export const entries = (v: unknown): [string, PhpValue][] => (isObj(v) ? keysOf(v).map((k) => [k, v[k]] as [string, PhpValue]) : []);
/** File tại đường dẫn (bỏ qua ô trống) */
export const fileAt = (files: PhpObject, ...keys: (string | number)[]): File | null => {
  const f = pick(files, ...keys);
  return f instanceof File && f.size > 0 ? f : null;
};
