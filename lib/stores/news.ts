import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR } from '../config';
import { DB_MODE, readContentJson, writeContentJson } from '../json-file';
import { cleanSrc, cleanText } from '../text';

/**
 * Port news-store.php — Dữ liệu "Tin tức & Cẩm nang SEO" (/tin-tuc).
 * Lưu tại content/news_articles_data.json. Chưa có file thì dùng 4 bài mẫu bên dưới.
 * Danh mục: content/news_categories.json (sửa trong admin), chưa có thì dùng mặc định.
 * Mỗi bài: id, title, slug, category, thumbnail, excerpt, content (HTML), meta_title, meta_description,
 *          focus_keyword, author, created_at, updated_at, views, status (published|draft).
 */

export const NEWS_FILE = 'news_articles_data.json';
export const NEWS_CAT_FILE = 'news_categories.json';

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  category: string;
  thumbnail: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  author: string;
  created_at: string;
  updated_at: string;
  views: number;
  status: 'published' | 'draft';
}

/** [key => tên danh mục] (thứ tự khoá giữ như file JSON; lưu ý: khoá dạng số nguyên sẽ bị JS xếp lên trước). */
export type NewsCategories = Record<string, string>;

export function newsJsonPath(): string {
  return path.join(CONTENT_DIR, NEWS_FILE);
}

export function newsCatPath(): string {
  return path.join(CONTENT_DIR, NEWS_CAT_FILE);
}

/* ------------------------------------------------------------------ */
/* Tiện ích kiểu PHP                                                   */
/* ------------------------------------------------------------------ */

/** (int) $v của PHP (đủ dùng cho dữ liệu JSON / form) */
export function phpInt(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const m = /^\s*([+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i.exec(v);
    return m ? Math.trunc(Number(m[1])) || 0 : 0;
  }
  return 0;
}

export const phpTrim = (s: string, chars = ' \t\n\r\0\x0B'): string => {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
};

export const mbSubstr = (s: string, start: number, len: number): string => Array.from(s).slice(start, start + len).join('');

/** strip_tags() (gần đúng) */
export function stripTags(html: string): string {
  return String(html).replace(/<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z!?][^>]*(?:>|$)/g, '');
}

/** date('Y-m-d H:i:s') theo giờ máy chủ */
export function newsNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** strtotime() cho định dạng 'Y-m-d[ H:i[:s]]' (giờ máy chủ). Sai → null. */
export function newsParseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(s ?? '').trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  if (Number.isNaN(d.getTime()) || d.getMonth() !== +m[2] - 1) return null;
  return d;
}

