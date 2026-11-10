/** Đổi link kiểu cũ (.php) sang URL mới của bản Next.js — tránh 1 lần chuyển hướng 301. */
const MAP: [RegExp, string][] = [
  [/^\/index\.php(?=$|[?#])/, '/'],
  [/^\/mua-ban\/chi-tiet\/(index\.php)?(?=$|[?#])/, '/mua-ban/chi-tiet'],
  [/^\/mua-ban\/(index\.php)?(?=$|[?#])/, '/mua-ban'],
  [/^\/lien-he\.php(?=$|[?#])/, '/#lien-he'],
  [/^\/admin\/(index\.php)?(?=$|[?#])/, '/admin'],
  [/^\/([a-z0-9-]+)\.php(?=$|[?#])/, '/$1'],
];

export function cleanHref(url: string): string {
  if (!url || !url.startsWith('/')) return url;
  for (const [re, to] of MAP) if (re.test(url)) return url.replace(re, to);
  return url;
}

/** footer_href(): '#neo' → '/#neo', '/x' → '/x', http(s) giữ nguyên */
export function siteHref(url: string): string {
  if (!url) return '';
  if (url[0] === '#') return '/' + url;
  if (url[0] === '/') return cleanHref(url);
  return url;
}
