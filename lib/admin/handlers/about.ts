import 'server-only';
import { aboutSave } from '../../stores/about';
import { entries, fileAt, isObj, pick, values, type PhpObject } from '../form';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES, storeConverted } from '../media';
import type { AdminHandler } from '../types';

/** Lưu trang "Về Chunora" vào content/about_chunora_data.json (port nhánh about_save của admin/index.php) */

/** care_pick_upload → pet_store_upload: lưu tệp (ảnh, hoặc video nếu cho phép) → 'images/uploads/<tên>'; ô trống → null */
async function pickUpload(files: PhpObject, allowVideo: boolean, ...keys: string[]): Promise<string | null> {
  const f = fileAt(files, ...keys);
  if (!f) return null;
  const r = await storeConverted(f, allowVideo, MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES);
  return 'images/uploads/' + r.path;
}

export const aboutHandler: AdminHandler = {
  match: (post) => 'about_save' in post,
  async handle({ post, files }) {
    const ab = pick(post, 'ab');
    const b: Record<string, any> = isObj(ab) ? { ...ab } : {};
    try {
      b.story = isObj(b.story) ? { ...b.story } : {};
      b.why = isObj(b.why) ? { ...b.why } : {};
      let n: string | null;
      if ((n = await pickUpload(files, false, 'ab_img_story')) !== null) b.story.thumbnail = n;
      if ((n = await pickUpload(files, false, 'ab_img_why')) !== null) b.why.image = n;
      // video tải lên: tự chuyển sang WebM; nếu có tệp thì ưu tiên hơn ô link
      if ((n = await pickUpload(files, true, 'ab_video_file')) !== null) b.story.video = n;
      b.why.cards = values(b.why.cards);
      b.stats = isObj(b.stats) ? { ...b.stats } : {};
      b.stats.items = values(b.stats.items);
      const mem: Record<string, unknown>[] = [];
      // duyệt thành viên theo đúng thứ tự gửi lên (khoá 0,1,… và n1001… của dòng mới)
      for (const [k, m] of entries(pick(b, 'team', 'members'))) {
        const row: Record<string, unknown> = isObj(m) ? { ...m } : {};
        if ((n = await pickUpload(files, false, 'ab_team', k)) !== null) row.image = n;
        mem.push(row);
      }
      b.team = { ...(isObj(b.team) ? b.team : {}), members: mem };
      if (aboutSave(b)) return { redirect: '/admin?about_saved=1' };
      return {
        error: { key: 'aboutError', msg: 'Không ghi được file content/about_chunora_data.json. Hãy kiểm tra quyền ghi của thư mục content.' },
        redirect: '/admin?tab=about',
      };
    } catch (e) {
      return { error: { key: 'aboutError', msg: (e as Error).message || 'Đã xảy ra lỗi.' }, redirect: '/admin?tab=about' };
    }
  },
};
