import 'server-only';
import { h, on } from '../html';
import { flashFor, type AdminState } from '../types';
import { aboutLoadWithSource, type AboutMember } from '../../stores/about';

/** Tab "Quản lý Về Chunora" (dữ liệu content/about_chunora_data.json) — port nguyên từ admin/index.php */

/** Đường dẫn ảnh xem trước: http(s) giữ nguyên, còn lại thêm '/' */
const imgSrc = (src: string) => (/^https?:\/\//i.test(src) ? '' : '/') + src;

/** Dòng thành viên đội ngũ: ảnh + họ tên + chức vụ + mô tả ngắn. (ab_member_row) — `k` thay cho __K__ trong tên ô tệp */
export function abMemberRow(n: string, v: Partial<AboutMember>, k = '__K__'): string {
  const inp = (name: string, val: string, ph: string) =>
    '<input form="aboutForm" class="cr-in" name="' + h(name) + '" value="' + h(val) + '" placeholder="' + h(ph) + '" maxlength="400">';
  const src = String(v.image ?? '');
  const thumb = src !== '' ? '<img src="' + h(imgSrc(src)) + '" alt="">' : '<span>Chưa có ảnh</span>';
  const tools =
    '<div class="cr-tools"><button type="button" class="cr-ib cr-up" title="Lên" aria-label="Lên">↑</button><button type="button" class="cr-ib cr-down" title="Xuống" aria-label="Xuống">↓</button><button type="button" class="cr-ib cr-del" title="Xóa thành viên" aria-label="Xóa thành viên">✕</button></div>';
  return (
    '<div class="cr-row cr-memrow" data-kind="member"><div class="cr-thumb">' + thumb + '</div>' +
    '<div class="cr-imgcol"><input form="aboutForm" type="hidden" class="cr-src" name="' + h(n) + '[image]" value="' + h(src) + '">' +
    '<label class="cr-up-btn">Ảnh<input form="aboutForm" type="file" class="cr-gfile" name="ab_team[' + h(k) + ']" accept="image/*" hidden></label></div>' +
    '<div class="cr-cols cr-cols-member">' +
    inp(n + '[name]', String(v.name ?? ''), 'Họ tên') +
    inp(n + '[role]', String(v.role ?? ''), 'Chức vụ') +
    inp(n + '[desc]', String(v.desc ?? ''), 'Mô tả ngắn') + '</div>' + tools + '</div>'
  );
}

/** ab_field */
export function abField(label: string, name: string, val: string, multi = false, hint = ''): string {
  const ctl = multi
    ? '<textarea form="aboutForm" class="cr-in" name="' + h(name) + '" rows="3">' + h(val) + '</textarea>'
    : '<input form="aboutForm" class="cr-in" name="' + h(name) + '" value="' + h(val) + '">';
  return '<div class="cr-field"><label>' + h(label) + '</label>' + ctl + (hint !== '' ? '<p class="cr-hint">' + h(hint) + '</p>' : '') + '</div>';
}

/** ab_image_field */
export function abImageField(fileKey: string, name: string, label: string, src: string, hint: string): string {
  const thumb = src !== '' ? '<img src="' + h(imgSrc(src)) + '" alt="">' : '<span>Chưa có ảnh</span>';
  return (
    '<div class="cr-field"><label>' + h(label) + '</label><div class="cr-img"><div class="cr-thumb cr-thumb-lg">' + thumb + '</div><div>' +
    '<input form="aboutForm" type="hidden" class="cr-src" name="' + h(name) + '" value="' + h(src) + '">' +
    '<label class="cr-up-btn">Tải ảnh lên<input form="aboutForm" type="file" class="cr-single" name="' + h(fileKey) + '" accept="image/*" hidden></label>' +
    '<p class="cr-hint">' + h(hint) + '</p></div></div></div>'
  );
}

const WHY_NAMES = ['Thẻ tài liệu (nền cam nhạt)', 'Thẻ quả địa cầu (nền xanh dương nhạt)', 'Thẻ ngôi nhà (nền xanh lá nhạt)', 'Thẻ tin nhắn (nền hồng nhạt)'];

export async function renderAboutPane(st: AdminState): Promise<string> {
  const { data: abData, fromFile: abFromFile } = aboutLoadWithSource();
  const aboutError = flashFor(st, 'aboutError');
  const saved = st.q.about_saved !== undefined;
  return `
                <section class="panel section-pane" id="pane-about">
                    <div class="panel-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01"/></svg>
                            Quản lý Về Chunora
                        </h2>
                        <a class="button outline btn-sm" href="/ve-chunora" target="_blank" rel="noopener">Xem trang Về Chunora</a>
                    </div>
                    <style>
#pane-about{--primary:#0F3D8A;--accent:#2563EB;--text:#0F172A;--muted:#64748B;--border:#E2E8F0;--ok-bg:#ECFDF5;--ok:#065F46;--ok-b:#A7F3D0;--danger-bg:#FEF2F2;--danger:#991B1B}
#pane-about *{box-sizing:border-box}
#pane-about .cr-lead{color:var(--muted);margin:0 0 16px}
#pane-about .cr-msg{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-weight:500}
#pane-about .cr-msg.ok{background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-b)}
#pane-about .cr-msg.bad{background:var(--danger-bg);color:var(--danger);border:1px solid #FECACA}
#pane-about .cr-card{background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06);margin-bottom:18px;overflow:hidden}
#pane-about .cr-card>h3{margin:0;padding:14px 18px;background:#F8FAFC;border-bottom:1px solid var(--border);font-size:15px;color:var(--text);display:flex;align-items:center;gap:10px}
#pane-about .cr-body{padding:18px;display:grid;gap:14px}
#pane-about .cr-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#pane-about .cr-field>label,#pane-about .cr-sub{display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}
#pane-about .cr-hint{font-size:12.5px;color:var(--muted);margin:5px 0 0}
#pane-about .cr-in{width:100%;border:1px solid #CBD5E1;border-radius:9px;padding:9px 12px;font:500 14px 'Be Vietnam Pro',sans-serif;color:var(--text);background:#fff;min-width:0}
#pane-about .cr-in:focus{outline:2px solid #BFDBFE;border-color:var(--accent)}
#pane-about textarea.cr-in{resize:vertical}
#pane-about .cr-list{display:grid;gap:8px}
#pane-about .cr-row{display:flex;gap:8px;align-items:center;background:#F8FAFC;border:1px solid var(--border);border-radius:11px;padding:8px}
#pane-about .cr-cols{flex:1;display:grid;gap:8px;min-width:0}
#pane-about .cr-cols-pair{grid-template-columns:1fr 2fr}
#pane-about .cr-pairrow .cr-thumb{width:72px;height:56px}
#pane-about .cr-imgcol{flex:0 0 auto}
#pane-about .cr-cols-price{grid-template-columns:1.6fr 1fr 1fr}
#pane-about .cr-tools{display:flex;gap:4px;flex:0 0 auto}
#pane-about .cr-ib{border:1px solid var(--border);background:#fff;border-radius:8px;width:32px;height:32px;cursor:pointer;font-weight:700;color:#334155}
#pane-about .cr-ib:hover{background:#F1F5F9}
#pane-about .cr-del{color:#B91C1C}
#pane-about .cr-add{align-self:start;border:1.5px dashed #93C5FD;background:#EFF6FF;color:var(--primary);border-radius:10px;padding:9px 16px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer}
#pane-about .cr-add:hover{background:#DBEAFE}
#pane-about .cr-up-btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #BFDBFE;background:#EFF6FF;color:var(--primary);border-radius:9px;padding:8px 14px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer;white-space:nowrap}
#pane-about .cr-img{display:flex;gap:16px;align-items:flex-start}
#pane-about .cr-thumb{width:84px;height:64px;border-radius:9px;border:1px dashed #CBD5E1;background:#F8FAFC;overflow:hidden;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;text-align:center}
#pane-about .cr-thumb-lg{width:150px;height:110px}
#pane-about .cr-thumb img{width:100%;height:100%;object-fit:cover;display:block}
#pane-about .cr-gcols{grid-template-columns:auto 1fr;align-items:center}
#pane-about .cr-fname{font-size:12px;color:var(--muted)}
#pane-about .cr-tabs-sub{display:grid;gap:18px;grid-template-columns:1fr 1fr}
#pane-about .cr-save{position:sticky;bottom:0;z-index:5;background:#fff;border-top:1px solid var(--border);padding:14px 0;margin-top:6px}
#pane-about .cr-save button{width:100%;border:0;border-radius:12px;padding:16px;background:var(--primary);color:#fff;font:800 15px 'Be Vietnam Pro',sans-serif;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 20px -10px rgba(15,61,138,.7)}
#pane-about .cr-save button:hover{background:var(--accent)}
#pane-about .cr-save button[disabled]{opacity:.7;cursor:wait}
@media(max-width:900px){#pane-about .cr-grid2,#pane-about .cr-tabs-sub,#pane-about .cr-cols-pair,#pane-about .cr-cols-price{grid-template-columns:1fr}#pane-about .cr-img{flex-direction:column}}

#pane-about .cr-cols-member{grid-template-columns:1fr 1fr 1.6fr}
#pane-about .cr-memrow .cr-thumb{width:72px;height:72px}
#pane-about .cr-imgcol{flex:0 0 auto}
#pane-about .cr-grid4{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:900px){#pane-about .cr-cols-member,#pane-about .cr-grid4{grid-template-columns:1fr}}
</style>
                    <p class="cr-lead">Chỉnh nội dung trang <strong>/ve-chunora</strong>. Dữ liệu lưu trong <code>content/about_chunora_data.json</code>. Trong các tiêu đề, bọc cụm cần nhấn bằng dấu <code>*</code> để hiện <em style="color:#D97706">chữ nghiêng màu cam</em> (VD: <code>Chăm sóc trọn vẹn cho người bạn *bốn chân*</code>).</p>
                    ${saved ? '<div class="cr-msg ok">Đã lưu cấu hình trang Về Chunora. Website đã được cập nhật.</div>' : ''}
                    ${aboutError ? `<div class="cr-msg bad">${h(aboutError)}</div>` : ''}
                    ${!abFromFile && !saved && !aboutError ? '<div class="cr-msg ok" style="background:#EFF6FF;color:#1E3A8A;border-color:#BFDBFE">Đang hiển thị nội dung mặc định. Bấm <strong>Lưu cấu hình</strong> để tạo file dữ liệu.</div>' : ''}

                    <!-- Hộp Câu chuyện thương hiệu -->
                    <div class="cr-card"><h3>Câu chuyện thương hiệu</h3><div class="cr-body">
                        ${abField('Nhãn phụ (chữ nhỏ in hoa màu cam)', 'ab[story][eyebrow]', abData.story.eyebrow)}
                        ${abField('Tiêu đề chính', 'ab[story][title]', abData.story.title, false, 'Bọc cụm cần nhấn bằng dấu *, ví dụ: người bạn *bốn chân*')}
                        ${abField('Slogan / định vị', 'ab[story][positioning]', abData.story.positioning, true)}
                        ${abField('Đoạn giới thiệu', 'ab[story][intro]', abData.story.intro, true)}
                        <div class="cr-grid2">${abField('Link video (YouTube hoặc MP4/WebM)', 'ab[story][video]', abData.story.video, false, 'Dán link YouTube, hoặc tải tệp video lên bên phải (tự chuyển sang WebM, tối đa 100 MB).')}
                        <div class="cr-field"><label>Hoặc tải video từ máy</label><input form="aboutForm" class="cr-in" type="file" name="ab_video_file" accept="video/*"><p class="cr-hint">Nếu chọn tệp, tệp này sẽ thay cho link bên cạnh.</p></div></div>
                        ${abField('Chữ trên nút xem video', 'ab[story][cta]', abData.story.cta)}
                        ${abImageField('ab_img_story', 'ab[story][thumbnail]', 'Ảnh thumbnail video', abData.story.thumbnail, 'Để trống: dùng ảnh đại diện của YouTube (nếu có) hoặc nền xanh than. Ảnh tự chuyển sang WebP, tối đa 5 MB.')}
                    </div></div>

                    <!-- Hộp Cam kết cốt lõi -->
                    <div class="cr-card"><h3>Vì sao chọn Chunora PET (cam kết cốt lõi)</h3><div class="cr-body">
                        ${abField('Nhãn phụ', 'ab[why][eyebrow]', abData.why.eyebrow)}
                        ${abField('Tiêu đề khối', 'ab[why][title]', abData.why.title, false, 'Bọc cụm cần nhấn bằng dấu *')}
                        ${abField('Mô tả', 'ab[why][desc]', abData.why.desc, true)}
                        ${abImageField('ab_img_why', 'ab[why][image]', 'Ảnh minh họa cột trái', abData.why.image, 'Ảnh bé thú cưng nằm dưới đoạn mô tả. Tự chuyển sang WebP, tối đa 5 MB.')}
                        <div class="cr-grid4">
                        ${abData.why.cards.map((cd, ci) => `
                            <div class="cr-card" style="margin:0"><h3>${h(WHY_NAMES[ci] ?? 'Thẻ')}</h3><div class="cr-body">
                                ${abField('Tiêu đề thẻ', 'ab[why][cards][' + ci + '][title]', cd.title)}
                                ${abField('Nội dung mô tả', 'ab[why][cards][' + ci + '][desc]', cd.desc, true)}
                            </div></div>
                        `).join('')}
                        </div>
                        <div class="cr-grid2">${abField('Chữ nút', 'ab[why][cta]', abData.why.cta)}${abField('Liên kết nút', 'ab[why][cta_link]', abData.why.cta_link, false, 'VD: #doi-ngu (cuộn trong trang), /mua-ban/ hoặc https://...')}</div>
                    </div></div>

                    <!-- Hộp Đội ngũ -->
                    <div class="cr-card"><h3>Đội ngũ chuyên gia</h3><div class="cr-body">
                        ${abField('Nhãn phụ', 'ab[team][eyebrow]', abData.team.eyebrow)}
                        ${abField('Tiêu đề', 'ab[team][title]', abData.team.title, false, 'Bọc cụm cần nhấn bằng dấu *')}
                        ${abField('Mô tả', 'ab[team][desc]', abData.team.desc, true)}
                        <div>
                            <span class="cr-sub">Thành viên (ảnh · họ tên · chức vụ · mô tả ngắn)</span>
                            <div class="cr-list" data-list="ab[team][members]" data-kind="member">
                                ${abData.team.members.map((r, i) => abMemberRow('ab[team][members][' + i + ']', r, String(i))).join('')}
                            </div>
                            <button type="button" class="cr-add" data-add="ab[team][members]" style="margin-top:8px">+ Thêm thành viên</button>
                            <template data-tpl="ab[team][members]">${abMemberRow('ab[team][members][__I__]', {})}</template>
                        </div>
                        <div class="cr-grid2">${abField('Chữ nút', 'ab[team][cta]', abData.team.cta)}${abField('Liên kết nút', 'ab[team][cta_link]', abData.team.cta_link)}</div>
                    </div></div>

                    <!-- Hộp Số liệu uy tín -->
                    <div class="cr-card"><h3>Cấu hình Kênh Truyền Thông / Mạng Xã Hội</h3><div class="cr-body">
                        ${abField('Nhãn phụ (chữ nhỏ in hoa màu cam)', 'ab[social_section][eyebrow]', abData.social_section.eyebrow)}
                        ${abField('Tiêu đề chính', 'ab[social_section][title]', abData.social_section.title, false, 'Bọc cụm cần in nghiêng bằng dấu *, ví dụ: Kết nối cùng *CHUNORA PET*')}
                        ${abField('Mô tả ngắn', 'ab[social_section][subtitle]', abData.social_section.subtitle, true)}
                        <p class="cr-hint" style="margin:0">Kênh chỉ hiển thị trên website khi được bật <b>và</b> có đường dẫn URL. Để trống URL = ẩn kênh đó.</p>
                        <div class="cr-list">
                        ${abData.social_section.channels.map((ch, si) => { const sn = 'ab[social_section][channels][' + si + ']'; return `
                            <div class="cr-row" style="align-items:flex-start;flex-wrap:wrap">
                                <label style="display:flex;align-items:center;gap:6px;font-weight:700;min-width:130px;padding-top:9px">
                                    <input form="aboutForm" type="hidden" name="${h(sn)}[enabled]" value="0">
                                    <input form="aboutForm" type="checkbox" name="${h(sn)}[enabled]" value="1"${on(ch.enabled)}>
                                    <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${h(ch.color)}"></span> ${h(ch.key)}
                                </label>
                                <div class="cr-cols" style="grid-template-columns:1fr 1fr;flex:1;min-width:260px">
                                    <input form="aboutForm" class="cr-in" name="${h(sn)}[name]" value="${h(ch.name)}" placeholder="Tên kênh" maxlength="40">
                                    <input form="aboutForm" class="cr-in" name="${h(sn)}[subtext]" value="${h(ch.subtext)}" placeholder="Mô tả phụ (VD: Fanpage)" maxlength="60">
                                    <input form="aboutForm" class="cr-in" style="grid-column:1/-1" name="${h(sn)}[url]" value="${h(ch.url)}" placeholder="https://… (đường dẫn kênh)">
                                </div>
                            </div>
                        `; }).join('')}
                        </div>
                    </div></div>

                    <div class="cr-card"><h3>Số liệu uy tín &amp; Kêu gọi hành động cuối trang</h3><div class="cr-body">
                        <span class="cr-sub" style="margin:0">Bốn con số thống kê (con số hiển thị và nhãn mô tả bên dưới)</span>
                        <div class="cr-grid4">
                        ${abData.stats.items.map((it, si) => `
                            <div class="cr-grid2" style="grid-template-columns:.8fr 1.6fr">
                                ${abField('Con số', 'ab[stats][items][' + si + '][value]', it.value, false, si === 0 ? 'VD: 2.500+ hoặc 100%. Chạy số khi cuộn tới.' : '')}
                                ${abField('Nhãn mô tả', 'ab[stats][items][' + si + '][label]', it.label)}
                            </div>
                        `).join('')}
                        </div>
                        <hr style="border:0;border-top:1px solid var(--border);width:100%">
                        ${abField('Tiêu đề lời kêu gọi', 'ab[cta][title]', abData.cta.title, false, 'Bọc cụm cần nhấn bằng dấu *')}
                        ${abField('Lời dẫn', 'ab[cta][desc]', abData.cta.desc, true)}
                        <div class="cr-grid2">${abField('Chữ nút chính', 'ab[cta][button]', abData.cta.button)}${abField('Liên kết nút chính', 'ab[cta][button_link]', abData.cta.button_link, false, 'Để trống sẽ về phần Liên hệ ở trang chủ.')}</div>
                        ${abField('Số hotline (nút gọi)', 'ab[cta][hotline]', abData.cta.hotline, false, 'Để trống sẽ dùng hotline ở "Thông tin liên hệ".')}
                    </div></div>

                    <div class="cr-save"><button type="submit" form="aboutForm" id="aboutSaveBtn">LƯU CẤU HÌNH TRANG VỀ CHUNORA</button></div>
                </section>
`;
}
