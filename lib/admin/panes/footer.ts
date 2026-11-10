import 'server-only';
import { h, on } from '../html';
import { flashFor, type AdminState } from '../types';
import { footerLoad, FOOTER_NETWORKS } from '../../stores/footer';

/** Tab "Cấu hình Footer" (dữ liệu content/footer_settings.json) — port nguyên từ admin/index.php */

const A = 'width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
export const FOOTER_ICONS: Record<string, string> = {
  facebook: `<svg ${A} fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21z"/></svg>`,
  instagram: `<svg ${A} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".8" fill="currentColor"/></svg>`,
  tiktok: `<svg ${A} fill="currentColor"><path d="M16.6 3c.3 2.2 1.6 3.6 3.8 3.8v3a7 7 0 0 1-3.8-1.2v6.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.1a2.7 2.7 0 1 0 1.8 2.5V3z"/></svg>`,
  whatsapp: `<svg ${A} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.8c.2 2.2 2.6 4.6 4.8 5l1.2-1.2-1.8-1-.8.7c-.8-.3-1.5-1-1.9-1.9l.7-.8-1-1.8z" fill="currentColor" stroke="none"/></svg>`,
  telegram: `<svg ${A} fill="currentColor"><path d="M21.5 3.4 2.6 10.6c-.8.3-.8 1.4 0 1.6l4.8 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.7-2.5 4.9 3.6c.6.4 1.4.1 1.6-.6L22.9 4.7c.2-.8-.6-1.6-1.4-1.3zM9 13.1l9.1-5.7-7 6.8-.3 3.3z"/></svg>`,
  zalo: `<svg ${A} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><text x="12" y="15.6" text-anchor="middle" font-family="Arial,sans-serif" font-size="8.2" font-weight="700" fill="currentColor" stroke="none">Zalo</text></svg>`,
};

const fsRow = (key: string, label: string, url: string) =>
  '<div class="fs-row">' +
  '<input form="footerForm" class="fs-in" name="fs_' + key + '_label[]" value="' + h(label) + '" placeholder="Tên hiển thị" maxlength="80">' +
  '<input form="footerForm" class="fs-in" name="fs_' + key + '_url[]" value="' + h(url) + '" placeholder="URL (/trang, #muc, https://...)" maxlength="500">' +
  '<button type="button" class="fs-del" title="Xóa dòng" aria-label="Xóa dòng">✕</button></div>';

