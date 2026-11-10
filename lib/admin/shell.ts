import 'server-only';
import { h } from './html';
import type { AdminState } from './types';
import { renderContentNav, renderContentPanes } from './panes/content';

/** Khung trang admin (port phần HTML của admin/index.php) — trả chuỗi HTML phần <body> */

const ICON = {
  ext: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  out: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
};

export function headerHtml(loggedIn: boolean, csrf: string): string {
  return `<header class="top">
    <div class="brand"><div class="brand-logo">C</div><div class="brand-text"><strong>CHUNORA PET</strong><span>Hệ thống quản trị nội dung</span></div></div>
    <div class="top-actions">
        <a class="button outline" href="/" target="_blank" rel="noopener">${ICON.ext} Xem Website</a>
        ${loggedIn ? `<form method="post" action="/admin/action"><input type="hidden" name="csrf_token" value="${h(csrf)}">
            <button class="button danger" type="submit" name="logout" value="1">${ICON.out} Đăng xuất</button></form>` : ''}
    </div>
</header>`;
}

export function loginHtml(st: AdminState, hasPassword: boolean): string {
  const error = st.flash?.msg ?? '';
  return `<main class="login-wrapper">
    <section class="panel login">
        <div class="login-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
        <h1>Đăng nhập Quản trị</h1>
        <p>Nhập mật khẩu quản trị viên để chỉnh sửa nội dung CHUNORA PET.</p>
        ${error ? `<div class="alert error">${h(error)}</div>` : ''}
        ${hasPassword ? '' : '<div class="hint-box">Cần đặt mật khẩu quản trị (ADMIN_PASSWORD_HASH trong <code>.env.local</code>) trước khi đăng nhập. Xem hướng dẫn cài đặt để tạo password hash.</div>'}
        <form method="post" action="/admin/action">
            <input type="hidden" name="csrf_token" value="${h(st.csrf)}">
            <label for="login_password" style="font-weight:600;font-size:13px">Mật khẩu quản trị</label>
            <div class="password-field">
                <input id="login_password" name="login_password" type="password" required autocomplete="current-password" placeholder="••••••••••••">
                <button type="button" class="toggle-pwd" id="togglePwd" title="Hiện/Ẩn mật khẩu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            </div>
            <button class="button primary" type="submit" style="width:100%;padding:12px">Đăng nhập hệ thống</button>
        </form>
    </section>
</main>`;
}

const NAV_EXTRA = `
<button type="button" class="nav-tab" data-target="pane-muaban"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg><span>Mua bán chó mèo</span></button>
<button type="button" class="nav-tab" data-target="pane-care"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="11" r="1.8"/><circle cx="9.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18.5" cy="11" r="1.8"/><path d="M12 12c-3 0-5.5 3-5.5 5.2 0 1.7 1.3 2.3 2.7 2.3 1 0 1.8-.5 2.8-.5s1.8.5 2.8.5c1.4 0 2.7-.6 2.7-2.3C17.5 15 15 12 12 12Z"/></svg><span>Quản lý Chăm Sóc Store</span></button>
<button type="button" class="nav-tab" data-target="pane-transport"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg><span>Quản lý Vận Chuyển</span></button>
<button type="button" class="nav-tab" data-target="pane-about"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01"/></svg><span>Quản lý Về Chunora</span></button>
<button type="button" class="nav-tab" data-target="pane-news"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h13a3 3 0 0 1 3 3v12a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>📰 Quản lý Tin Tức (SEO)</span></button>
<button type="button" class="nav-tab" data-target="pane-multilang"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg><span>🌍 Đa Quốc Gia &amp; Dịch Thuật</span></button>`;

export function dashboardHtml(st: AdminState, content: Record<string, unknown>, panes: string[], loadError: string): string {
  const csrf = h(st.csrf);
  const error = st.flash?.key === 'error' ? st.flash.msg : loadError;
  const hidden = (id: string, extra = '', multipart = true) =>
    `<form method="post"${multipart ? ' enctype="multipart/form-data"' : ''} id="${id}" action="/admin/action"><input type="hidden" name="csrf_token" value="${csrf}">${extra}</form>`;
  return `<main class="wrap">
    ${st.q.saved !== undefined ? `<div class="alert" id="saveAlert"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Đã lưu toàn bộ thay đổi lên website thành công!</span></div>` : ''}
    ${error ? `<div class="alert error"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${h(error)}</span></div>` : ''}
    <form method="post" enctype="multipart/form-data" id="adminForm" action="/admin/action">
        <input type="hidden" name="csrf_token" value="${csrf}">
        <div class="dashboard-grid">
            <div class="sidebar-col">
            <aside class="sidebar">
                <div class="sidebar-title">Danh mục nội dung</div>
                <nav class="nav-list">
                    ${renderContentNav(content)}
                    <button type="button" class="nav-tab" data-target="pane-footer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg><span>Cấu hình Footer</span></button>
                    <button type="button" class="nav-tab" data-target="all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Xem tất cả cùng lúc</span></button>
                </nav>
            </aside>
            <aside class="sidebar">
                <div class="sidebar-title">Nội dung navbar</div>
                <nav class="nav-list">${NAV_EXTRA}</nav>
            </aside>
            </div>
            <div class="content-panes">
                ${renderContentPanes(content)}
                ${panes.join('\n')}
            </div>
        </div>
        <div class="sticky-actions">
            <div class="sticky-actions-inner">
                <div class="save-status" id="unsavedStatus"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Thay đổi sẽ được lưu trực tiếp vào cơ sở dữ liệu MySQL.</span></div>
                <div class="actions">
                    <a class="button outline" href="/" target="_blank" rel="noopener">Xem trang chủ</a>
                    <button class="button primary" type="submit" id="submitBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>Lưu thay đổi</span></button>
                </div>
            </div>
        </div>
    </form>
    ${hidden('footerForm', '', false)}
    ${hidden('petForm', '<input type="hidden" name="pets_save" value="1">')}
    ${hidden('careForm', '<input type="hidden" name="care_save" value="1">')}
    ${hidden('transportForm', '<input type="hidden" name="transport_save" value="1">')}
    ${hidden('aboutForm', '<input type="hidden" name="about_save" value="1">')}
    ${hidden('newsForm', '<input type="hidden" name="news_save" value="1">')}
    ${hidden('mlForm', '<input type="hidden" name="ml_save" value="1">', false)}
    ${hidden('newsCatForm', '<input type="hidden" name="news_cats_save" value="1">', false)}
    ${hidden('newsDelForm', '<input type="hidden" name="news_delete" id="newsDelId" value="">', false)}
</main>`;
}
