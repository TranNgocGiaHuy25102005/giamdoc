import 'server-only';
import { newsDeleteArticle, newsSaveArticle, newsSaveCategories, phpInt } from '../../stores/news';
import { entries, fileAt, isObj, pick, str } from '../form';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES, storeConverted } from '../media';
import type { AdminHandler } from '../types';

/** Tab "Tin Tức (SEO)" — port các nhánh news_upload / news_cats_save / news_delete / news_save của admin/index.php */

/** pet_store_upload (chỉ ảnh) → images/uploads/xxx.webp */
async function storeImage(file: File): Promise<string> {
  const r = await storeConverted(file, false, MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES);
  return 'images/uploads/' + r.path;
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Tải ảnh chèn trong bài viết (AJAX, trả JSON) */
const newsUploadHandler: AdminHandler = {
  match: (post) => 'news_upload' in post,
  async handle({ files }) {
    try {
      const f = fileAt(files, 'file');
      if (!f) throw new Error('Chưa chọn ảnh.');
      const path = await storeImage(f);
      return { json: { ok: true, url: path } };
    } catch (e) {
      return { json: { ok: false, error: errMsg(e) } };
    }
  },
};

/** Lưu danh mục tin tức */
const newsCatsSaveHandler: AdminHandler = {
  match: (post) => 'news_cats_save' in post,
  async handle({ post }) {
    let newsError: string;
    try {
      const rowsIn: { key: string; label: string }[] = [];
      const ks = isObj(post.nc_key) ? post.nc_key : {};
      for (const [i, lb] of entries(post.nc_label)) {
        rowsIn.push({ key: str(pick(ks, i)), label: str(lb) });
      }
      if (newsSaveCategories(rowsIn)) return { redirect: '/admin?news_cats_saved=1' };
      newsError = 'Không ghi được file content/news_categories.json. Hãy kiểm tra quyền ghi của thư mục content.';
    } catch (e) {
      newsError = errMsg(e);
    }
    return { error: { key: 'newsError', msg: newsError }, redirect: '/admin?tab=news' };
  },
};

/** Xoá bài viết */
const newsDeleteHandler: AdminHandler = {
  match: (post) => 'news_delete' in post,
  async handle({ post }) {
    if (newsDeleteArticle(phpInt(str(post.news_delete)))) return { redirect: '/admin?news_deleted=1' };
    return {
      error: { key: 'newsError', msg: 'Không ghi được file content/news_articles_data.json. Hãy kiểm tra quyền ghi của thư mục content.' },
      redirect: '/admin?tab=news',
    };
  },
};

/** Đăng / cập nhật bài viết */
const newsSaveHandler: AdminHandler = {
  match: (post) => 'news_save' in post,
  async handle({ post, files }) {
    const nIn: Record<string, unknown> = isObj(post.nw) ? { ...post.nw } : {};
    try {
      const thumb = fileAt(files, 'nw_thumb');
      if (thumb) nIn.thumbnail = await storeImage(thumb);
      const nid = newsSaveArticle(nIn);
      return { redirect: '/admin?news_saved=1&edit=' + nid };
    } catch (e) {
      return {
        error: { key: 'newsError', msg: errMsg(e) },
        redirect: '/admin?tab=news&edit=' + Math.max(0, phpInt(str(nIn.id))),
      };
    }
  },
};

/** Theo đúng thứ tự if/elseif của PHP */
export const newsHandlers: AdminHandler[] = [newsUploadHandler, newsCatsSaveHandler, newsDeleteHandler, newsSaveHandler];