export async function renderFooterPane(st: AdminState): Promise<string> {
  const fs = await footerLoad();
  const footerError = flashFor(st, 'footerError');
  return `
                <section class="panel section-pane" id="pane-footer">
                    <div class="panel-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg>
                            Cấu hình Footer
                        </h2>
                    </div>
                    <style>
                    .fs-ok{display:flex;gap:10px;align-items:center;padding:12px 16px;border-radius:10px;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;font-weight:600;margin-bottom:16px}
                    .fs-bad{background:#FEF2F2;color:#991B1B;border-color:#FECACA}
                    .fs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
                    .fs-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px;box-shadow:var(--shadow-sm);min-width:0}
                    .fs-card.wide{grid-column:1/-1}
                    .fs-card h3{margin:0 0 4px;font-size:15px;display:flex;align-items:center;gap:10px}
                    .fs-card h3 b{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:8px;background:var(--primary-light);color:var(--accent);font-size:12px}
                    .fs-card .fs-sub{margin:0 0 14px;color:var(--text-muted);font-size:12.5px}
                    .fs-f{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
                    .fs-f>label,.fs-lbl{font-size:12px;font-weight:600;color:#475569}
                    .fs-in{width:100%;border:1px solid #CBD5E1;border-radius:8px;padding:9px 11px;font:inherit;background:#fff;color:var(--text-main);min-width:0}
                    .fs-in:focus{outline:0;border-color:var(--border-focus);box-shadow:0 0 0 3px rgba(59,130,246,.15)}
                    .fs-in.hot{color:#B45309;font-weight:700}
                    .fs-chk{display:flex;align-items:center;gap:9px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer;font-weight:500;background:#F8FAFC}
                    .fs-chk input{width:17px;height:17px;accent-color:var(--accent)}
                    .fs-chks{display:flex;flex-wrap:wrap;gap:10px}
                    .fs-rows{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
                    .fs-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) auto;gap:8px}
                    .fs-del{border:1px solid #FECACA;background:#FEF2F2;color:#991B1B;border-radius:8px;width:38px;cursor:pointer;font-weight:700}
                    .fs-add{border:1px dashed #93C5FD;background:var(--primary-light);color:var(--accent);border-radius:8px;padding:8px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
                    .fs-soc{display:grid;grid-template-columns:auto 130px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:8px}
                    .fs-soc .nm{display:flex;align-items:center;gap:8px;font-weight:600;color:#334155}
                    .fs-soc .nm svg{color:#64748B}
                    .fs-submit{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;justify-content:space-between}
                    .fs-submit .fs-f{flex:1 1 360px;margin:0}
                    .fs-save{border:0;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-weight:700;letter-spacing:.04em;font-size:15px;padding:14px 36px;cursor:pointer;box-shadow:0 8px 18px -8px rgba(37,99,235,.6)}
                    .fs-save:hover{background:var(--primary)}
                    body.fs-active .sticky-actions{display:none}
                    @media(max-width:900px){.fs-grid{grid-template-columns:1fr}.fs-row{grid-template-columns:1fr auto}.fs-row .fs-in:nth-child(2){grid-column:1}.fs-soc{grid-template-columns:auto 1fr}.fs-soc .fs-in{grid-column:1/-1}}
                    </style>

                    ${st.q.footer_saved !== undefined ? `
                        <div class="fs-ok" id="fsAlert">✓ Cập nhật footer thành công!</div>
` : ''}
                    ${footerError ? `
                        <div class="fs-ok fs-bad">${h(footerError)}</div>
` : ''}

                    <div class="fs-grid">
                        <!-- Card 1: Thương hiệu -->
                        <div class="fs-card">
                            <h3><b>1</b> Thương hiệu</h3>
                            <p class="fs-sub">Tên, slogan và huy hiệu uy tín ở cột đầu footer.</p>
                            <div class="fs-f"><label for="fs_brand_name">Tên thương hiệu</label>
                                <input form="footerForm" class="fs-in" id="fs_brand_name" name="fs_brand_name" value="${h(fs.brand.name)}" maxlength="60"></div>
                            <div class="fs-f"><label for="fs_brand_slogan">Slogan ngắn</label>
                                <input form="footerForm" class="fs-in" id="fs_brand_slogan" name="fs_brand_slogan" value="${h(fs.brand.slogan)}" maxlength="200"></div>
                            <span class="fs-lbl">Huy hiệu</span>
                            <div class="fs-chks" style="margin-top:6px">
                                <label class="fs-chk"><input form="footerForm" type="checkbox" name="fs_iata" value="1"${on(fs.brand.show_iata)}> IATA</label>
                                <label class="fs-chk"><input form="footerForm" type="checkbox" name="fs_chip" value="1"${on(fs.brand.show_microchip)}> Microchip</label>
                            </div>
                        </div>

                        <!-- Card 4: Liên hệ & MXH (đặt cạnh Card 1 trên desktop) -->
                        <div class="fs-card" style="grid-row:span 2">
                            <h3><b>4</b> Liên hệ &amp; Mạng xã hội</h3>
                            <p class="fs-sub">Cột Liên hệ và hàng icon mạng xã hội. Bỏ tick để ẩn từng mạng.</p>
                            <div class="fs-f"><label for="fs_address">Địa chỉ store</label>
                                <input form="footerForm" class="fs-in" id="fs_address" name="fs_address" value="${h(fs.contact.address)}" maxlength="250"></div>
                            <div class="fs-f"><label for="fs_maps">Link Google Maps</label>
                                <input form="footerForm" class="fs-in" id="fs_maps" name="fs_maps" value="${h(fs.contact.maps_url)}" placeholder="https://maps.google.com/..." maxlength="500"></div>
                            <div class="fs-f"><label for="fs_hotline">Số điện thoại Hotline (hiển thị màu cam)</label>
                                <input form="footerForm" class="fs-in hot" id="fs_hotline" name="fs_hotline" value="${h(fs.contact.hotline)}" maxlength="40"></div>
                            <div class="fs-f"><label for="fs_website">Website</label>
                                <input form="footerForm" class="fs-in" id="fs_website" name="fs_website" value="${h(fs.contact.website)}" maxlength="100"></div>
                            <span class="fs-lbl">Mạng xã hội</span>
                            <div style="margin-top:8px">
                                ${Object.entries(FOOTER_NETWORKS).map(([k, label]) => { const s = fs.social[k]; return `
                                <div class="fs-soc">
                                    <input form="footerForm" type="checkbox" name="fs_soc_on[${k}]" value="1" title="Bật/tắt ${h(label)}" style="width:17px;height:17px;accent-color:var(--accent)"${on(s.enabled)}>
                                    <span class="nm">${FOOTER_ICONS[k] ?? ''}${h(label)}</span>
                                    <input form="footerForm" class="fs-in" name="fs_soc_url[${k}]" value="${h(s.url)}" placeholder="https://..." maxlength="500">
                                </div>
                                `; }).join('')}
                            </div>
                        </div>

                        <!-- Card 2: Menu Dịch vụ -->
                        <div class="fs-card">
                            <h3><b>2</b> Menu Dịch vụ</h3>
                            <p class="fs-sub">Tiêu đề cột và danh sách liên kết.</p>
                            <div class="fs-f"><label for="fs_sv_title">Tiêu đề cột</label>
                                <input form="footerForm" class="fs-in" id="fs_sv_title" name="fs_sv_title" value="${h(fs.services.title)}" maxlength="40"></div>
                            <div class="fs-rows" data-key="sv">${fs.services.links.map((l) => fsRow('sv', l.label, l.url)).join('')}</div>
                            <button type="button" class="fs-add" data-add="sv">+ Thêm liên kết</button>
                            <template id="fs-tpl-sv">${fsRow('sv', '', '')}</template>
                        </div>

                        <!-- Card 3: Menu Chính sách -->
                        <div class="fs-card">
                            <h3><b>3</b> Menu Chính sách</h3>
                            <p class="fs-sub">Để trống URL nếu chưa có trang: mục sẽ hiện dạng chữ, không bấm được.</p>
                            <div class="fs-f"><label for="fs_po_title">Tiêu đề cột</label>
                                <input form="footerForm" class="fs-in" id="fs_po_title" name="fs_po_title" value="${h(fs.policies.title)}" maxlength="40"></div>
                            <div class="fs-rows" data-key="po">${fs.policies.links.map((l) => fsRow('po', l.label, l.url)).join('')}</div>
                            <button type="button" class="fs-add" data-add="po">+ Thêm liên kết</button>
                            <template id="fs-tpl-po">${fsRow('po', '', '')}</template>
                        </div>

                        <!-- Bản quyền + Lưu -->
                        <div class="fs-card wide">
                            <div class="fs-submit">
                                <div class="fs-f"><label for="fs_copy">Nội dung bản quyền (dòng cuối footer)</label>
                                    <input form="footerForm" class="fs-in" id="fs_copy" name="fs_copy" value="${h(fs.copyright)}" maxlength="300"></div>
                                <button type="submit" form="footerForm" name="footer_save" value="1" class="fs-save">LƯU THAY ĐỔI</button>
                            </div>
                        </div>
                    </div>
                </section>
`;
}
