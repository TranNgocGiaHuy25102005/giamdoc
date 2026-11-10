import 'server-only';
import { petsCleanSrc, petsNormalizeOne, petsSave, type Pet } from '../../stores/pets';
import { entries, fileAt, isObj, str } from '../form';
import { storeConverted } from '../media';
import type { AdminHandler } from '../types';

/** Giới hạn tải lên của trang mua bán (PET_MAX_IMAGE_BYTES / PET_MAX_VIDEO_BYTES) */
export const PET_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const PET_MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** pet_store_upload — ảnh → .webp, video → .webm. Trả đường dẫn images/uploads/xxx */
async function petStoreUpload(file: File, allowVideo = false): Promise<string> {
  const r = await storeConverted(file, allowVideo, PET_MAX_IMAGE_BYTES, PET_MAX_VIDEO_BYTES);
  return 'images/uploads/' + r.path;
}

/** Lưu trang mua bán (thẻ pet) — port nhánh isset($_POST['pets_save']) */
export const petsHandler: AdminHandler = {
  match: (post) => 'pets_save' in post,
  async handle({ post, files }) {
    try {
      const petsOut: Pet[] = [];
      let n = 0;
      for (const [key, rowRaw] of entries(post.pets)) {
        if (!isObj(rowRaw)) continue;
        n++;
        const row: Record<string, unknown> = { ...rowRaw };
        // ảnh thẻ
        const img = fileAt(files, 'pet_img', key);
        if (img) row.image = await petStoreUpload(img);
        // ảnh/video trang chi tiết (giữ đúng thứ tự trên màn hình)
        const media: string[] = [];
        for (const [k, v] of entries(rowRaw.media)) {
          let src = str(v);
          const mf = fileAt(files, 'pet_media', key, k);
          if (mf) {
            src = await petStoreUpload(mf, true);
          } else if (src.trim() !== '' && petsCleanSrc(src) === '') {
            throw new Error(`Thẻ #${n}: một đường dẫn ảnh/video không hợp lệ (dùng https://... hoặc images/...).`);
          }
          if (src.trim() !== '') media.push(src);
        }
        row.media = media;
        const item = petsNormalizeOne(row);
        if (item.name === '' && item.breed === '') {
          throw new Error(`Thẻ #${n}: hãy nhập ít nhất Tên hoặc Giống.`);
        }
        petsOut.push(item);
      }
      await petsSave(petsOut);
      return { redirect: '/admin?pets_saved=1' };
    } catch (e) {
      console.error('[admin pets_save]', e);
      return {
        error: { key: 'petsError', msg: e instanceof Error ? e.message : String(e) },
        redirect: '/admin?tab=muaban',
      };
    }
  },
};
