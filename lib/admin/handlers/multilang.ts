import 'server-only';
import { contentExists } from '../../json-file';
import fs from 'node:fs';
import { mlCollect, mlHandlePhrases, mlHandleSave, mlMissing, mlTranslateBatch, mlUnitsPath } from '../../i18n/admin';
import { loadSettings } from '../../i18n/settings';
import { isObj, str, values } from '../form';
import type { AdminHandler } from '../types';

/** Tab "Đa Quốc Gia & Dịch Thuật" — port các nhánh ml_* của admin/index.php */

/** AJAX: quét (ml_collect) / dịch 1 lô (ml_translate_step) → JSON */
const ajaxHandler: AdminHandler = {
  match: (post) => 'ml_collect' in post || 'ml_translate_step' in post,
  async handle({ post }) {
    let jr: Record<string, unknown> = { ok: false, error: '' };
    try {
      if ('ml_collect' in post) {
        const html = str(post.html);
        if (html.length < 200 || !html.toLowerCase().includes('<html')) {
          jr.error = 'Không đọc được nội dung trang.';
        } else {
          const reset = str(post.reset) !== '' && str(post.reset) !== '0';
          const [total, added] = mlCollect(html, reset);
          const ok = contentExists('lang/_source_units.json');
          jr = { ok, total, new: added, error: ok ? '' : 'Không ghi được content/lang — cấp quyền Modify cho thư mục content.' };
        }
      } else {
        const lang = str(post.lang);
        const missing = mlMissing(lang);
        const batch = missing.slice(0, loadSettings().engine === 'free' ? 20 : 8);
        if (!batch.length) {
          jr = { ok: true, done: 0, fail: 0, remaining: 0, error: '' };
        } else {
          const [okN, badN, err] = await mlTranslateBatch(lang, batch);
          jr = { ok: okN > 0, done: okN, fail: badN, remaining: Math.max(0, missing.length - okN), error: err };
        }
      }
    } catch (e) {
      jr.error = 'Lỗi: ' + ((e as Error).message || String(e));
    }
    return { json: jr };
  },
};

/** Lưu cấu hình (form #mlForm) */
const saveHandler: AdminHandler = {
  match: (post) => 'ml_save' in post,
  async handle({ post }) {
    const err = mlHandleSave(post);
    if (err === null) return { redirect: '/admin?ml_saved=1&tab=multilang' };
    return { error: { key: 'mlError', msg: err }, redirect: '/admin?tab=multilang' };
  },
};

/** Lưu bản dịch sửa tay */
const phrasesHandler: AdminHandler = {
  match: (post) => 'ml_phrases_save' in post,
  async handle({ post }) {
    const lang = str(post.ml_lang);
    const rows = values(post.ph).filter(isObj).map((r) => ({ k: r.k, v: r.v }));
    const err = mlHandlePhrases(lang, rows);
    if (err === null) return { redirect: '/admin?ml_saved=1&tab=multilang&ml_lang=' + encodeURIComponent(lang) };
    return { error: { key: 'mlError', msg: err }, redirect: '/admin?tab=multilang&ml_lang=' + encodeURIComponent(lang) };
  },
};

export const multilangHandlers: AdminHandler[] = [ajaxHandler, saveHandler, phrasesHandler];