/** date('c', strtotime($d) ?: time()) */
export function newsDateIso(s: string): string {
  const d = newsParseDate(s) ?? new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const ao = Math.abs(off);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${p(Math.floor(ao / 60))}:${p(ao % 60)}`;
}

/** nw_date(): d/m/Y hoặc '' */
export function newsDateDmy(s: string): string {
  const d = newsParseDate(s);
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* ------------------------------------------------------------------ */
/* Danh mục                                                            */
/* ------------------------------------------------------------------ */

export function newsCategoriesDefault(): NewsCategories {
  return {
    'thu-tuc-bay': 'Thủ tục bay & Kiểm dịch',
    'cham-soc': 'Cẩm nang chăm sóc',
    'giong-loai': 'Kiến thức giống loài',
    'nhat-ky': 'Nhật ký Chunora',
  };
}

/** Danh mục [key => tên]; đọc từ content/news_categories.json (sửa trong admin), chưa có thì dùng mặc định. */
export function newsCategories(): NewsCategories {
  const d = readContentJson(NEWS_CAT_FILE);
  if (d && typeof d === 'object') {
    const out: NewsCategories = {};
    for (const [k0, v0] of Object.entries(d as Record<string, unknown>)) {
      if (v0 !== null && typeof v0 === 'object') continue;
      const k = newsSlugify(String(k0));
      const v = phpTrim(v0 === null || v0 === undefined || v0 === false ? '' : v0 === true ? '1' : String(v0));
      if (k !== '' && v !== '') out[k] = mbSubstr(v, 0, 60);
    }
    if (Object.keys(out).length) return out;
  }
  return newsCategoriesDefault();
}

/** rows: danh sách {key, label}; key rỗng → tạo từ tên. Trả false nếu không ghi được; ném lỗi nếu không còn danh mục nào. */
export function newsSaveCategories(rows: { key?: unknown; label?: unknown }[]): boolean {
  const out: NewsCategories = {};
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    let label = phpTrim(typeof r.label === 'string' || typeof r.label === 'number' ? String(r.label) : '');
    if (label === '') continue;
    label = mbSubstr(stripTags(label).replace(/\s+/gu, ' '), 0, 60);
    let key = newsSlugify(typeof r.key === 'string' || typeof r.key === 'number' ? String(r.key) : '') || newsSlugify(label);
    if (key === '') key = 'muc';
    const base = key;
    let i = 2;
    while (key in out) key = base + '-' + i++;
    out[key] = label;
  }
  if (!Object.keys(out).length) throw new Error('Cần ít nhất một danh mục.');
  return writeContentJson(NEWS_CAT_FILE, out);
}

const VI_MAP: Record<string, string> = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a', ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a', â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e', ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o', ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o', ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u', ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y', đ: 'd',
};

export function newsSlugify(text: string): string {
  let t = String(text ?? '').toLowerCase();
  t = Array.from(t).map((ch) => VI_MAP[ch] ?? ch).join('');
  t = t.replace(/[^a-z0-9]+/g, '-');
  return phpTrim(mbSubstr(phpTrim(t, '-'), 0, 90), '-');
}

/* ------------------------------------------------------------------ */
/* Bộ phân tích HTML nhỏ (thay DOMDocument::loadHTML / saveHTML)       */
/* ------------------------------------------------------------------ */

export interface HText { type: 'text'; text: string; raw?: boolean }
export interface HComment { type: 'comment'; text: string }
export interface HEl { type: 'el'; tag: string; attrs: [string, string][]; children: HNode[] }
export type HNode = HText | HComment | HEl;

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'basefont', 'frame', 'isindex', 'keygen']);
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes']);
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'del', 'dfn', 'em', 'font', 'i', 'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'tt', 'u', 'var', 'big', 'label']);
const CLOSES_P = new Set(['address', 'article', 'aside', 'blockquote', 'center', 'dir', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']);
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

const LATIN1 = 'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml'.split(' ');
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', sbquo: '‚',
  ldquo: '“', rdquo: '”', bdquo: '„', bull: '•', trade: '™', euro: '€', rarr: '→', larr: '←', uarr: '↑', darr: '↓', harr: '↔',
  dagger: '†', Dagger: '‡', permil: '‰', lsaquo: '‹', rsaquo: '›', OElig: 'Œ', oelig: 'œ', Scaron: 'Š', scaron: 'š', Yuml: 'Ÿ',
  circ: 'ˆ', tilde: '˜', ensp: ' ', emsp: ' ', thinsp: ' ', zwnj: '‌', zwj: '‍', minus: '−', le: '≤', ge: '≥', ne: '≠', infin: '∞', hearts: '♥',
};
LATIN1.forEach((n, i) => (ENTITIES[n] = String.fromCharCode(160 + i)));

function decodeHtml(s: string): string {
  if (!s.includes('&')) return s;
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);?/g, (m: string, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return m;
      return String.fromCodePoint(code);
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, e) && m.endsWith(';') ? ENTITIES[e] : m;
  });
}

function parseAttrs(s: string): [string, string][] {
  const out: [string, string][] = [];
  const seen = new Set<string>();
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const name = m[1].toLowerCase();
    if (seen.has(name)) continue; // giữ thuộc tính đầu tiên như libxml
    seen.add(name);
    out.push([name, decodeHtml(m[2] ?? m[3] ?? m[4] ?? '')]);
  }
  return out;
}

/** Phân tích chuỗi HTML thành cây (gốc ảo tag '#root'). */
export function newsParseHtml(html: string): HEl {
  const root: HEl = { type: 'el', tag: '#root', attrs: [], children: [] };
  const stack: HEl[] = [root];
  const cur = (): HEl => stack[stack.length - 1];
  const pushText = (t: string): void => {
    if (!t) return;
    const c = cur();
    const last = c.children[c.children.length - 1];
    if (last && last.type === 'text' && !last.raw) last.text += t;
    else c.children.push({ type: 'text', text: t });
  };
  /** tìm từ đỉnh ngăn xếp phần tử thuộc `target` để đóng; dừng ở `stopAt` hoặc khi gặp thẻ ngoài `passOnly` */
  const scan = (target: Set<string>, stopAt: Set<string>, passOnly?: Set<string>): void => {
    for (let k = stack.length - 1; k > 0; k--) {
      const t = stack[k].tag;
      if (target.has(t)) {
        stack.length = k;
        return;
      }
      if (stopAt.has(t)) return;
      if (passOnly && !passOnly.has(t)) return;
    }
  };
  /** đóng ngầm định (p, li, td…) giống bộ phân tích HTML */
  const implicitClose = (name: string): void => {
    if (CLOSES_P.has(name)) scan(new Set(['p']), new Set(), INLINE);
    if (name === 'li') scan(new Set(['li']), new Set(['ul', 'ol', 'menu', 'dir']));
    if (name === 'dt' || name === 'dd') scan(new Set(['dt', 'dd']), new Set(['dl']));
    if (name === 'tr') scan(new Set(['tr']), new Set(['table', 'thead', 'tbody', 'tfoot']));
    if (name === 'td' || name === 'th') scan(new Set(['td', 'th']), new Set(['tr', 'table']));
    if (name === 'thead' || name === 'tbody' || name === 'tfoot') scan(new Set(['thead', 'tbody', 'tfoot']), new Set(['table']));
    if (name === 'option') scan(new Set(['option']), new Set(['select', 'datalist']));
    if (HEADINGS.has(name)) scan(HEADINGS, new Set(), INLINE);
  };
  const n = html.length;
  const lower = html.toLowerCase();
  let i = 0;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      pushText(decodeHtml(html.slice(i)));
      break;
    }
    if (lt > i) pushText(decodeHtml(html.slice(i, lt)));
    i = lt;
    if (html.startsWith('<!--', i)) {
      const e = html.indexOf('-->', i + 4);
      cur().children.push({ type: 'comment', text: html.slice(i + 4, e === -1 ? n : e) });
      i = e === -1 ? n : e + 3;
      continue;
    }
    const next = html[i + 1] ?? '';
    if (next === '/' && /[A-Za-z]/.test(html[i + 2] ?? '')) {
      const e = html.indexOf('>', i);
      const end = e === -1 ? n : e + 1;
      const name = (/^<\/([A-Za-z][A-Za-z0-9:-]*)/.exec(html.slice(i, end))?.[1] ?? '').toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tag === name) {
          stack.length = k;
          break;
        }
      }
      i = end;
      continue;
    }
    if (/[A-Za-z]/.test(next)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9:-]/.test(html[j])) j++;
      const name = html.slice(i + 1, j).toLowerCase();
      const attrStart = j;
      // tìm '>' kết thúc thẻ, bỏ qua '>' nằm trong giá trị thuộc tính có dấu nháy
      let quote = '';
      while (j < n) {
        const ch = html[j];
        if (quote) {
          if (ch === quote) quote = '';
        } else if ((ch === '"' || ch === "'") && /=\s*$/.test(html.slice(attrStart, j))) quote = ch;
        else if (ch === '>') break;
        j++;
      }
      const attrs = parseAttrs(html.slice(attrStart, j).replace(/\/\s*$/, ''));
      i = j < n ? j + 1 : n;
      implicitClose(name);
      const el: HEl = { type: 'el', tag: name, attrs, children: [] };
      cur().children.push(el);
      if (VOID.has(name)) continue;
      if (RAW_TEXT.has(name)) {
        const close = lower.indexOf('</' + name, i);
        const end = close === -1 ? n : close;
        if (end > i) {
          const body = html.slice(i, end);
          el.children.push(name === 'textarea' || name === 'title' ? { type: 'text', text: decodeHtml(body) } : { type: 'text', text: body, raw: true });
        }
        const gt = close === -1 ? -1 : html.indexOf('>', close);
        i = gt === -1 ? n : gt + 1;
        continue;
      }
      stack.push(el);
      continue;
    }
    if (next === '!' || next === '?') {
      const e = html.indexOf('>', i);
      i = e === -1 ? n : e + 1;
      continue;
    }
    pushText('<');
    i++;
  }
  return root;
}

const escText = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** libxml mã hoá ký tự ngoài ASCII trong href/src */
const escUri = (s: string): string => s.replace(/[^\x00-\x7F]+/g, (m) => encodeURIComponent(m));

/** saveHTML() */
export function newsSerialize(node: HNode): string {
  if (node.type === 'text') return node.raw ? node.text : escText(node.text);
  if (node.type === 'comment') return '<!--' + node.text + '-->';
  const inner = node.children.map(newsSerialize).join('');
  if (node.tag === '#root') return inner;
  const attrs = node.attrs.map(([k, v]) => ` ${k}="${escAttr(k === 'href' || k === 'src' ? escUri(v) : v)}"`).join('');
  return VOID.has(node.tag) ? `<${node.tag}${attrs}>` : `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

/** textContent */
export function newsTextContent(node: HNode): string {
  if (node.type === 'text') return node.text;
  if (node.type === 'comment') return '';
  return node.children.map(newsTextContent).join('');
}

const setAttr = (el: HEl, name: string, val: string): void => {
  const a = el.attrs.find((x) => x[0] === name);
  if (a) a[1] = val;
  else el.attrs.push([name, val]);
};
const getAttr = (el: HEl, name: string): string => el.attrs.find((x) => x[0] === name)?.[1] ?? '';

/**
 * Làm sạch HTML bài viết (danh sách trắng): bỏ script/style/iframe, thuộc tính on*, link javascript:...
 * Cho phép: h2 h3 h4 p br strong b em i u ul ol li blockquote a img figure figcaption table thead tbody tr th td hr
 */
export function newsCleanHtml(html: string): string {
  html = phpTrim(String(html ?? ''));
  if (html === '') return '';
  const allowed: Record<string, string[]> = {
    h2: [], h3: [], h4: [], p: [], br: [], strong: [], b: [], em: [], i: [], u: [],
    ul: [], ol: [], li: [], blockquote: [], hr: [], figure: [], figcaption: [],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [],
    a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'width', 'height'],
  };
  const dropWhole = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'svg', 'math']);
  const safeUrl = (u: string, img: boolean): string => {
    u = phpTrim(u);
    if (u === '' || /[\x00-\x1F\x7F\s"'<>]/.test(u)) return '';
    if (/^https?:\/\//i.test(u) || (u[0] === '/' && !u.startsWith('//'))) return u;
    if (/^images\/[A-Za-z0-9_\-./]+$/.test(u) && !u.includes('..')) return u;
    if (!img && (u.startsWith('#') || /^(mailto:|tel:)/i.test(u) || /^[A-Za-z0-9_\-./]+\.php(\?[A-Za-z0-9_=&\-]*)?$/.test(u))) return u;
    return '';
  };
  const walk = (node: HEl): void => {
    const children = [...node.children];
    for (const c of children) {
      if (c.type === 'comment') {
        node.children.splice(node.children.indexOf(c), 1);
        continue;
      }
      if (c.type !== 'el') continue;
      const tag = c.tag;
      if (dropWhole.has(tag)) {
        node.children.splice(node.children.indexOf(c), 1);
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(allowed, tag)) {
        // thẻ lạ (div, span, font...): giữ nội dung, bỏ thẻ
        walk(c);
        node.children.splice(node.children.indexOf(c), 1, ...c.children);
        continue;
      }
      for (const [name, val0] of [...c.attrs]) {
        const drop = (): void => {
          c.attrs = c.attrs.filter((x) => x[0] !== name);
        };
        if (!allowed[tag].includes(name)) {
          drop();
          continue;
        }
        if (name === 'href' || name === 'src') {
          const val = safeUrl(val0, tag === 'img');
          if (val === '') {
            drop();
            continue;
          }
          setAttr(c, name, val);
        } else if (name === 'target') {
          setAttr(c, 'target', val0 === '_blank' ? '_blank' : '_self');
        } else if (name === 'width' || name === 'height') {
          if (!/^\d+$/.test(val0)) drop();
        } else {
          setAttr(c, name, mbSubstr(val0, 0, 200));
        }
      }
      if (tag === 'a' && getAttr(c, 'target') === '_blank') setAttr(c, 'rel', 'noopener noreferrer');
      if (tag === 'img' && !c.attrs.some((x) => x[0] === 'src')) {
        node.children.splice(node.children.indexOf(c), 1);
        continue;
      }
      walk(c);
    }
  };
  const root = newsParseHtml(html);
  walk(root);
  return phpTrim(newsSerialize(root));
}

/* ------------------------------------------------------------------ */
/* Bài mẫu (khi chưa có content/news_articles_data.json)               */
/* ------------------------------------------------------------------ */

export function newsSample(): Record<string, unknown>[] {
  const c1 = "<p>Đưa chó mèo đi nước ngoài là hành trình cần chuẩn bị kỹ từ nhiều tháng trước, vì mỗi quốc gia có quy định kiểm dịch và hồ sơ riêng. Bài viết này tổng hợp các bước cốt lõi để bạn hình dung toàn bộ quy trình trước khi liên hệ đơn vị hỗ trợ.</p>\n<h2>Hồ sơ cần chuẩn bị khi vận chuyển thú cưng quốc tế</h2>\n<p>Bộ hồ sơ thường gồm các giấy tờ sau, tuy nhiên danh sách chính xác phụ thuộc vào nước đến và loài vật:</p>\n<ul>\n<li>Sổ tiêm phòng có xác nhận của bác sĩ thú y, trong đó có mũi phòng dại.</li>\n<li>Chip điện tử theo chuẩn ISO được cấy trước khi tiêm phòng dại hoặc làm xét nghiệm.</li>\n<li>Giấy chứng nhận sức khỏe do cơ quan thú y có thẩm quyền cấp trong thời hạn quy định.</li>\n<li>Giấy phép nhập khẩu của nước đến (nếu nước đó yêu cầu).</li>\n</ul>\n<h3>Xét nghiệm kháng thể dại (Rabies Titer Test)</h3>\n<p>Một số nước, đặc biệt là các nước và vùng lãnh thổ không có bệnh dại, yêu cầu xét nghiệm kháng thể dại và thời gian chờ nhất định sau khi lấy mẫu. Đây là bước tốn thời gian nhất, vì vậy hãy hỏi về nó ngay từ đầu.</p>\n<h2>Các bước kiểm dịch xuất cảnh và nhập cảnh</h2>\n<p>Quy trình thường đi theo thứ tự: tư vấn tuyến bay và hồ sơ, hoàn tất tiêm phòng và chip, xét nghiệm (nếu cần), xin giấy chứng nhận kiểm dịch xuất khẩu, đặt chuyến bay và lồng vận chuyển, rồi làm thủ tục thông quan khi đến nơi.</p>\n<blockquote>Quy định kiểm dịch thay đổi theo từng thời kỳ. Hãy luôn đối chiếu với cơ quan thú y hoặc hải quan của nước đến trước khi lên lịch bay.</blockquote>\n<h2>Nên bắt đầu chuẩn bị trước bao lâu?</h2>\n<p>Với các tuyến cần xét nghiệm kháng thể dại, bạn nên bắt đầu từ ba đến sáu tháng trước ngày bay. Các tuyến đơn giản hơn có thể chuẩn bị trong vài tuần. Liên hệ Chunora PET để được tư vấn lộ trình phù hợp với từng bé.</p>";
  const c2 = "<p>Lồng vận chuyển là yếu tố quyết định bé có thoải mái và an toàn trong suốt chuyến bay hay không. Hầu hết các hãng bay đều yêu cầu lồng đạt chuẩn IATA khi gửi thú cưng ở khoang hành lý hoặc cargo.</p>\n<h2>Lồng chuẩn IATA gồm những tiêu chí nào?</h2>\n<ul>\n<li>Vỏ cứng chắc chắn, đáy kín chống rò rỉ.</li>\n<li>Cửa lồng có chốt an toàn, không thể tự mở.</li>\n<li>Thông gió ở nhiều phía để bé thở thoải mái.</li>\n<li>Có chỗ đựng nước và thức ăn gắn bên trong lồng.</li>\n</ul>\n<h2>Cách chọn kích thước lồng phù hợp</h2>\n<p>Bé cần đứng thẳng, xoay người và nằm thoải mái trong lồng. Hãy đo chiều dài từ mũi đến gốc đuôi, chiều cao khi đứng và chiều rộng vai để đối chiếu với bảng kích thước của hãng bay.</p>\n<h3>Làm quen với lồng trước ngày bay</h3>\n<p>Để lồng ở nơi bé hay nằm, đặt vài món đồ chơi hoặc chiếc khăn quen mùi bên trong. Khi bé tự bước vào lồng, bạn có thể đóng cửa trong thời gian ngắn rồi tăng dần để bé quen.</p>\n<h2>Chuẩn bị gì trước giờ bay?</h2>\n<p>Cho bé ăn nhẹ trước giờ bay vài tiếng, đưa đi vệ sinh ngay trước khi check-in và mang theo giấy tờ cần thiết. Đội ngũ Chunora PET sẽ gửi hình ảnh và video của bé tại các điểm check-in, quá cảnh và hạ cánh để bạn yên tâm.</p>";
  const c3 = "<p>Nhiều bạn phân vân giữa việc tự tắm cho thú cưng ở nhà và đưa bé đến store để spa. Mỗi cách đều có ưu điểm riêng, quan trọng là phù hợp với giống loài, tình trạng lông da và thời gian của bạn.</p>\n<h2>Khi nào nên tự tắm cho bé ở nhà?</h2>\n<p>Với bé lông ngắn, ít bẩn và quen với nước, tắm tại nhà mỗi vài tuần là đủ. Hãy dùng sữa tắm dành riêng cho chó mèo, không dùng sữa tắm của người vì độ pH khác nhau.</p>\n<h2>Khi nào nên đưa bé đến store spa?</h2>\n<ul>\n<li>Bé lông dài, lông xoăn dễ rối và cần sấy tơi kỹ.</li>\n<li>Cần cắt tỉa tạo kiểu theo giống.</li>\n<li>Cần vệ sinh tai, cắt móng và làm sạch tuyến hôi.</li>\n<li>Bé sợ nước hoặc khó giữ yên khi tắm ở nhà.</li>\n</ul>\n<h3>Lợi ích của spa chuyên nghiệp</h3>\n<p>Groomer có kinh nghiệm biết cách xử lý lông rối, sấy đúng nhiệt độ và quan sát da của bé để phát hiện sớm vấn đề. Không gian yên tĩnh cũng giúp bé bớt căng thẳng.</p>\n<h2>Bao lâu nên tắm cho chó mèo một lần?</h2>\n<p>Thông thường khoảng hai đến bốn tuần một lần với chó, mèo thì ít hơn tùy thói quen. Nếu da bé nhạy cảm, hãy hỏi bác sĩ thú y để có lịch phù hợp.</p>";
  const c4 = "<p>Chọn giống chó mèo không chỉ là chọn ngoại hình. Một người bạn bốn chân phù hợp sẽ hòa hợp với nhịp sống, không gian nhà ở và thời gian bạn có thể dành cho bé.</p>\n<h2>Bắt đầu từ lối sống của gia đình</h2>\n<p>Hãy tự hỏi mỗi ngày bạn có bao nhiêu thời gian để chơi và chăm sóc bé, nhà có sân hay chỉ là căn hộ nhỏ, và trong nhà có trẻ nhỏ hay người lớn tuổi hay không.</p>\n<h3>Giống chó phù hợp căn hộ</h3>\n<p>Các giống nhỏ, ít cần vận động quá nhiều thường dễ thích nghi với căn hộ. Dù vậy, chó nào cũng cần được dắt đi dạo và tương tác mỗi ngày.</p>\n<h3>Giống mèo cho người bận rộn</h3>\n<p>Một số giống mèo độc lập hơn, chấp nhận ở nhà một mình trong thời gian ngắn. Mèo lông dài thì cần chải lông thường xuyên.</p>\n<h2>Những câu hỏi nên hỏi trước khi đón bé về</h2>\n<ul>\n<li>Nguồn gốc, hồ sơ sức khỏe và lịch tiêm phòng của bé như thế nào?</li>\n<li>Bố mẹ của bé có tính cách và sức khỏe ra sao?</li>\n<li>Chế độ ăn và chăm sóc hằng ngày cần chuẩn bị gì?</li>\n</ul>\n<p>Đội ngũ Chunora PET luôn trao đổi minh bạch về từng bé để bạn có quyết định phù hợp nhất.</p>";
  const d = (i: number, date: string, a: Record<string, unknown>): Record<string, unknown> => ({
    id: i, thumbnail: '', author: 'Chunora PET', created_at: date, updated_at: date, views: 0, status: 'published',
    ...a, // $a + [...]: khoá của $a được ưu tiên
  });
  return [
    d(1, "2026-10-22 09:00:00", {
      title: "Thủ tục đưa chó mèo đi nước ngoài: hồ sơ, kiểm dịch và những lưu ý quan trọng",
      slug: "thu-tuc-dua-cho-meo-di-nuoc-ngoai",
      category: "thu-tuc-bay",
      excerpt: "Tổng hợp hồ sơ, bước kiểm dịch và thời gian chuẩn bị khi vận chuyển chó mèo quốc tế để bạn hình dung rõ lộ trình trước khi bay.",
      content: c1,
      meta_title: "Thủ tục vận chuyển chó mèo đi nước ngoài | Chunora PET",
      meta_description: "Hướng dẫn hồ sơ, tiêm phòng, gắn chip, xét nghiệm kháng thể dại và kiểm dịch khi vận chuyển chó mèo quốc tế. Tư vấn từ Chunora PET.",
      focus_keyword: "vận chuyển chó mèo đi nước ngoài",
    }),
    d(2, "2026-10-16 09:00:00", {
      title: "Lồng vận chuyển chuẩn IATA: cách chọn kích thước và chuẩn bị cho chuyến bay của bé",
      slug: "long-van-chuyen-chuan-iata",
      category: "thu-tuc-bay",
      excerpt: "Lồng đạt chuẩn IATA gồm những tiêu chí gì, chọn kích thước thế nào và cần làm quen với lồng ra sao trước ngày bay.",
      content: c2,
      meta_title: "Lồng vận chuyển chuẩn IATA cho chó mèo: cách chọn | Chunora PET",
      meta_description: "Tiêu chí lồng chuẩn IATA, cách đo và chọn kích thước, cách giúp bé quen lồng trước chuyến bay. Hướng dẫn từ Chunora PET.",
      focus_keyword: "lồng vận chuyển chuẩn IATA",
    }),
    d(3, "2026-10-09 09:00:00", {
      title: "Spa và tắm sấy cho chó mèo: nên tự làm tại nhà hay đến store?",
      slug: "spa-tam-say-cho-meo-tai-nha-hay-tai-store",
      category: "cham-soc",
      excerpt: "So sánh tắm tại nhà và spa chuyên nghiệp, giúp bạn chọn cách chăm sóc lông da phù hợp với từng bé.",
      content: c3,
      meta_title: "Spa tắm sấy chó mèo: tại nhà hay tại store? | Chunora PET",
      meta_description: "Khi nào nên tự tắm cho chó mèo ở nhà, khi nào nên đến spa chuyên nghiệp, và bao lâu nên tắm một lần. Cẩm nang từ Chunora PET.",
      focus_keyword: "spa tắm sấy chó mèo",
    }),
    d(4, "2026-10-02 09:00:00", {
      title: "Cách chọn giống chó mèo phù hợp với nhịp sống của gia đình",
      slug: "cach-chon-giong-cho-meo-phu-hop",
      category: "giong-loai",
      excerpt: "Chọn giống không chỉ là chọn ngoại hình: hãy bắt đầu từ lối sống, không gian và thời gian bạn có thể dành cho bé.",
      content: c4,
      meta_title: "Cách chọn giống chó mèo phù hợp gia đình | Chunora PET",
      meta_description: "Gợi ý chọn giống chó mèo theo lối sống, không gian nhà ở và thời gian chăm sóc, cùng những câu hỏi nên hỏi trước khi đón bé về.",
      focus_keyword: "chọn giống chó mèo",
    }),
  ];
}
/* ------------------------------------------------------------------ */
/* Chuẩn hoá / đọc / ghi                                               */
/* ------------------------------------------------------------------ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;
const scalarStr = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? '1' : '') : '';

/** Chuẩn hoá 1 bài viết (không đảm bảo slug duy nhất — xem newsEnsureUnique). */
export function newsNormalizeOne(input: unknown, cats: NewsCategories = newsCategories()): NewsArticle {
  const inp: Record<string, unknown> =
    input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const keys = Object.keys(cats);
  let cat = scalarStr(inp.category);
  if (!Object.prototype.hasOwnProperty.call(cats, cat)) {
    const found = keys.find((k) => cats[k] === cat);
    cat = found && found !== '0' ? found : keys[0] ?? '';
  }
  const title = cleanText(inp.title ?? '', 200);
  let slug = newsSlugify(cleanText(inp.slug ?? '', 120));
  if (slug === '') slug = newsSlugify(title);
  let date = scalarStr(inp.created_at);
  if (!DATE_RE.test(date)) date = newsNow();
  let upd = scalarStr(inp.updated_at);
  if (!DATE_RE.test(upd)) upd = date;
  const author = cleanText(inp.author ?? '', 80);
  return {
    id: Math.max(0, phpInt(inp.id ?? 0)),
    title,
    slug,
    category: cat,
    thumbnail: cleanSrc(inp.thumbnail ?? ''),
    excerpt: cleanText(inp.excerpt ?? '', 400, true),
    content: newsCleanHtml(scalarStr(inp.content)),
    meta_title: cleanText(inp.meta_title ?? '', 120),
    meta_description: cleanText(inp.meta_description ?? '', 320),
    focus_keyword: cleanText(inp.focus_keyword ?? '', 100),
    author: author === '' || author === '0' ? 'Chunora PET' : author,
    created_at: date,
    updated_at: upd,
    views: Math.max(0, phpInt(inp.views ?? 0)),
    status: inp.status === 'draft' ? 'draft' : 'published',
  };
}

export function newsEnsureUnique(list: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  let maxId = 0;
  for (const a of list) maxId = Math.max(maxId, a.id);
  return list.map((a0) => {
    const a = { ...a0 };
    if (a.id <= 0) a.id = ++maxId;
    const base = a.slug !== '' ? a.slug : 'bai-viet-' + a.id;
    let slug = base;
    let n = 2;
    while (seen.has(slug)) slug = base + '-' + n++;
    seen.add(slug);
    a.slug = slug;
    return a;
  });
}

/** news_load(&$fromFile): tất cả bài (mới nhất trước) + có đọc được file JSON không (false → đang dùng bài mẫu). */
export function newsLoadWithSource(): { list: NewsArticle[]; fromFile: boolean } {
  let fromFile = false;
  let raw: unknown[] | null = null;
  const d: unknown = readContentJson(NEWS_FILE);
  if (d && typeof d === 'object') {
    fromFile = true;
    const obj = d as Record<string, unknown>;
    const src: unknown = !Array.isArray(d) && Array.isArray(obj.articles) ? obj.articles : d;
    raw = Array.isArray(src) ? src : Object.values(src as Record<string, unknown>);
  }
  const cats = newsCategories();
  let list = (raw ?? newsSample()).map((x) => newsNormalizeOne(x, cats));
  list = list.filter((a) => a.title !== '');
  list = newsEnsureUnique(list);
  list.sort((a, b) => (b.created_at < a.created_at ? -1 : b.created_at > a.created_at ? 1 : 0));
  return { list, fromFile };
}

/** Tất cả bài (mới nhất trước). */
export function newsLoad(): NewsArticle[] {
  return newsLoadWithSource().list;
}

/** news_write(): ghi danh sách (đã đảm bảo id/slug duy nhất) vào content/news_articles_data.json */
export function newsWrite(list: NewsArticle[]): boolean {
  return writeContentJson(NEWS_FILE, newsEnsureUnique([...list]));
}

/** Thêm mới (id = 0) hoặc cập nhật bài. Trả id bài đã lưu. Ném Error (thông báo tiếng Việt) nếu không hợp lệ / không ghi được. */
export function newsSaveArticle(input: Record<string, unknown>): number {
  const list = newsLoad();
  const a = newsNormalizeOne(input);
  if (a.title === '') throw new Error('Vui lòng nhập tiêu đề bài viết.');
  if (a.content === '') throw new Error('Vui lòng nhập nội dung bài viết.');
  let found = false;
  for (let i = 0; i < list.length; i++) {
    const old = list[i];
    if (a.id > 0 && old.id === a.id) {
      a.created_at = old.created_at;
      a.views = old.views;
      a.updated_at = newsNow();
      list[i] = a;
      found = true;
      break;
    }
  }
  if (!found) {
    a.id = 0;
    a.created_at = a.updated_at = newsNow();
    list.push(a);
  }
  // slug trùng bài khác → newsEnsureUnique sẽ thêm -2: giữ slug của bài đang sửa
  const slug = a.slug;
  for (let i = 0; i < list.length; i++) {
    const x = list[i];
    if (found && x.id !== a.id && x.slug === slug) list[i] = { ...x, slug: slug + '-' + x.id };
  }
  if (!newsWrite(list)) {
    throw new Error('Không ghi được file content/news_articles_data.json. Hãy kiểm tra quyền ghi của thư mục content.');
  }
  for (const x of newsLoad()) {
    if (x.title === a.title && x.created_at === a.created_at) return x.id;
  }
  return a.id;
}

export function newsDeleteArticle(id: number): boolean {
  return newsWrite(newsLoad().filter((a) => a.id !== id));
}

export function newsFindBySlug(slug: string): NewsArticle | null {
  return newsLoad().find((a) => a.slug === slug) ?? null;
}

/** Tăng lượt xem (bỏ qua nếu chưa có file / không ghi được). */
export function newsBumpViews(id: number): void {
  if (!DB_MODE) {
    const p = newsJsonPath();
    try {
      if (!fs.statSync(p).isFile()) return;
      fs.accessSync(p, fs.constants.W_OK);
    } catch {
      return;
    }
  }
  newsWrite(newsLoad().map((a) => (a.id === id ? { ...a, views: a.views + 1 } : a)));
}

/** Số phút đọc ước tính (str_word_count trên chữ đã bỏ thẻ, 200 từ/phút). */
export function newsReadingMinutes(html: string): number {
  const L = 'A-Za-z\\u00C0-\\u024F\\u1E00-\\u1EFF';
  const words = stripTags(html).match(new RegExp(`[${L}][${L}'-]*`, 'g'))?.length ?? 0;
  return Math.max(1, Math.ceil(words / 200));
}

export interface NewsTocItem { id: string; text: string; lv: 2 | 3 }

/**
 * Mục lục (phần DOMDocument trong tin-tuc.php): gắn id "muc-N-slug" cho h2/h3 theo thứ tự tài liệu,
 * trả HTML mới + danh sách mục. `mapHref` (tuỳ chọn) đổi href của thẻ <a> trong cùng lượt.
 */
export function newsBuildToc(html: string, mapHref?: (href: string) => string): { html: string; toc: NewsTocItem[] } {
  const toc: NewsTocItem[] = [];
  const root = newsParseHtml(html);
  let n = 0;
  const visit = (node: HEl): void => {
    for (const c of node.children) {
      if (c.type !== 'el') continue;
      if (c.tag === 'h2' || c.tag === 'h3') {
        n++;
        const text = newsTextContent(c);
        const id = 'muc-' + n + '-' + (newsSlugify(text) || 'phan');
        setAttr(c, 'id', id);
        toc.push({ id, text: phpTrim(text), lv: c.tag === 'h3' ? 3 : 2 });
      }
      if (mapHref && c.tag === 'a') {
        const h = c.attrs.find((x) => x[0] === 'href');
        if (h) h[1] = mapHref(h[1]);
      }
      visit(c);
    }
  };
  visit(root);
  return { html: newsSerialize(root), toc };
}
