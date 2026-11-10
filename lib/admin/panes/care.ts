import 'server-only';
import { h } from '../html';
import { flashFor, type AdminState } from '../types';
import { careLoadWithSource } from '../../stores/care';

/** Tab "Quản lý Chăm Sóc Store" (dữ liệu content/care_service_data.json) — port nguyên từ admin/index.php */

type Row = Record<string, string | undefined>;

/** Đường dẫn ảnh xem trước: http(s) giữ nguyên, còn lại thêm '/' */
const thumbOf = (src: string): string =>
  src !== '' ? '<img src="' + h((/^https?:\/\//i.test(src) ? '' : '/') + src) + '" alt="">' : '<span>Chưa có ảnh</span>';

/** care_row(): một dòng có thể thêm/sửa/xóa trong form Chăm sóc. n = tiền tố name, v = giá trị hiện có. */
export function careRow(kind: string, n: string, v: Row, fk = ''): string {
  const x = (k: string): string => h(v[k] ?? '');
  const inp = (name: string, val: string, ph: string, cls = ''): string =>
    '<input form="careForm" class="cr-in ' + cls + '" name="' + h(name) + '" value="' + val + '" placeholder="' + h(ph) + '" maxlength="400">';
  const tools = '<div class="cr-tools"><button type="button" class="cr-ib cr-up" title="Lên" aria-label="Lên">↑</button><button type="button" class="cr-ib cr-down" title="Xuống" aria-label="Xuống">↓</button><button type="button" class="cr-ib cr-del" title="Xóa dòng" aria-label="Xóa dòng">✕</button></div>';
  switch (kind) {
    case 'pair': { // đầu việc / tiện ích: ảnh + tiêu đề + mô tả (bấm thẻ ngoài website sẽ hiện ảnh này)
      const src = v.image ?? '';
      return '<div class="cr-row cr-pairrow" data-kind="pair"><div class="cr-thumb">' + thumbOf(src) + '</div>'
        + '<div class="cr-imgcol"><input form="careForm" type="hidden" class="cr-src" name="' + h(n) + '[image]" value="' + h(src) + '">'
        + '<label class="cr-up-btn">Ảnh<input form="careForm" type="file" class="cr-gfile" name="' + h(fk) + '[__K__]" accept="image/*" hidden></label></div>'
        + '<div class="cr-cols cr-cols-pair">'
        + inp(n + '[title]', x('title'), 'Tiêu đề (VD: Tắm dưỡng)')
        + inp(n + '[desc]', x('desc'), 'Mô tả ngắn') + '</div>' + tools + '</div>';
    }
    case 'price': // gói giá: tên gói + hạng cân + giá
      return '<div class="cr-row" data-kind="price"><div class="cr-cols cr-cols-price">'
        + inp(n + '[name]', x('name'), 'Tên gói (VD: Tắm sấy cơ bản)')
        + inp(n + '[weight]', x('weight'), 'Hạng cân (VD: Dưới 5 kg)')
        + inp(n + '[price]', x('price'), 'Giá (VD: 150.000đ)') + '</div>' + tools + '</div>';
    case 'service': // dịch vụ trong form đặt lịch
      return '<div class="cr-row" data-kind="service"><div class="cr-cols">'
        + inp(n, h(v.value ?? ''), 'Tên dịch vụ (VD: Tắm sấy)') + '</div>' + tools + '</div>';
    case 'gallery': { // ảnh thư viện: ảnh hiện có/ tải mới + mô tả
      const src = v.src ?? '';
      return '<div class="cr-row cr-gal" data-kind="gallery"><div class="cr-thumb">' + thumbOf(src) + '</div><div class="cr-cols cr-gcols">'
        + '<input form="careForm" type="hidden" class="cr-src" name="' + h(n) + '[src]" value="' + h(src) + '">'
        + '<label class="cr-up-btn">Chọn ảnh<input form="careForm" type="file" class="cr-gfile" name="care_gal[__K__]" accept="image/*" hidden></label>'
        + inp(n + '[alt]', x('alt'), 'Mô tả ảnh (SEO, không bắt buộc)') + '</div>' + tools + '</div>';
    }
  }
  return '';
}

/** care_image_field(): khối ảnh đơn (Spa / Khách sạn): xem trước + chọn ảnh mới. */
export function careImageField(key: string, label: string, src: string): string {
  return '<div class="cr-field"><label>' + h(label) + '</label><div class="cr-img"><div class="cr-thumb cr-thumb-lg">' + thumbOf(src) + '</div><div>'
    + '<input form="careForm" type="hidden" class="cr-src" name="care[' + key + '][image]" value="' + h(src) + '">'
    + '<label class="cr-up-btn">Tải ảnh lên<input form="careForm" type="file" class="cr-single" name="care_img_' + key + '" accept="image/*" hidden></label>'
    + '<p class="cr-hint">Ảnh bất kỳ, tự chuyển sang WebP, tối đa 5 MB. Để trống sẽ hiện khung mặc định.</p></div></div></div>';
}

/** care_field(): ô nhập một dòng trong form Chăm sóc. */
export function careField(label: string, name: string, val: string, multi = false, hint = ''): string {
  const ctl = multi
    ? '<textarea form="careForm" class="cr-in" name="' + h(name) + '" rows="3">' + h(val) + '</textarea>'
    : '<input form="careForm" class="cr-in" name="' + h(name) + '" value="' + h(val) + '">';
  return '<div class="cr-field"><label>' + h(label) + '</label>' + ctl + (hint !== '' ? '<p class="cr-hint">' + h(hint) + '</p>' : '') + '</div>';
}

/** Các dòng hiện có: thay __K__ bằng chỉ số (khớp tên ô file với dòng) */
const rowsK = (rows: Row[], kind: string, prefix: string, fk = ''): string =>
  rows.map((r, i) => careRow(kind, prefix + '[' + i + ']', r, fk).replace(/__K__/g, String(i))).join('');
const rowsPlain = (rows: Row[], kind: string, prefix: string): string =>
  rows.map((r, i) => careRow(kind, prefix + '[' + i + ']', r)).join('');

export async function renderCarePane(st: AdminState): Promise<string> {
  const { data: careData, fromFile: careFromFile } = careLoadWithSource();
  const careError = flashFor(st, 'careError');
  const saved = st.q.care_saved !== undefined;
  const svRows: Row[] = careData.booking.services.map((s) => ({ value: s }));
  const asRows = (a: object[]): Row[] => a as unknown as Row[];
  return `
                <section class="panel section-pane" id="pane-care">
                    <div class="panel-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="11" r="1.8"/><circle cx="9.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18.5" cy="11" r="1.8"/><path d="M12 12c-3 0-5.5 3-5.5 5.2 0 1.7 1.3 2.3 2.7 2.3 1 0 1.8-.5 2.8-.5s1.8.5 2.8.5c1.4 0 2.7-.6 2.7-2.3C17.5 15 15 12 12 12Z"/></svg>
                            Quản lý Chăm Sóc Store
                        </h2>
                        <a class="button outline btn-sm" href="/cham-soc-tai-store" target="_blank" rel="noopener">Xem trang Chăm sóc</a>
                    </div>
                    <style>
#pane-care{--primary:#0F3D8A;--accent:#2563EB;--text:#0F172A;--muted:#64748B;--border:#E2E8F0;--ok-bg:#ECFDF5;--ok:#065F46;--ok-b:#A7F3D0;--danger-bg:#FEF2F2;--danger:#991B1B}
#pane-care *{box-sizing:border-box}
#pane-care .cr-lead{color:var(--muted);margin:0 0 16px}
#pane-care .cr-msg{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-weight:500}
#pane-care .cr-msg.ok{background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-b)}
#pane-care .cr-msg.bad{background:var(--danger-bg);color:var(--danger);border:1px solid #FECACA}
#pane-care .cr-card{background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06);margin-bottom:18px;overflow:hidden}
#pane-care .cr-card>h3{margin:0;padding:14px 18px;background:#F8FAFC;border-bottom:1px solid var(--border);font-size:15px;color:var(--text);display:flex;align-items:center;gap:10px}
#pane-care .cr-body{padding:18px;display:grid;gap:14px}
#pane-care .cr-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#pane-care .cr-field>label,#pane-care .cr-sub{display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}
#pane-care .cr-hint{font-size:12.5px;color:var(--muted);margin:5px 0 0}
#pane-care .cr-in{width:100%;border:1px solid #CBD5E1;border-radius:9px;padding:9px 12px;font:500 14px 'Be Vietnam Pro',sans-serif;color:var(--text);background:#fff;min-width:0}
#pane-care .cr-in:focus{outline:2px solid #BFDBFE;border-color:var(--accent)}
#pane-care textarea.cr-in{resize:vertical}
#pane-care .cr-list{display:grid;gap:8px}
#pane-care .cr-row{display:flex;gap:8px;align-items:center;background:#F8FAFC;border:1px solid var(--border);border-radius:11px;padding:8px}
#pane-care .cr-cols{flex:1;display:grid;gap:8px;min-width:0}
#pane-care .cr-cols-pair{grid-template-columns:1fr 2fr}
#pane-care .cr-pairrow .cr-thumb{width:72px;height:56px}
#pane-care .cr-imgcol{flex:0 0 auto}
#pane-care .cr-cols-price{grid-template-columns:1.6fr 1fr 1fr}
#pane-care .cr-tools{display:flex;gap:4px;flex:0 0 auto}
#pane-care .cr-ib{border:1px solid var(--border);background:#fff;border-radius:8px;width:32px;height:32px;cursor:pointer;font-weight:700;color:#334155}
#pane-care .cr-ib:hover{background:#F1F5F9}
#pane-care .cr-del{color:#B91C1C}
#pane-care .cr-add{align-self:start;border:1.5px dashed #93C5FD;background:#EFF6FF;color:var(--primary);border-radius:10px;padding:9px 16px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer}
#pane-care .cr-add:hover{background:#DBEAFE}
#pane-care .cr-up-btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #BFDBFE;background:#EFF6FF;color:var(--primary);border-radius:9px;padding:8px 14px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer;white-space:nowrap}
#pane-care .cr-img{display:flex;gap:16px;align-items:flex-start}
#pane-care .cr-thumb{width:84px;height:64px;border-radius:9px;border:1px dashed #CBD5E1;background:#F8FAFC;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;text-align:center}
#pane-care .cr-thumb-lg{width:150px;height:110px}
#pane-care .cr-thumb img{width:100%;height:100%;object-fit:cover;display:block}
#pane-care .cr-gcols{grid-template-columns:auto 1fr;align-items:center}
#pane-care .cr-fname{font-size:12px;color:var(--muted)}
#pane-care .cr-tabs-sub{display:grid;gap:18px;grid-template-columns:1fr 1fr}
#pane-care .cr-save{position:sticky;bottom:0;z-index:5;background:#fff;border-top:1px solid var(--border);padding:14px 0;margin-top:6px}
#pane-care .cr-save button{width:100%;border:0;border-radius:12px;padding:16px;background:var(--primary);color:#fff;font:800 15px 'Be Vietnam Pro',sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 20px -10px rgba(15,61,138,.7)}
#pane-care .cr-save button:hover{background:var(--accent)}
#pane-care .cr-save button[disabled]{opacity:.7;cursor:wait}
@media(max-width:900px){#pane-care .cr-grid2,#pane-care .cr-tabs-sub,#pane-care .cr-cols-pair,#pane-care .cr-cols-price{grid-template-columns:1fr}#pane-care .cr-img{flex-direction:column}}
</style>
                    <p class="cr-lead">Chỉnh nội dung 4 phần của trang <strong>/cham-soc-tai-store</strong>. Dữ liệu lưu trong <code>content/care_service_data.json</code>.</p>
                    ${saved ? '<div class="cr-msg ok">Đã lưu cấu hình trang Chăm sóc. Website đã được cập nhật.</div>' : ''}
                    ${careError ? `<div class="cr-msg bad">${h(careError)}</div>` : ''}
                    ${!careFromFile && !saved && !careError ? '<div class="cr-msg ok" style="background:#EFF6FF;color:#1E3A8A;border-color:#BFDBFE">Đang hiển thị nội dung mặc định. Bấm <strong>Lưu cấu hình</strong> để tạo file dữ liệu.</div>' : ''}

                    <!-- Hộp 1: Spa & Grooming -->
                    <div class="cr-card"><h3>Spa, tắm sấy &amp; cắt tỉa</h3><div class="cr-body">
                        <div class="cr-grid2">${careField('Huy hiệu nhỏ', 'care[spa][badge]', careData.spa.badge)}${careField('Chữ trên nút (cuộn xuống form)', 'care[spa][cta]', careData.spa.cta)}</div>
                        ${careField('Tiêu đề', 'care[spa][title]', careData.spa.title)}
                        ${careField('Mô tả ngắn', 'care[spa][desc]', careData.spa.desc, true)}
                        ${careImageField('spa', 'Ảnh minh họa', careData.spa.image)}
                        <div>
                            <span class="cr-sub">Các bước / đầu việc dịch vụ</span>
                            <div class="cr-list" data-list="care[spa][steps]" data-kind="pair">
                                ${rowsK(asRows(careData.spa.steps), 'pair', 'care[spa][steps]', 'care_step_spa')}
                            </div>
                            <button type="button" class="cr-add" data-add="care[spa][steps]" style="margin-top:8px">+ Thêm bước</button>
                            <template data-tpl="care[spa][steps]">${careRow('pair', 'care[spa][steps][__I__]', {}, 'care_step_spa')}</template>
                        </div>
                    </div></div>

                    <!-- Hộp 2: Khách sạn VIP -->
                    <div class="cr-card"><h3>Khách sạn lưu trú VIP</h3><div class="cr-body">
                        <div class="cr-grid2">${careField('Huy hiệu nhỏ', 'care[hotel][badge]', careData.hotel.badge)}${careField('Chữ trên nút (cuộn xuống form)', 'care[hotel][cta]', careData.hotel.cta)}</div>
                        ${careField('Tiêu đề', 'care[hotel][title]', careData.hotel.title)}
                        ${careField('Mô tả', 'care[hotel][desc]', careData.hotel.desc, true)}
                        ${careImageField('hotel', 'Ảnh minh họa', careData.hotel.image)}
                        <div>
                            <span class="cr-sub">Tiện ích phòng VIP</span>
                            <div class="cr-list" data-list="care[hotel][features]" data-kind="pair">
                                ${rowsK(asRows(careData.hotel.features), 'pair', 'care[hotel][features]', 'care_step_hotel')}
                            </div>
                            <button type="button" class="cr-add" data-add="care[hotel][features]" style="margin-top:8px">+ Thêm tiện ích</button>
                            <template data-tpl="care[hotel][features]">${careRow('pair', 'care[hotel][features][__I__]', {}, 'care_step_hotel')}</template>
                        </div>
                    </div></div>

                    <!-- Hộp 3: Bảng giá -->
                    <div class="cr-card"><h3>Bảng giá dịch vụ</h3><div class="cr-body">
                        ${careField('Tiêu đề', 'care[pricing][title]', careData.pricing.title)}
                        ${careField('Mô tả', 'care[pricing][desc]', careData.pricing.desc, true)}
                        <div class="cr-grid2">${careField('Tên tab 1', 'care[pricing][spa_tab]', careData.pricing.spa_tab)}${careField('Tên tab 2', 'care[pricing][hotel_tab]', careData.pricing.hotel_tab)}</div>
                        <div class="cr-tabs-sub">
                        <div>
                            <span class="cr-sub">Gói Spa & Grooming (tên gói · hạng cân · giá)</span>
                            <div class="cr-list" data-list="care[pricing][spa]" data-kind="price">
                                ${rowsPlain(asRows(careData.pricing.spa), 'price', 'care[pricing][spa]')}
                            </div>
                            <button type="button" class="cr-add" data-add="care[pricing][spa]" style="margin-top:8px">+ Thêm gói Spa</button>
                            <template data-tpl="care[pricing][spa]">${careRow('price', 'care[pricing][spa][__I__]', {})}</template>
                        </div>
                        <div>
                            <span class="cr-sub">Gói Khách sạn VIP (tên gói · hạng cân · giá)</span>
                            <div class="cr-list" data-list="care[pricing][hotel]" data-kind="price">
                                ${rowsPlain(asRows(careData.pricing.hotel), 'price', 'care[pricing][hotel]')}
                            </div>
                            <button type="button" class="cr-add" data-add="care[pricing][hotel]" style="margin-top:8px">+ Thêm gói lưu trú</button>
                            <template data-tpl="care[pricing][hotel]">${careRow('price', 'care[pricing][hotel][__I__]', {})}</template>
                        </div>
                        </div>
                        ${careField('Ghi chú dưới bảng giá', 'care[pricing][note]', careData.pricing.note, true)}
                    </div></div>

                    <!-- Hộp 4: Thư viện ảnh + Form đặt lịch -->
                    <div class="cr-card"><h3>Thư viện ảnh &amp; Form đặt lịch</h3><div class="cr-body">
                        ${careField('Tiêu đề thư viện ảnh', 'care[gallery][title]', careData.gallery.title)}
                        <div>
                            <span class="cr-sub">Ảnh không gian store</span>
                            <div class="cr-list" data-list="care[gallery][images]" data-kind="gallery">
                                ${rowsK(asRows(careData.gallery.images), 'gallery', 'care[gallery][images]')}
                            </div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                                <button type="button" class="cr-add" data-add="care[gallery][images]">+ Thêm 1 ảnh</button>
                                <label class="cr-add" style="cursor:pointer">+ Tải nhiều ảnh cùng lúc<input form="careForm" type="file" id="crGalMulti" multiple hidden accept="image/*"></label>
                            </div>
                            <template data-tpl="care[gallery][images]">${careRow('gallery', 'care[gallery][images][__I__]', {})}</template>
                        </div>
                        <hr style="border:0;border-top:1px solid var(--border);width:100%">
                        ${careField('Tiêu đề form đặt lịch', 'care[booking][title]', careData.booking.title)}
                        ${careField('Lời dẫn dưới tiêu đề', 'care[booking][desc]', careData.booking.desc, true)}
                        <div class="cr-grid2">${careField('Số hotline hiển thị', 'care[booking][hotline]', careData.booking.hotline, false, 'Để trống sẽ dùng hotline ở "Thông tin liên hệ". Thông báo yêu cầu đặt lịch gửi qua email/Messenger đã cấu hình trong config.php.')}${careField('Chữ trên nút gửi', 'care[booking][submit]', careData.booking.submit)}</div>
                        <div>
                            <span class="cr-sub">Danh sách "Dịch vụ cần đặt" trong form</span>
                            <div class="cr-list" data-list="care[booking][services]" data-kind="service">
                                ${rowsPlain(svRows, 'service', 'care[booking][services]')}
                            </div>
                            <button type="button" class="cr-add" data-add="care[booking][services]" style="margin-top:8px">+ Thêm dịch vụ</button>
                            <template data-tpl="care[booking][services]">${careRow('service', 'care[booking][services][__I__]', {})}</template>
                        </div>
                    </div></div>

                    <div class="cr-save"><button type="submit" form="careForm" id="careSaveBtn">LƯU CẤU HÌNH TRANG CHĂM SÓC</button></div>
                </section>
`;
}
