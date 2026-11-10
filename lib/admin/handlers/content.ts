import 'server-only';
import { loadSiteContent, saveSiteContent } from '../../db';
import { isObj, keysOf, type PhpObject } from '../form';
import { blankListItem, IMAGE_KEYS } from '../panes/content';
import { MAX_IMAGE_UPLOAD_BYTES, storeConverted } from '../media';
import type { AdminHandler } from '../types';

/** Port merge_content(): ghép dữ liệu form vào nội dung hiện có (chỉ nhận khoá đã có, giữ kiểu) */
function mergeContent(original: any, submitted: any, seg: string[] = [], presence: any = {}): any {
  if (original === null || typeof original !== 'object' || !isObj(submitted)) return original;
  if (Array.isArray(original)) {
    const proto = original[0] ?? blankListItem(seg);
    const result: any[] = [];
    for (const k of keysOf(submitted)) {
      const item = (submitted as PhpObject)[k];
      if (proto !== null && typeof proto === 'object' && isObj(item)) result.push(mergeContent(proto, item, [...seg, String(result.length)]));
      else if ((proto === null || typeof proto !== 'object') && typeof item === 'string') result.push(item);
    }
    return result;
  }
  const out: any = { ...original };
  for (const [key, value] of Object.entries(original)) {
    if (!(key in submitted)) {
      if (Array.isArray(value) && isObj(presence) && presence[key] !== undefined) out[key] = [];
      continue;
    }
    const sub = (submitted as PhpObject)[key];
    if (value !== null && typeof value === 'object' && isObj(sub)) {
      out[key] = mergeContent(value, sub, [...seg, key], isObj(presence) && isObj(presence[key]) ? presence[key] : {});
    } else if ((value === null || typeof value !== 'object') && typeof sub === 'string') {
      out[key] = sub;
    }
  }
  return out;
}

/** Duyệt các File trong uploads[...] → [đường dẫn, File] */
function flattenUploads(files: unknown, seg: string[] = []): [string[], File][] {
  if (files instanceof File) return [[seg, files]];
  if (!isObj(files)) return [];
  return keysOf(files).flatMap((k) => flattenUploads((files as PhpObject)[k], [...seg, k]));
}

function getNested(data: any, seg: string[]): any {
  for (const s of seg) {
    if (data === null || typeof data !== 'object' || !(s in data)) return null;
    data = data[s];
  }
  return data;
}
function setNested(data: any, seg: string[], value: string): boolean {
  const [k, ...rest] = seg;
  if (k === undefined || data === null || typeof data !== 'object' || !(k in data)) return false;
  if (!rest.length) {
    data[k] = value;
    return true;
  }
  return setNested(data[k], rest, value);
}

/** Lưu nội dung trang chủ (form chính adminForm) */
export const contentHandler: AdminHandler = {
  match: () => true,
  async handle({ post, files }) {
    try {
      let content = await loadSiteContent();
      content = mergeContent(content, isObj(post.content) ? post.content : {}, [], isObj(post.content_present) ? post.content_present : {});
      for (const [path, file] of flattenUploads(files.uploads)) {
        if (file.size === 0) continue;
        if (file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error('Ảnh vượt quá giới hạn 5 MB. Vui lòng chọn ảnh có dung lượng nhỏ hơn.');
        const existing = getNested(content, path);
        const name = path[path.length - 1];
        const isImage = typeof existing === 'string' && (existing.startsWith('images/') || IMAGE_KEYS.includes(name));
        if (!isImage) throw new Error('Ảnh tải lên không hợp lệ hoặc không hoàn tất. Vui lòng thử lại.');
        const conv = await storeConverted(file, false);
        setNested(content, path, 'images/uploads/' + conv.path);
      }
      await saveSiteContent(content);
      return { redirect: '/admin?saved=1' };
    } catch (e) {
      console.error(e);
      return { error: { key: 'error', msg: (e as Error).message }, redirect: '/admin' };
    }
  },
};
