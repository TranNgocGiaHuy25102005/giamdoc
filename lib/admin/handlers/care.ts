import 'server-only';
import { careSave } from '../../stores/care';
import { entries, fileAt, isObj, pick, values, type PhpObject } from '../form';
import { storeConverted } from '../media';
import type { AdminHandler } from '../types';

/** Lưu trang "Chăm sóc tại store" (content/care_service_data.json) — port nhánh care_save của admin/index.php */

type Obj = Record<string, unknown>;
/** Bản sao nông của mảng PHP (không phải mảng → []) */
const copy = (v: unknown): Obj => (isObj(v) ? { ...v } : {});

/** care_pick_upload(): ô file trống → null; có file → 'images/uploads/...' (ảnh ≤ 5 MB, không nhận video) */
async function pickUpload(files: PhpObject, key: string, idx?: string): Promise<string | null> {
  const f = idx === undefined ? fileAt(files, key) : fileAt(files, key, idx);
  if (!f) return null;
  const r = await storeConverted(f, false);
  return 'images/uploads/' + r.path;
}

export const careHandler: AdminHandler = {
  match: (post) => 'care_save' in post,
  async handle({ post, files }) {
    const src = isObj(post.care) ? post.care : {};
    const c: Obj = { ...src };
    try {
      // ảnh Spa / Khách sạn
      for (const sec of ['spa', 'hotel']) {
        const s = copy(c[sec]);
        const n = await pickUpload(files, 'care_img_' + sec);
        if (n !== null) s.image = n;
        c[sec] = s;
      }
      // thư viện ảnh: giữ đúng thứ tự trên màn hình
      const gal: Obj[] = [];
      for (const [k, g0] of entries(pick(src, 'gallery', 'images'))) {
        const g = copy(g0);
        const n = await pickUpload(files, 'care_gal', k);
        if (n !== null) g.src = n;
        gal.push(g);
      }
      const gTitle = pick(src, 'gallery', 'title');
      c.gallery = { title: gTitle ?? '', images: gal };
      // dịch vụ đặt lịch: mỗi dòng 1 ô văn bản
      c.booking = { ...copy(c.booking), services: values(pick(src, 'booking', 'services')) };
      c.pricing = { ...copy(c.pricing), spa: values(pick(src, 'pricing', 'spa')), hotel: values(pick(src, 'pricing', 'hotel')) };
      // ảnh của từng thẻ (Tắm dưỡng, Sấy tơi, ... / Phòng cách âm, ...): file care_step_spa[k], care_step_hotel[k]
      for (const [sec, fld, fkey] of [['spa', 'steps', 'care_step_spa'], ['hotel', 'features', 'care_step_hotel']] as const) {
        const list: Obj[] = [];
        for (const [k, it0] of entries(pick(src, sec, fld))) {
          const it = copy(it0);
          const n = await pickUpload(files, fkey, k);
          if (n !== null) it.image = n;
          list.push(it);
        }
        (c[sec] as Obj)[fld] = list;
      }
      if (careSave(c)) return { redirect: '/admin?care_saved=1' };
      return {
        error: { key: 'careError', msg: 'Không ghi được file content/care_service_data.json. Hãy kiểm tra quyền ghi của thư mục content.' },
        redirect: '/admin?tab=care',
      };
    } catch (e) {
      return { error: { key: 'careError', msg: e instanceof Error ? e.message : String(e) }, redirect: '/admin?tab=care' };
    }
  },
};
