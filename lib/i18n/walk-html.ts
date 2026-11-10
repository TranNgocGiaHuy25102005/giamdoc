/**
 * Port chính xác i18n_walk() của PHP cho chuỗi HTML:
 * duyệt HTML, gọi fn(khoá, loại) cho từng đơn vị câu chữ có tiếng Việt; fn trả HTML mới hoặc null.
 * Dùng cho: nội dung HTML có sẵn (dangerouslySetInnerHTML) và công cụ quét câu chữ của admin.
 */
import { decodeEntities, escapeHtml } from '../text';
import { hasVi, norm } from './countries';

export type WalkFn = (key: string, kind: 'text' | 'attr' | 'ld') => string | null;

export const INLINE_TAGS = new Set(['em', 'strong', 'b', 'i', 'u', 'small', 'br', 'sub', 'sup', 'mark', 'abbr', 'wbr', 's', 'del', 'ins']);

export function walkHtml(html: string, fn: WalkFn): string {
  let out = '';
  let pos = 0;
  const len = html.length;
  const lower = html.toLowerCase();
  while (pos < len) {
    let best = -1;
    let pair: [string, string] | null = null;
    for (const [open, close] of [['<!--', '-->'], ['<script', '</script>'], ['<style', '</style>']] as [string, string][]) {
      const p = lower.indexOf(open, pos);
      if (p !== -1 && (best === -1 || p < best)) {
        best = p;
        pair = [open, close];
      }
    }
    if (best === -1 || !pair) {
      out += walkFrag(html.slice(pos), fn);
      break;
    }
    out += walkFrag(html.slice(pos, best), fn);
    let end = lower.indexOf(pair[1], best);
    end = end === -1 ? len : end + pair[1].length;
    const block = html.slice(best, end);
    out += block.toLowerCase().startsWith('<script') && block.toLowerCase().includes('ld+json') ? walkLd(block, fn) : block;
    pos = end;
  }
  return out;
}

function walkFrag(frag: string, fn: WalkFn): string {
  if (!frag) return '';
  const tokens = frag.split(/(<[a-zA-Z/][^<>]*>)/);
  let out = '';
  let buf = '';
  const flush = () => {
    if (!buf) return;
    const raw = buf;
    buf = '';
    if (!hasVi(raw)) {
      out += raw;
      return;
    }
    const trim = raw.replace(/^\s+/, '');
    const lead = raw.slice(0, raw.length - trim.length);
    const core = trim.replace(/\s+$/, '');
    const tail = trim.slice(core.length);
    const key = norm(core);
    const rep = key ? fn(key, 'text') : null;
    out += rep === null ? raw : lead + rep + tail;
  };
  tokens.forEach((t, i) => {
    if (i % 2 === 0) {
      buf += t;
      return;
    }
    const name = (t.match(/^<\/?([a-zA-Z0-9]+)/)?.[1] ?? '').toLowerCase();
    if (INLINE_TAGS.has(name)) buf += t;
    else {
      flush();
      out += t;
    }
  });
  flush();
  // thuộc tính (placeholder, alt, title, aria-label, meta content)
  return out.replace(/<[a-zA-Z][^<>]*>/g, (tag) => {
    if (!hasVi(tag)) return tag;
    let attrs: string[];
    if (tag.toLowerCase().startsWith('<meta')) {
      if (!/(?:name|property)\s*=\s*"(?:description|og:title|og:description|twitter:title|twitter:description)"/i.test(tag)) return tag;
      attrs = ['content'];
    } else attrs = ['placeholder', 'alt', 'title', 'aria-label'];
    for (const a of attrs) {
      tag = tag.replace(new RegExp('(\\s' + a + '\\s*=\\s*")([^"]*)(")', 'gi'), (m, p1: string, val: string, p3: string) => {
        if (!hasVi(val)) return m;
        const rep = fn(norm(val), 'attr');
        return rep === null ? m : p1 + rep.replace(/"/g, '&quot;') + p3;
      });
    }
    return tag;
  });
}

function walkLd(block: string, fn: WalkFn): string {
  const m = block.match(/^(<script\b[^>]*>)([\s\S]*)(<\/script>)$/i);
  if (!m) return block;
  let data: unknown;
  try {
    data = JSON.parse(m[2].trim());
  } catch {
    return block;
  }
  const walk = (v: any): any => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o: any = {};
      for (const [k, x] of Object.entries(v)) o[k] = walk(x);
      return o;
    }
    if (typeof v === 'string' && hasVi(v)) {
      const rep = fn(norm(escapeHtml(v)), 'ld');
      if (rep !== null) return decodeEntities(rep.replace(/<[^>]*>/g, ''));
    }
    return v;
  };
  return m[1] + JSON.stringify(walk(data)).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') + m[3];
}

/** Danh sách câu chữ (khoá tiếng Việt) có trong một trang HTML. */
export function extractHtml(html: string): string[] {
  const set = new Set<string>();
  walkHtml(html, (k) => {
    if (Array.from(k).length <= 1500) set.add(k);
    return null;
  });
  return [...set];
}
