import { NextResponse, type NextRequest } from 'next/server';

const CODES = ['VN', 'US', 'CA', 'EU', 'AU', 'SG', 'PH', 'JP', 'KR', 'TW', 'CN', 'TH', 'LA', 'BR'];

/**
 * Port phần đầu của i18n_boot():
 *  - ?country=XX → ghi cookie cp_country (1 năm) và báo cho trang qua header
 *  - ?lang_src=1 → trang luôn Tiếng Việt (admin quét nội dung gốc để dịch)
 * Việc kiểm tra quốc gia có đang bật hay không được làm phía server (lib/i18n/current.ts).
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.delete('x-cp-country');
  headers.delete('x-cp-src');
  const reqCode = (url.searchParams.get('country') ?? '').slice(0, 2).toUpperCase();
  const src = url.searchParams.has('lang_src');
  if (src) headers.set('x-cp-src', '1');
  if (reqCode && CODES.includes(reqCode) && !src) headers.set('x-cp-country', reqCode);
  headers.set('x-cp-path', url.pathname + url.search);
  // CSRF (double-submit cookie) — thay cho $_SESSION['csrf_token'] của PHP
  let csrf = req.cookies.get('cp_csrf')?.value ?? '';
  const newCsrf = !/^[a-f0-9]{64}$/.test(csrf);
  if (newCsrf) {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    csrf = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  }
  headers.set('x-cp-csrf', csrf);

  const res = NextResponse.next({ request: { headers } });
  if (reqCode && CODES.includes(reqCode) && !src) {
    res.cookies.set('cp_country', reqCode, {
      maxAge: 31536000,
      path: '/',
      sameSite: 'lax',
      secure: url.protocol === 'https:',
    });
  }
  if (newCsrf) {
    res.cookies.set('cp_csrf', csrf, { httpOnly: true, sameSite: 'lax', path: '/', secure: url.protocol === 'https:' });
  }
  res.headers.set('Vary', 'Cookie');
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|images|favicon|apple-touch-icon|admin).*)'],
};
