/** htmlspecialchars(ENT_QUOTES) — dùng khi dựng HTML trang admin */
export function h(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
/** ' checked' / ' selected' / '' */
export const on = (cond: unknown, word = 'checked') => (cond ? ' ' + word : '');
