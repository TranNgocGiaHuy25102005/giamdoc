import { NextResponse, type NextRequest } from 'next/server';
import { parsePhpForm, str } from '@/lib/admin/form';
import { ADMIN_COOKIE, cookieOpts, decodeSession, encodeSession, newSession, verifyPassword } from '@/lib/admin/session';
import { HANDLERS } from '@/lib/admin/registry';
import { config } from '@/lib/config';
import { flushContent, syncContent } from '@/lib/json-file';
import type { AdminResult } from '@/lib/admin/types';

/**
 * Port phần xử lý POST của admin/index.php. Mọi form trang admin gửi về đây:
 * kiểm tra CSRF → đăng nhập / đăng xuất / các tab lưu dữ liệu → chuyển hướng 303 về /admin (hoặc trả JSON cho AJAX).
 * Lỗi được báo lại qua cookie ngắn hạn "cp_admin_flash".
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FLASH = 'cp_admin_flash';

export async function GET(req: NextRequest) {
  return new NextResponse(null, { status: 303, headers: { Location: '/admin' } });
}

export async function POST(req: NextRequest) {
  const secure = req.nextUrl.protocol === 'https:';
  const back = (path: string, flash?: { key: string; msg: string }) => {
    // Location tương đối: đúng cả khi chạy sau IIS reverse proxy
    const res = new NextResponse(null, { status: 303, headers: { Location: path } });
    if (flash) res.cookies.set(FLASH, encodeURIComponent(JSON.stringify(flash)), { ...cookieOpts(secure), httpOnly: false, maxAge: 60 });
    else res.cookies.set(FLASH, '', { ...cookieOpts(secure), maxAge: 0 }); // xoá lỗi cũ (cookie còn hạn 60s)
    res.headers.set('Cache-Control', 'no-store, private');
    return res;
  };

  let session = decodeSession(req.cookies.get(ADMIN_COOKIE)?.value);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return back('/admin', { key: 'error', msg: 'Dữ liệu gửi lên vượt quá giới hạn của máy chủ. Mỗi ảnh tối đa 5 MB; hãy giảm dung lượng ảnh.' });
  }
  // Trên Vercel: tệp đã được trình duyệt tải thẳng lên Blob (tmp/) — lấy lại về đây để xử lý như tệp tải lên thường
  const tmpBlobs: string[] = [];
  if ([...form.keys()].some((k) => k.startsWith('__blob__'))) {
    const next = new FormData();
    for (const [k, v] of form.entries()) {
      if (!k.startsWith('__blob__')) {
        next.append(k, v);
        continue;
      }
      const url = String(v);
      let u: URL;
      try {
        u = new URL(url);
      } catch {
        continue;
      }
      if (u.protocol !== 'https:' || !u.hostname.endsWith('.blob.vercel-storage.com') || !u.pathname.startsWith('/tmp/')) continue;
      tmpBlobs.push(url);
      const r = await fetch(url);
      if (!r.ok) continue;
      const name = decodeURIComponent(u.pathname.split('/').pop() ?? 'file');
      next.append(k.slice(8), new File([await r.arrayBuffer()], name, { type: r.headers.get('content-type') ?? '' }));
    }
    form = next;
  }
  const { post, files } = parsePhpForm(form);
  const isAjax = 'ml_collect' in post || 'ml_translate_step' in post || 'news_upload' in post;

  // Lần đầu vào trang chưa có phiên → form đăng nhập không có token (cookie SameSite=Lax vẫn chặn gửi chéo trang)
  const firstLogin = !session && 'login_password' in post;
  if (!firstLogin && (!session || str(post.csrf_token) !== session.csrf)) {
    if (isAjax) return NextResponse.json({ ok: false, error: 'Phiên làm việc đã hết hạn. Vui lòng tải lại trang và thử lại.' });
    return back('/admin', { key: 'error', msg: 'Phiên làm việc đã hết hạn. Vui lòng tải lại trang và thử lại.' });
  }
  const idle = !!session && Date.now() / 1000 - session.last > 7200;

  if ('login_password' in post) {
    if (verifyPassword(str(post.login_password))) {
      const res = back('/admin');
      res.cookies.set(ADMIN_COOKIE, encodeSession(newSession(true)), cookieOpts(secure));
      return res;
    }
    return back('/admin', {
      key: 'error',
      msg: config.adminPasswordHash ? 'Mật khẩu không chính xác.' : 'Chưa cấu hình mật khẩu quản trị. Hãy làm theo hướng dẫn cài đặt.',
    });
  }
  if ('logout' in post) {
    const res = back('/admin');
    res.cookies.set(ADMIN_COOKIE, encodeSession(newSession(false)), cookieOpts(secure));
    return res;
  }
  if (!session || !session.ok || idle) {
    if (isAjax) return NextResponse.json({ ok: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    return back('/admin');
  }

  // làm mới thời điểm hoạt động
  session = { ...session, last: Math.floor(Date.now() / 1000) };
  await syncContent();
  const handler = HANDLERS.find((h) => h.match(post))!;
  let result: AdminResult;
  try {
    result = await handler.handle({ post, files });
    // chế độ MySQL (Vercel): chờ ghi xong trước khi trả kết quả
    if (!(await flushContent()) && !('error' in result)) {
      result = { error: { key: 'error', msg: 'Không lưu được dữ liệu vào MySQL (bảng content_files). Kiểm tra kết nối database.' }, redirect: '/admin' };
    }
  } catch (e) {
    console.error('[admin]', e);
    result = { error: { key: 'error', msg: (e as Error).message || 'Đã xảy ra lỗi.' }, redirect: '/admin' };
  }
  let res: NextResponse;
  if ('json' in result) res = NextResponse.json(result.json, { headers: { 'Cache-Control': 'no-store' } });
  else if ('error' in result) res = back(result.redirect, result.error);
  else res = back(result.redirect);
  res.cookies.set(ADMIN_COOKIE, encodeSession(session), cookieOpts(secure));
  if (tmpBlobs.length) {
    try {
      const { del } = await import('@vercel/blob');
      await del(tmpBlobs);
    } catch {}
  }
  return res;
}
