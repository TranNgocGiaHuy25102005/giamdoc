import 'server-only';
import { h } from '../html';
import { flashFor, type AdminState } from '../types';
import { transportLoadInfo } from '../../stores/transport';

/** Tab "Quản lý Vận Chuyển" (dữ liệu content/transport_service_data.json) — port nguyên từ admin/index.php */

type Row = Record<string, string | undefined>;

const thumbOf = (src: string): string =>
  src !== '' ? '<img src="' + h((/^https?:\/\//i.test(src) ? '' : '/') + src) + '" alt="">' : '<span>Chưa có ảnh</span>';

/** tp_row(): một dòng thêm/sửa/xóa. kind: step (tiêu đề + mô tả) | text (1 ô) | gallery (ảnh + mô tả). */
export function tpRow(kind: string, n: string, v: Row): string {
  const inp = (name: string, val: string, ph: string): string =>
    '<input form="transportForm" class="cr-in" name="' + h(name) + '" value="' + h(val) + '" placeholder="' + h(ph) + '" maxlength="400">';
  const tools = '<div class="cr-tools"><button type="button" class="cr-ib cr-up" title="Lên" aria-label="Lên">↑</button><button type="button" class="cr-ib cr-down" title="Xuống" aria-label="Xuống">↓</button><button type="button" class="cr-ib cr-del" title="Xóa dòng" aria-label="Xóa dòng">✕</button></div>';
  switch (kind) {
    case 'step':
      return '<div class="cr-row" data-kind="step"><div class="cr-cols cr-cols-pair">'
        + inp(n + '[title]', v.title ?? '', 'Tên chặng (VD: Tư vấn & Báo giá)')
        + inp(n + '[desc]', v.desc ?? '', 'Mô tả ngắn') + '</div>' + tools + '</div>';
    case 'text':
      return '<div class="cr-row" data-kind="text"><div class="cr-cols">' + inp(n, v.value ?? '', 'Tên quốc gia / thành phố') + '</div>' + tools + '</div>';
    case 'gallery': {
      const src = v.src ?? '';
      return '<div class="cr-row cr-gal" data-kind="gallery"><div class="cr-thumb">' + thumbOf(src) + '</div><div class="cr-cols cr-gcols">'
        + '<input form="transportForm" type="hidden" class="cr-src" name="' + h(n) + '[src]" value="' + h(src) + '">'
        + '<label class="cr-up-btn">Chọn ảnh<input form="transportForm" type="file" class="cr-gfile" name="tp_gal[__K__]" accept="image/*" hidden></label>'
        + inp(n + '[alt]', v.alt ?? '', 'Mô tả ảnh (SEO, không bắt buộc)') + '</div>' + tools + '</div>';
    }
  }
  return '';
}

/** tp_field() */
export function tpField(label: string, name: string, val: string, multi = false, hint = ''): string {
  const ctl = multi
    ? '<textarea form="transportForm" class="cr-in" name="' + h(name) + '" rows="3">' + h(val) + '</textarea>'
    : '<input form="transportForm" class="cr-in" name="' + h(name) + '" value="' + h(val) + '">';
  return '<div class="cr-field"><label>' + h(label) + '</label>' + ctl + (hint !== '' ? '<p class="cr-hint">' + h(hint) + '</p>' : '') + '</div>';
}

/** tp_image_field() */
export function tpImageField(fileKey: string, name: string, label: string, src: string): string {
  return '<div class="cr-field"><label>' + h(label) + '</label><div class="cr-img"><div class="cr-thumb cr-thumb-lg">' + thumbOf(src) + '</div><div>'
    + '<input form="transportForm" type="hidden" class="cr-src" name="' + h(name) + '" value="' + h(src) + '">'
    + '<label class="cr-up-btn">Tải ảnh lên<input form="transportForm" type="file" class="cr-single" name="' + h(fileKey) + '" accept="image/*" hidden></label>'
    + '<p class="cr-hint">Ảnh bất kỳ, tự chuyển sang WebP, tối đa 5 MB. Để trống sẽ dùng nền xanh than mặc định.</p></div></div></div>';
}

/** tp_list(): khối danh sách có thêm/xóa dòng. */
export function tpList(title: string, kind: string, prefix: string, rows: Row[], addLabel: string): string {
  let out = '<div><span class="cr-sub">' + h(title) + '</span><div class="cr-list" data-list="' + h(prefix) + '" data-kind="' + kind + '">';
  rows.forEach((r, i) => {
    out += tpRow(kind, prefix + '[' + i + ']', r).replace(/__K__/g, String(i));
  });
  return out + '</div><button type="button" class="cr-add" data-add="' + h(prefix) + '" style="margin-top:8px">+ ' + h(addLabel) + '</button>'
    + '<template data-tpl="' + h(prefix) + '">' + tpRow(kind, prefix + '[__I__]', {}) + '</template></div>';
}

const PILLAR_NAMES = ['Giấy tờ, kiểm dịch xuất nhập cảnh', 'Tư vấn tuyến bay và lồng vận chuyển', 'Cập nhật tình trạng trong hành trình'];

export async function renderTransportPane(st: AdminState): Promise<string> {
  const { data: tpData, fromFile: tpFromFile } = transportLoadInfo();
  const transportError = flashFor(st, 'transportError');
  const saved = st.q.transport_saved !== undefined;
  const vals = (a: string[]): Row[] => a.map((s) => ({ value: s }));
  const asRows = (a: object[]): Row[] => a as unknown as Row[];
  return `
                <section class="panel section-pane" id="pane-transport">
                    <div class="panel-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                            Quản lý Vận Chuyển
                        </h2>
                        <a class="button outline btn-sm" href="/van-chuyen-quoc-te" target="_blank" rel="noopener">Xem trang Vận chuyển</a>
                    </div>
                    <style>
#pane-transport{--primary:#0F3D8A;--accent:#2563EB;--text:#0F172A;--muted:#64748B;--border:#E2E8F0;--ok-bg:#ECFDF5;--ok:#065F46;--ok-b:#A7F3D0;--danger-bg:#FEF2F2;--danger:#991B1B}
#pane-transport *{box-sizing:border-box}
#pane-transport .cr-lead{color:var(--muted);margin:0 0 16px}
#pane-transport .cr-msg{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-weight:500}
#pane-transport .cr-msg.ok{background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-b)}
#pane-transport .cr-msg.bad{background:var(--danger-bg);color:var(--danger);border:1px solid #FECACA}
#pane-transport .cr-card{background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06);margin-bottom:18px;overflow:hidden}
#pane-transport .cr-card>h3{margin:0;padding:14px 18px;background:#F8FAFC;border-bottom:1px solid var(--border);font-size:15px;color:var(--text);display:flex;align-items:center;gap:10px}
#pane-transport .cr-body{padding:18px;display:grid;gap:14px}
#pane-transport .cr-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#pane-transport .cr-field>label,#pane-transport .cr-sub{display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}
#pane-transport .cr-hint{font-size:12.5px;color:var(--muted);margin:5px 0 0}
#pane-transport .cr-in{width:100%;border:1px solid #CBD5E1;border-radius:9px;padding:9px 12px;font:500 14px 'Be Vietnam Pro',sans-serif;color:var(--text);background:#fff;min-width:0}
#pane-transport .cr-in:focus{outline:2px solid #BFDBFE;border-color:var(--accent)}
#pane-transport textarea.cr-in{resize:vertical}
#pane-transport .cr-list{display:grid;gap:8px}
#pane-transport .cr-row{display:flex;gap:8px;align-items:center;background:#F8FAFC;border:1px solid var(--border);border-radius:11px;padding:8px}
#pane-transport .cr-cols{flex:1;display:grid;gap:8px;min-width:0}
#pane-transport .cr-cols-pair{grid-template-columns:1fr 2fr}
#pane-transport .cr-pairrow .cr-thumb{width:72px;height:56px}
#pane-transport .cr-imgcol{flex:0 0 auto}
#pane-transport .cr-cols-price{grid-template-columns:1.6fr 1fr 1fr}
#pane-transport .cr-tools{display:flex;gap:4px;flex:0 0 auto}
#pane-transport .cr-ib{border:1px solid var(--border);background:#fff;border-radius:8px;width:32px;height:32px;cursor:pointer;font-weight:700;color:#334155}
#pane-transport .cr-ib:hover{background:#F1F5F9}
#pane-transport .cr-del{color:#B91C1C}
#pane-transport .cr-add{align-self:start;border:1.5px dashed #93C5FD;background:#EFF6FF;color:var(--primary);border-radius:10px;padding:9px 16px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer}
#pane-transport .cr-add:hover{background:#DBEAFE}
#pane-transport .cr-up-btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #BFDBFE;background:#EFF6FF;color:var(--primary);border-radius:9px;padding:8px 14px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer;white-space:nowrap}
#pane-transport .cr-img{display:flex;gap:16px;align-items:flex-start}
#pane-transport .cr-thumb{width:84px;height:64px;border-radius:9px;border:1px dashed #CBD5E1;background:#F8FAFC;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;text-align:center}
#pane-transport .cr-thumb-lg{width:150px;height:110px}
#pane-transport .cr-thumb img{width:100%;height:100%;object-fit:cover;display:block}
#pane-transport .cr-gcols{grid-template-columns:auto 1fr;align-items:center}
#pane-transport .cr-fname{font-size:12px;color:var(--muted)}
#pane-transport .cr-tabs-sub{display:grid;gap:18px;grid-template-columns:1fr 1fr}
#pane-transport .cr-save{position:sticky;bottom:0;z-index:5;background:#fff;border-top:1px solid var(--border);padding:14px 0;margin-top:6px}
#pane-transport .cr-save button{width:100%;border:0;border-radius:12px;padding:16px;background:var(--primary);color:#fff;font:800 15px 'Be Vietnam Pro',sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 20px -10px rgba(15,61,138,.7)}
#pane-transport .cr-save button:hover{background:var(--accent)}
#pane-transport .cr-save button[disabled]{opacity:.7;cursor:wait}
@media(max-width:900px){#pane-transport .cr-grid2,#pane-transport .cr-tabs-sub,#pane-transport .cr-cols-pair,#pane-transport .cr-cols-price{grid-template-columns:1fr}#pane-transport .cr-img{flex-direction:column}}
</style>
                    <p class="cr-lead">Chỉnh nội dung trang <strong>/van-chuyen-quoc-te</strong>. Dữ liệu lưu trong <code>content/transport_service_data.json</code>.</p>
                    ${saved ? '<div class="cr-msg ok">Đã lưu cấu hình trang Vận chuyển. Website đã được cập nhật.</div>' : ''}
                    ${transportError ? `<div class="cr-msg bad">${h(transportError)}</div>` : ''}
                    ${!tpFromFile && !saved && !transportError ? '<div class="cr-msg ok" style="background:#EFF6FF;color:#1E3A8A;border-color:#BFDBFE">Đang hiển thị nội dung mặc định. Bấm <strong>Lưu cấu hình</strong> để tạo file dữ liệu.</div>' : ''}

                    <!-- Hộp Hero Banner -->
                    <div class="cr-card"><h3>Mở đầu trang (Hero Banner)</h3><div class="cr-body">
                        ${tpField('Huy hiệu nhỏ', 'tp[hero][badge]', tpData.hero.badge)}
                        ${tpField('Tiêu đề chính', 'tp[hero][title]', tpData.hero.title)}
                        ${tpField('Mô tả mở đầu', 'tp[hero][desc]', tpData.hero.desc, true)}
                        <div class="cr-grid2">${tpField('Chữ nút chính (cuộn xuống form)', 'tp[hero][cta_primary]', tpData.hero.cta_primary)}${tpField('Chữ nút phụ (Zalo / Hotline)', 'tp[hero][cta_secondary]', tpData.hero.cta_secondary)}</div>
                        ${tpImageField('tp_img_hero', 'tp[hero][image]', 'Ảnh nền', tpData.hero.image)}
                    </div></div>

                    <!-- Hộp 3 trụ cột dịch vụ -->
                    <div class="cr-card"><h3>Ba trụ cột dịch vụ</h3><div class="cr-body">
                        <p class="cr-hint" style="margin:0">Mỗi dòng trong nội dung sẽ hiện thành một gạch đầu dòng có dấu tick. Biểu tượng của từng trụ cột là cố định.</p>
                        ${tpData.pillars.map((pl, pi) => `
                        <div class="cr-card" style="margin:0"><h3>${h(PILLAR_NAMES[pi] ?? 'Trụ cột')}</h3><div class="cr-body">
                            ${tpField('Tiêu đề', 'tp[pillars][' + pi + '][title]', pl.title)}
                            ${tpField('Nội dung chi tiết (mỗi dòng một ý)', 'tp[pillars][' + pi + '][desc]', pl.desc, true)}
                        </div></div>
                        `).join('')}
                    </div></div>

                    <!-- Hộp Quy trình & Tuyến bay -->
                    <div class="cr-card"><h3>Hành trình của bé &amp; Phạm vi tuyến bay</h3><div class="cr-body">
                        ${tpField('Tiêu đề hành trình', 'tp[journey][title]', tpData.journey.title)}
                        ${tpField('Lời dẫn', 'tp[journey][desc]', tpData.journey.desc, true)}
                        ${tpList('Các chặng hành trình (tên và mô tả, theo thứ tự)', 'step', 'tp[journey][steps]', asRows(tpData.journey.steps), 'Thêm chặng')}
                        <hr style="border:0;border-top:1px solid var(--border);width:100%">
                        ${tpField('Tiêu đề phạm vi tuyến bay', 'tp[routes][title]', tpData.routes.title)}
                        ${tpField('Lời dẫn', 'tp[routes][desc]', tpData.routes.desc, true)}
                        <div class="cr-grid2">
                            <div style="display:grid;gap:14px">
                                ${tpField('Tên khung tuyến quốc tế', 'tp[routes][intl_title]', tpData.routes.intl_title)}
                                ${tpField('Mô tả', 'tp[routes][intl_desc]', tpData.routes.intl_desc, true)}
                                ${tpList('Quốc gia phục vụ', 'text', 'tp[routes][intl]', vals(tpData.routes.intl), 'Thêm quốc gia')}
                            </div>
                            <div style="display:grid;gap:14px">
                                ${tpField('Tên khung tuyến nội địa', 'tp[routes][domestic_title]', tpData.routes.domestic_title)}
                                ${tpField('Mô tả', 'tp[routes][domestic_desc]', tpData.routes.domestic_desc, true)}
                                ${tpList('Thành phố phục vụ', 'text', 'tp[routes][domestic]', vals(tpData.routes.domestic), 'Thêm thành phố')}
                            </div>
                        </div>
                    </div></div>

                    <!-- Hộp Thư viện ảnh & Form -->
                    <div class="cr-card"><h3>Thư viện ảnh &amp; Form nhận báo giá</h3><div class="cr-body">
                        ${tpField('Tiêu đề thư viện ảnh', 'tp[gallery][title]', tpData.gallery.title)}
                        ${tpField('Lời dẫn', 'tp[gallery][desc]', tpData.gallery.desc, true)}
                        <div>
                            <span class="cr-sub">Ảnh thực tế tại sân bay</span>
                            <div class="cr-list" data-list="tp[gallery][images]" data-kind="gallery">
                                ${asRows(tpData.gallery.images).map((r, i) => tpRow('gallery', 'tp[gallery][images][' + i + ']', r).replace(/__K__/g, String(i))).join('')}
                            </div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                                <button type="button" class="cr-add" data-add="tp[gallery][images]">+ Thêm 1 ảnh</button>
                                <label class="cr-add" style="cursor:pointer">+ Tải nhiều ảnh cùng lúc<input form="transportForm" type="file" id="tpGalMulti" multiple hidden accept="image/*"></label>
                            </div>
                            <template data-tpl="tp[gallery][images]">${tpRow('gallery', 'tp[gallery][images][__I__]', {})}</template>
                        </div>
                        <hr style="border:0;border-top:1px solid var(--border);width:100%">
                        ${tpField('Tiêu đề form báo giá', 'tp[quote][title]', tpData.quote.title)}
                        ${tpField('Lời dẫn dưới tiêu đề', 'tp[quote][desc]', tpData.quote.desc, true)}
                        <div class="cr-grid2">
                            ${tpField('Số hotline hiển thị', 'tp[quote][hotline]', tpData.quote.hotline, false, 'Để trống sẽ dùng hotline ở "Thông tin liên hệ".')}
                            ${tpField('Zalo (số điện thoại hoặc link zalo.me)', 'tp[quote][zalo]', tpData.quote.zalo, false, 'Để trống sẽ dùng Zalo ở "Mạng xã hội". Thông báo yêu cầu báo giá gửi qua email/Messenger đã cấu hình trong config.php.')}
                        </div>
                        ${tpField('Chữ trên nút gửi', 'tp[quote][submit]', tpData.quote.submit)}
                    </div></div>

                    <div class="cr-save"><button type="submit" form="transportForm" id="transportSaveBtn">LƯU CẤU HÌNH VẬN CHUYỂN</button></div>
                </section>
`;
}
