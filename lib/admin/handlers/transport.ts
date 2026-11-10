import 'server-only';
import { transportSave } from '../../stores/transport';
import { entries, fileAt, isObj, pick, values, type PhpObject } from '../form';
import { storeConverted } from '../media';
import type { AdminHandler } from '../types';

/** Lưu trang "Vận chuyển đa quốc gia" (content/transport_service_data.json) — port nhánh transport_save của admin/index.php */

type Obj = Record<string, unknown>;
const copy = (v: unknown): Obj => (isObj(v) ? { ...v } : {});

/** care_pick_upload(): ô file trống → null; có file → 'images/uploads/...' (ảnh ≤ 5 MB, không nhận video) */
async function pickUpload(files: PhpObject, key: string, idx?: string): Promise<string | null> {
  const f = idx === undefined ? fileAt(files, key) : fileAt(files, key, idx);
  if (!f) return null;
  const r = await storeConverted(f, false);
  return 'images/uploads/' + r.path;
}

export const transportHandler: AdminHandler = {
  match: (post) => 'transport_save' in post,
  async handle({ post, files }) {
    const src = isObj(post.tp) ? post.tp : {};
    const t: Obj = { ...src };
    try {
      const hero = copy(t.hero);
      const newHero = await pickUpload(files, 'tp_img_hero');
      if (newHero !== null) hero.image = newHero;
      t.hero = hero;
      t.pillars = values(src.pillars);
      t.journey = { ...copy(t.journey), steps: values(pick(src, 'journey', 'steps')) };
      t.routes = { ...copy(t.routes), intl: values(pick(src, 'routes', 'intl')), domestic: values(pick(src, 'routes', 'domestic')) };
      const gal: Obj[] = [];
      for (const [k, g0] of entries(pick(src, 'gallery', 'images'))) {
        const g = copy(g0);
        const n = await pickUpload(files, 'tp_gal', k);
        if (n !== null) g.src = n;
        gal.push(g);
      }
      t.gallery = { title: pick(src, 'gallery', 'title') ?? '', desc: pick(src, 'gallery', 'desc') ?? '', images: gal };
      if (transportSave(t)) return { redirect: '/admin?transport_saved=1' };
      return {
        error: { key: 'transportError', msg: 'Không ghi được file content/transport_service_data.json. Hãy kiểm tra quyền ghi của thư mục content.' },
        redirect: '/admin?tab=transport',
      };
    } catch (e) {
      return { error: { key: 'transportError', msg: e instanceof Error ? e.message : String(e) }, redirect: '/admin?tab=transport' };
    }
  },
};
