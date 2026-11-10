import 'server-only';
import { h } from '../html';
import { flashFor, type AdminState } from '../types';

/** Port render_fields(), field_title(), section_icon() — tab nội dung trang chủ (MySQL site_content) */

const LABELS: Record<string, string> = {
  seo: 'Cấu hình SEO', contact: 'Thông tin liên hệ', social: 'Mạng xã hội', hero: 'Phần mở đầu (Hero)',
  services: 'Dịch vụ cung cấp', mua_ban: 'Mua bán chó mèo', van_chuyen: 'Vận chuyển đa quốc gia', cham_soc: 'Chăm sóc tại store',
  gallery: 'Thư viện ảnh', team_image: 'Ảnh mục Vì sao chọn CHUNORA PET', hotline: 'Số Hotline', address: 'Địa chỉ đầy đủ',
  address_short: 'Địa chỉ rút gọn', maps_url: 'Đường dẫn Google Maps', domain: 'Tên miền Website', facebook: 'Facebook URL',
  tiktok: 'TikTok URL', youtube: 'Instagram URL', telegram: 'Telegram URL', zalo: 'Zalo URL', x: 'WhatsApp URL',
  badge: 'Nhãn phía trên tiêu đề (Badge)', title_line1: 'Tiêu đề dòng 1', title_line2: 'Tiêu đề dòng 2',
  highlight: 'Chữ nhấn mạnh (Highlight)', description: 'Mô tả chi tiết', image_main: 'Ảnh chính (Lớn)', image_small: 'Ảnh phụ (Nhỏ)',
  title: 'Tiêu đề', bullets: 'Các ý chính (Danh sách)', image: 'Hình ảnh', alt: 'Mô tả ảnh (Alt Text chuẩn SEO)',
};

export function fieldTitle(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const s = key.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ICONS: Record<string, string> = {
  seo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  hero: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  team_image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};
export const sectionIcon = (key: string) =>
  ICONS[key] ?? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

export const isList = (v: unknown): v is unknown[] => Array.isArray(v);
export const fieldName = (seg: string[], root = 'content') => root + seg.map((s) => '[' + s + ']').join('');
export const blankListItem = (seg: string[]) => (seg[seg.length - 1] === 'gallery' ? { image: '', alt: '' } : '');
export const IMAGE_KEYS = ['image', 'team_image', 'image_main', 'image_small'];

const TRASH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

export function renderFields(value: unknown, seg: string[] = []): string {
  if (value !== null && typeof value === 'object') {
    if (isList(value)) {
      const tpl = value[0] ?? blankListItem(seg);
      const next = value.length;
      let items = '';
      value.forEach((item, i) => {
        items += '<div class="repeat-item"><div class="repeat-header"><span class="repeat-badge">Mục #' + (i + 1) + '</span>' +
          '<button type="button" class="button danger btn-sm remove-item">' + TRASH + ' Xóa mục</button></div>' +
          '<div class="repeat-content">' + renderFields(item, [...seg, String(i)]) + '</div></div>';
      });
      const template = '<div class="repeat-item"><div class="repeat-header"><span class="repeat-badge">Mục mới</span>' +
        '<button type="button" class="button danger btn-sm remove-item">' + TRASH + ' Xóa mục</button></div>' +
        '<div class="repeat-content">' + renderFields(tpl, [...seg, '__INDEX__']) + '</div></div>';
      return '<input type="hidden" name="' + h(fieldName(seg, 'content_present')) + '" value="1">' +
        '<div class="repeater" data-next-index="' + next + '"><div class="repeat-items">' + items + '</div>' +
        '<template class="repeat-template">' + template + '</template>' +
        '<button type="button" class="button add-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm mục mới</button></div>';
    }
    let html = '<div class="fields-grid">';
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const path = [...seg, key];
      if (child !== null && typeof child === 'object') {
        html += '<fieldset class="group full-width"><legend>' + h(fieldTitle(key)) + '</legend>' + renderFields(child, path) + '</fieldset>';
        continue;
      }
      const label = fieldTitle(key);
      const name = fieldName(path);
      const cur = child === null || child === undefined ? '' : String(child);
      const isImage = cur.startsWith('images/') || IMAGE_KEYS.includes(key);
      const isLong = ['description', 'address', 'address_short'].includes(key) || Buffer.byteLength(cur) > 110;
      const span = isLong || isImage ? 'full-width' : '';
      const id = path.join('-');
      html += '<div class="field ' + span + '"><label for="' + h(id) + '">' + h(label) + '</label>';
      if (isImage) {
        const preview = cur ? (cur.startsWith('http') ? cur : '/' + cur.replace(/^\/+/, '')) : '';
        html += '<div class="image-uploader"><div class="image-preview-box' + (preview === '' ? ' is-empty' : '') + '">' +
          (preview ? '<img src="' + h(preview) + '" alt="Preview" class="img-preview">' : '<div class="no-img">Chưa có ảnh</div>') +
          '</div><div class="image-controls"><div class="input-path-group"><span class="path-prefix">Đường dẫn:</span>' +
          '<input id="' + h(id) + '" name="' + h(name) + '" value="' + h(cur) + '" placeholder="images/..." class="path-input"></div>' +
          '<div class="upload-btn-wrapper"><label class="file-upload-label">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
          ' <span class="file-label-text">Tải ảnh mới lên</span><input class="file-input" type="file" name="' + h(fieldName(path, 'uploads')) + '" accept="image/*"></label>' +
          '<span class="hint">Ảnh bất kỳ — tự chuyển sang WebP • Tối đa 5 MB</span><span class="upload-error" role="alert" hidden></span></div></div></div>';
      } else if (isLong) {
        html += '<textarea id="' + h(id) + '" name="' + h(name) + '" rows="3">' + h(cur) + '</textarea>';
      } else {
        html += '<input id="' + h(id) + '" name="' + h(name) + '" value="' + h(cur) + '">';
      }
      html += '</div>';
    }
    return html + '</div>';
  }
  const key = seg[seg.length - 1] ?? '';
  const cur = value === null || value === undefined ? '' : String(value);
  const label = /^\d+$/.test(key) ? 'Nội dung dòng' : fieldTitle(key);
  return '<div class="field full-width"><label for="' + h(seg.join('-')) + '">' + h(label) + '</label><input id="' + h(seg.join('-')) +
    '" name="' + h(fieldName(seg)) + '" value="' + h(cur) + '"></div>';
}

/** Các nút tab bên trái cho phần nội dung trang chủ */
export function renderContentNav(content: Record<string, unknown>): string {
  let out = '';
  let first = true;
  for (const key of Object.keys(content)) {
    out += '<button type="button" class="nav-tab ' + (first ? 'active' : '') + '" data-target="pane-' + h(key) + '">' + sectionIcon(key) +
      '<span>' + h(fieldTitle(key)) + '</span></button>';
    first = false;
  }
  return out;
}

/** Các khung nội dung (mỗi mục cấp 1 của site_content là 1 tab) */
export function renderContentPanes(content: Record<string, unknown>): string {
  let out = '';
  let first = true;
  for (const [key, val] of Object.entries(content)) {
    out += '<section class="panel section-pane ' + (first ? 'active' : '') + '" id="pane-' + h(key) + '"><div class="panel-header"><h2>' +
      sectionIcon(key) + h(fieldTitle(key)) + '</h2></div>' +
      (val !== null && typeof val === 'object' ? renderFields(val, [key]) : '<div class="fields-grid">' + renderFields({ [key]: val }, []) + '</div>') +
      '</section>';
    first = false;
  }
  return out;
}

export const contentError = (st: AdminState) => flashFor(st, 'error');
