import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/admin/session';
import { dashboardHtml, headerHtml, loginHtml } from '@/lib/admin/shell';
import { PANES, PANE_SCRIPTS } from '@/lib/admin/registry';
import { loadSiteContent } from '@/lib/db';
import { config } from '@/lib/config';
import type { AdminState } from '@/lib/admin/types';
import { BlobUploader } from '@/components/admin/BlobUploader';
import './admin.css';

/**
 * Trang quản trị (port admin/index.php). Giao diện được dựng phía server giống hệt bản PHP;
 * các form gửi về /admin/action; JavaScript của từng tab nằm trong public/admin/*.js.
 */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Quản trị nội dung – CHUNORA PET' }, robots: { index: false, follow: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncContent();
  const sp = await searchParams;
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) q[k] = Array.isArray(v) ? v[0] ?? '' : v ?? '';
  const session = await getAdminSession();
  let flash: AdminState['flash'] = null;
  try {
    const raw = (await cookies()).get('cp_admin_flash')?.value;
    if (raw) flash = JSON.parse(decodeURIComponent(raw));
  } catch {}
  const loggedIn = !!session?.ok;
  const st: AdminState = { q, flash, csrf: session?.csrf ?? '' };

  let body: string;
  if (!loggedIn) {
    body = headerHtml(false, st.csrf) + loginHtml(st, !!config.adminPasswordHash);
  } else {
    let content: Record<string, unknown> = {};
    let loadError = '';
    try {
      content = await loadSiteContent();
    } catch (e) {
      console.error(e);
      loadError = 'Không đọc được dữ liệu website. Kiểm tra MySQL đang chạy và cấu hình database (.env.local).';
    }
    const panes: string[] = [];
    for (const render of PANES) {
      try {
        panes.push(await render(st));
      } catch (e) {
        console.error('[admin pane]', e);
        panes.push(`<section class="panel section-pane"><div class="alert error">Lỗi dựng tab: ${String((e as Error).message).replace(/</g, '&lt;')}</div></section>`);
      }
    }
    body = headerHtml(true, st.csrf) + dashboardHtml(st, content, panes, loadError);
  }

  const state = JSON.stringify({ q, flashKey: flash?.key ?? '', csrf: st.csrf, maxImage: 5 * 1024 * 1024 }).replace(/</g, '\\u003c');
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.ADMIN_STATE=${state};` }} />
      <div id="admin-root" dangerouslySetInnerHTML={{ __html: body }} />
      <Script src="/admin/admin.js?v=1" strategy="afterInteractive" />
      {loggedIn && process.env.BLOB_READ_WRITE_TOKEN && <BlobUploader />}
      {loggedIn && PANE_SCRIPTS.map((s) => <Script key={s} src={`/admin/${s}.js?v=1`} strategy="afterInteractive" />)}
    </>
  );
}
