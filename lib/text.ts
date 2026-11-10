/** Các hàm làm sạch chữ dùng chung (port từ *_text / *_src trong các file *-store.php) */

export function cleanText(v: unknown, max: number, multi = false): string {
  let s = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(multi ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g : /[\x00-\x1F\x7F]/g, '');
  return Array.from(s.trim()).slice(0, max).join('');
}

/** Ảnh: images/... hoặc http(s). Sai định dạng → ''. */
export function cleanSrc(v: unknown): string {
  const s = cleanText(v, 400);
  if (/^https?:\/\/[^\s"'<>]+$/i.test(s)) return s;
  if (/^images\/[A-Za-z0-9_\-./]+$/.test(s) && !s.includes('..')) return s;
  return '';
}

export function safeExternalUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : '#';
  } catch {
    return '#';
  }
}

export const telOf = (s: string) => String(s ?? '').replace(/[^0-9+]/g, '');

/** htmlspecialchars(ENT_QUOTES) */
export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** html_entity_decode(ENT_QUOTES | ENT_HTML5) cho các thực thể thường gặp */
export function decodeEntities(s: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', middot: '·', copy: '©', times: '×', rarr: '→', larr: '←' };
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return named[e.toLowerCase()] ?? m;
  });
}
