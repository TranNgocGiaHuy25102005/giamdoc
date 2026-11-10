import 'server-only';
import { h, on } from '../html';
import { flashFor, type AdminState } from '../types';
import { petsLoad, petsMediaKind, petsYoutubeId, type Pet } from '../../stores/pets';

/** Tab "Mua bán chó mèo" (thẻ pet, dữ liệu MySQL site_content id = 2) — port nguyên từ admin/index.php */

/** pet_media_row */
export function petMediaRow(src: string, idx: string, k: string): string {
  const kind = src !== '' ? petsMediaKind(src) : 'image';
  let thumb = '';
  if (src !== '' && kind === 'image') {
    thumb = src.startsWith('http') ? src : '/' + src;
  } else if (kind === 'youtube') {
    thumb = 'https://i.ytimg.com/vi/' + petsYoutubeId(src) + '/default.jpg';
  }
  return `
<div class="mrow">
  <div class="mth">${thumb !== '' ? '<img src="' + h(thumb) + '" alt="">' : kind === 'video' ? '▶ Video' : 'Ảnh'}</div>
  <input form="petForm" class="msrc" name="pets[${h(idx)}][media][${h(k)}]" value="${h(src)}" maxlength="400" placeholder="Dán link YouTube / link ảnh, hoặc bấm “Chọn tệp”">
  <label class="upl sm">Chọn tệp<input form="petForm" type="file" class="mfile" name="pet_media[${h(idx)}][${h(k)}]" accept="image/*,video/*"></label>
  <button type="button" class="ib mup" title="Lên">↑</button>
  <button type="button" class="ib mdown" title="Xuống">↓</button>
  <button type="button" class="ib mdel" title="Xóa">✕</button>
  <small class="err" hidden></small>
</div>
`;
}

/** pet_card */
export function petCard(p: Pet, idx: string): string {
  const img = p.image !== '' ? (p.image.startsWith('http') ? p.image : '/' + p.image) : '';
  const n = 'pets[' + idx + ']';
  return `
<article class="pet-card" data-type="${h(p.type)}" data-idx="${h(idx)}">
  <div class="pc-top">
    <span class="pc-num"></span>
    <span class="pc-type pc-type-${h(p.type)}">${p.type === 'meo' ? 'Mèo' : 'Chó'}</span>
    <span class="pc-name">${h(p.name)}</span>
    <span class="pc-sp"></span>
    <button type="button" class="ib up" title="Chuyển lên">↑</button>
    <button type="button" class="ib down" title="Chuyển xuống">↓</button>
    <button type="button" class="ib del" title="Xóa thẻ">✕ Xóa</button>
  </div>
  <div class="pc-body">
    <div class="pc-img">
      <div class="pc-prev${img === '' ? ' empty' : ''}">${img !== '' ? '<img src="' + h(img) + `" alt="" onerror="this.parentNode.classList.add('empty');this.parentNode.textContent='Chưa có ảnh'">` : 'Chưa có ảnh'}</div>
      <label class="upl">Tải ảnh thẻ lên<input form="petForm" type="file" class="file" name="pet_img[${h(idx)}]" accept="image/*"></label>
      <input form="petForm" type="hidden" class="img-path" name="${h(n)}[image]" value="${h(p.image)}">
      <small class="hint">Ảnh đại diện của thẻ · ảnh bất kỳ, tự chuyển sang WebP · tối đa 5 MB</small>
      <small class="err" hidden></small>
    </div>
    <div class="pc-fields">
      <div class="f f-type"><label>Chó hay mèo</label>
        <select form="petForm" name="${h(n)}[type]" class="sel-type">
          <option value="cho"${on(p.type === 'cho', 'selected')}>Chó</option>
          <option value="meo"${on(p.type === 'meo', 'selected')}>Mèo</option>
        </select></div>
      <div class="f"><label>Giống pet</label><input form="petForm" name="${h(n)}[breed]" value="${h(p.breed)}" maxlength="80" placeholder="VD: Poodle"></div>
      <div class="f"><label>Tên pet</label><input form="petForm" class="in-name" name="${h(n)}[name]" value="${h(p.name)}" maxlength="100" placeholder="VD: Poodle nâu đỏ"></div>
      <div class="f"><label>Giá pet</label><input form="petForm" name="${h(n)}[price]" value="${h(p.price)}" maxlength="60" placeholder="VD: 12.000.000đ hoặc Liên hệ"></div>
      <div class="f wide"><label>Nhận diện pet</label><input form="petForm" name="${h(n)}[identity]" value="${h(p.identity)}" maxlength="200" placeholder="VD: Lông xoăn · Sắc nâu ấm"></div>
      <div class="f wide"><label>Đường dẫn trang chi tiết (slug)</label>
        <input form="petForm" name="${h(n)}[slug]" value="${h(p.slug)}" maxlength="80" placeholder="Để trống: tự tạo từ tên pet, VD: poodle-nau-do">
        <small class="hint l">Trang chi tiết: <code>/mua-ban/chi-tiet?p=<span class="slug-show">${h(p.slug !== '' ? p.slug : '…')}</span></code> — bấm vào thẻ ngoài website sẽ mở trang này.</small></div>
    </div>
  </div>

  <details class="sec">
    <summary>Ảnh &amp; video trang chi tiết <span class="cnt-media">${p.media.length}</span></summary>
    <div class="sec-body">
      <p class="hint l">Ảnh thẻ ở trên luôn là ảnh đầu tiên. Thêm ảnh/video bên dưới sẽ hiện thành dãy ảnh nhỏ (carousel) dưới ảnh lớn. Ảnh bất kỳ sẽ tự chuyển sang WebP; video bất kỳ (MP4, MOV, AVI, MKV…) tự chuyển sang WebM (≤ 100 MB), hoặc dán link YouTube.</p>
      <div class="mlist">
        ${p.media.map((m, mi) => petMediaRow(m.src, idx, 'm' + mi)).join('')}
      </div>
      <div class="mbar">
        <button type="button" class="btn sm madd">+ Thêm link / ảnh / video</button>
        <label class="btn sm primary-o">Tải nhiều ảnh/video cùng lúc<input form="petForm" type="file" class="mmulti" multiple hidden accept="image/*,video/*"></label>
      </div>
      <template class="mtpl">${petMediaRow('', idx, '__K__')}</template>
    </div>
  </details>

  <details class="sec">
    <summary>Mô tả chi tiết &amp; SEO</summary>
    <div class="sec-body">
      <div class="f"><label>Mô tả chi tiết (hiện dưới phần ảnh/thông tin)</label>
        <textarea form="petForm" name="${h(n)}[description]" rows="9" maxlength="20000" placeholder="Viết 300–800 từ, có từ khóa như “mua chó Poodle”, “giá chó Poodle”, nguồn gốc, tính cách, tiêm phòng, chính sách bảo hành...">${h(p.description)}</textarea>
        <small class="hint l">Cách viết: để <strong>dòng trống</strong> giữa các đoạn · dòng bắt đầu bằng <code>## </code> là tiêu đề phụ (H2, tốt cho SEO) · dòng bắt đầu bằng <code>- </code> là gạch đầu dòng.</small></div>
      <div class="f"><label>Tiêu đề SEO (thẻ title) — tùy chọn</label>
        <input form="petForm" name="${h(n)}[seo_title]" value="${h(p.seo_title)}" maxlength="120" placeholder="Để trống: tự tạo từ tên + giống. Nên dưới 60 ký tự">
      </div>
      <div class="f"><label>Mô tả SEO (meta description) — tùy chọn</label>
        <textarea form="petForm" name="${h(n)}[seo_description]" rows="2" maxlength="300" placeholder="Để trống: tự lấy từ đầu phần mô tả. Nên 120–155 ký tự">${h(p.seo_description)}</textarea>
      </div>
    </div>
  </details>
</article>
`;
}

const EMPTY_PET: Pet = {
  type: 'cho', image: '', breed: '', name: '', identity: '', price: '', slug: '',
  media: [], description: '', seo_title: '', seo_description: '',
};

export async function renderPetsPane(st: AdminState): Promise<string> {
  let petsList: Pet[] = [];
  const src = { fromDb: true };
  let petsError = flashFor(st, 'petsError');
  try {
    petsList = await petsLoad(src);
  } catch (e) {
    console.error('[admin pets]', e);
    src.fromDb = true;
    if (!petsError) petsError = 'Không đọc được dữ liệu thẻ pet. Kiểm tra MySQL và cấu hình database.';
  }
  const saved = st.q.pets_saved !== undefined;
  return `
                <section class="panel section-pane" id="pane-muaban">
                    <div class="panel-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                            Mua bán chó mèo
                        </h2>
                        <a class="button outline btn-sm" href="/mua-ban" target="_blank" rel="noopener">Xem trang mua bán</a>
                    </div>
                    <style>
#pane-muaban .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--border);border-radius:8px;padding:9px 16px;background:#fff;color:#334155;font:600 13px 'Be Vietnam Pro',sans-serif;text-decoration:none;cursor:pointer}
#pane-muaban .btn:hover{background:#F8FAFC}
#pane-muaban .btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 2px 6px rgba(37,99,235,.25)}
#pane-muaban .btn.primary:hover{background:var(--primary)}
#pane-muaban .btn.primary[disabled]{opacity:.7;cursor:wait}
#pane-muaban .msg{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-weight:500}
#pane-muaban .msg.ok{background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-b)}
#pane-muaban .msg.bad{background:var(--danger-bg);color:var(--danger);border:1px solid #FECACA}
#pane-muaban .bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px}
#pane-muaban .filters{display:inline-flex;gap:4px;background:#fff;border:1px solid var(--border);border-radius:99px;padding:4px}
#pane-muaban .flt{border:0;background:transparent;border-radius:99px;padding:7px 16px;font:600 13px 'Be Vietnam Pro',sans-serif;color:var(--muted);cursor:pointer}
#pane-muaban .flt.on{background:var(--primary-light);color:var(--accent)}
#pane-muaban .list{display:flex;flex-direction:column;gap:16px}
#pane-muaban .pet-card{background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.06);overflow:hidden}
#pane-muaban .pet-card.hide{display:none}
#pane-muaban .pc-top{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);background:#F8FAFC}
#pane-muaban .pc-num{font-weight:700;color:var(--muted)}
#pane-muaban .pc-type{font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px}
#pane-muaban .pc-type-cho{background:#DBEAFE;color:#1E40AF}
#pane-muaban .pc-type-meo{background:#FFEDD5;color:#9A3412}
#pane-muaban .pc-sp{flex:1}
#pane-muaban .ib{border:1px solid var(--border);background:#fff;border-radius:8px;padding:5px 10px;font:600 12px 'Be Vietnam Pro',sans-serif;cursor:pointer;color:#334155}
#pane-muaban .ib:hover{background:#F1F5F9}
#pane-muaban .ib.del{background:var(--danger-bg);color:var(--danger);border-color:#FECACA}
#pane-muaban .pc-body{display:grid;grid-template-columns:200px 1fr;gap:20px;padding:16px}
#pane-muaban .pc-prev{aspect-ratio:4/3;border-radius:12px;background:#EEF2F7;border:1px dashed #CBD5E1;overflow:hidden;display:grid;place-items:center;color:var(--muted);font-size:13px}
#pane-muaban .pc-prev img{width:100%;height:100%;object-fit:cover}
#pane-muaban .pc-prev.empty{background:#F8FAFC}
#pane-muaban .upl{display:block;margin-top:10px;text-align:center;border:1px solid var(--border);border-radius:8px;padding:8px;font-weight:600;font-size:13px;color:var(--accent);background:var(--primary-light);cursor:pointer}
#pane-muaban .upl input{display:none}
#pane-muaban .hint{display:block;margin-top:6px;color:var(--muted);font-size:11.5px;text-align:center}
#pane-muaban .err{display:block;margin-top:6px;color:var(--danger);font-size:12px}
#pane-muaban .pc-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;align-content:start}
#pane-muaban .f label{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:5px}
#pane-muaban .f input,#pane-muaban .f select{width:100%;border:1px solid #CBD5E1;border-radius:8px;padding:9px 11px;font:inherit;background:#fff;color:var(--text)}
#pane-muaban .f input:focus,#pane-muaban .f select:focus{outline:0;border-color:#3B82F6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
#pane-muaban .f.wide{grid-column:1/-1}
#pane-muaban .empty-note{text-align:center;color:var(--muted);padding:40px 20px;background:#fff;border:1px dashed var(--border);border-radius:16px}
#pane-muaban .pc-name{font-weight:600;color:#334155;margin-left:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40vw}
#pane-muaban .hint.l{text-align:left;font-size:12px;margin-top:6px}
#pane-muaban code{background:#EEF2F7;padding:1px 6px;border-radius:5px;font-size:11.5px;word-break:break-all}
#pane-muaban .sec{border-top:1px solid var(--border)}
#pane-muaban .sec summary{cursor:pointer;padding:13px 16px;font-weight:600;color:#1E3A8A;background:#F8FAFC;list-style:none;display:flex;align-items:center;gap:8px}
#pane-muaban .sec summary::-webkit-details-marker{display:none}
#pane-muaban .sec summary:before{content:"▸";transition:transform .2s}
#pane-muaban .sec[open] summary:before{transform:rotate(90deg)}
#pane-muaban .cnt-media{background:var(--primary-light);color:var(--accent);font-size:12px;padding:1px 9px;border-radius:99px}
#pane-muaban .sec-body{padding:6px 16px 16px;display:flex;flex-direction:column;gap:12px}
#pane-muaban .f textarea{width:100%;border:1px solid #CBD5E1;border-radius:8px;padding:9px 11px;font:inherit;background:#fff;color:var(--text);resize:vertical}
#pane-muaban .f textarea:focus{outline:0;border-color:#3B82F6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
#pane-muaban .mlist{display:flex;flex-direction:column;gap:8px}
#pane-muaban .mrow{display:grid;grid-template-columns:64px 1fr auto auto auto auto;gap:8px;align-items:center;background:#F8FAFC;border:1px solid var(--border);border-radius:10px;padding:8px}
#pane-muaban .mth{width:64px;height:48px;border-radius:8px;background:#E2E8F0;overflow:hidden;display:grid;place-items:center;font-size:11px;color:var(--muted);text-align:center}
#pane-muaban .mth img{width:100%;height:100%;object-fit:cover}
#pane-muaban .msrc{width:100%;border:1px solid #CBD5E1;border-radius:8px;padding:8px 10px;font:inherit;font-size:13px;min-width:0}
#pane-muaban .upl.sm{margin:0;padding:7px 12px;white-space:nowrap}
#pane-muaban .mrow .err{grid-column:1/-1;margin:0}
#pane-muaban .mbar{display:flex;gap:8px;flex-wrap:wrap}
#pane-muaban .btn.sm{padding:7px 14px;font-size:12.5px}
#pane-muaban .btn.primary-o{background:var(--primary-light);color:var(--accent);border-color:#BFDBFE;cursor:pointer}
@media(max-width:760px){#pane-muaban .mrow{grid-template-columns:64px 1fr auto auto}
#pane-muaban .mrow .upl.sm{grid-column:2}}
@media(max-width:760px){#pane-muaban .pc-body{grid-template-columns:1fr}
#pane-muaban .pc-fields{grid-template-columns:1fr}}
#pane-muaban{--primary:#0F3D8A;--primary-light:#EFF6FF;--accent:#2563EB;--card:#fff;--text:#0F172A;--muted:#64748B;--border:#E2E8F0;--danger-bg:#FEF2F2;--danger:#991B1B;--ok-bg:#ECFDF5;--ok:#065F46;--ok-b:#A7F3D0}
#pane-muaban *{box-sizing:border-box}
#pane-muaban .pt-save{position:sticky;bottom:0;z-index:5;margin-top:18px;background:#fff;border-top:1px solid var(--border);padding:12px 0;display:flex;justify-content:space-between;align-items:center;gap:12px}
#pane-muaban .pt-save small{color:var(--muted)}
#pane-muaban .pt-lead{color:var(--muted);margin:0 0 16px}
@media(max-width:760px){#pane-muaban .pt-save small{display:none}#pane-muaban .pt-save{justify-content:flex-end}}
                    </style>
                    <p class="pt-lead">Mỗi khung bên dưới là một thẻ pet trên trang <strong>/mua-ban/</strong>. Bấm vào thẻ ngoài website sẽ mở trang chi tiết của bé đó (ảnh/video, thông tin và mô tả SEO nhập ở đây).</p>

                    <?php if (isset($_GET['pets_saved'])): ?><div class="msg ok">Đã lưu thay đổi. Trang mua bán đã được cập nhật.</div><?php endif; ?>
                    <?php if (!empty($petsError)): ?><div class="msg bad"><?= h($petsError) ?></div><?php endif; ?>
                    <?php if (!$petsFromDb && !isset($_GET['pets_saved']) && empty($petsError)): ?><div class="msg ok" style="background:#EFF6FF;color:#1E3A8A;border-color:#BFDBFE">Đây là danh sách mẫu ban đầu. Bấm <strong>Lưu thay đổi</strong> để lưu vào cơ sở dữ liệu.</div><?php endif; ?>
                    <p class="pt-lead">Mỗi khung bên dưới là một thẻ pet trên trang <strong>/mua-ban/</strong>. Bấm vào thẻ ngoài website sẽ mở trang chi tiết của bé đó (ảnh/video, thông tin và mô tả SEO nhập ở đây).</p>

                    ${saved ? '<div class="msg ok">Đã lưu thay đổi. Trang mua bán đã được cập nhật.</div>' : ''}
                    ${petsError ? `<div class="msg bad">${h(petsError)}</div>` : ''}
                    ${!src.fromDb && !saved && !petsError ? '<div class="msg ok" style="background:#EFF6FF;color:#1E3A8A;border-color:#BFDBFE">Đây là danh sách mẫu ban đầu. Bấm <strong>Lưu thay đổi</strong> để lưu vào cơ sở dữ liệu.</div>' : ''}

                    <div class="bar">
                        <div class="filters" id="petFilters">
                            <button type="button" class="flt on" data-f="all">Tất cả (<span id="petCAll">0</span>)</button>
                            <button type="button" class="flt" data-f="cho">Chó (<span id="petCCho">0</span>)</button>
                            <button type="button" class="flt" data-f="meo">Mèo (<span id="petCMeo">0</span>)</button>
                        </div>
                        <button type="button" class="btn primary" id="petAddBtn">+ Thêm thẻ pet mới</button>
                    </div>

                    <div class="list" id="petList">
                        ${petsList.map((pet, pi) => petCard(pet, 'e' + pi)).join('')}
                    </div>
                    <div class="empty-note" id="petEmpty" hidden>Chưa có thẻ nào. Bấm “Thêm thẻ pet mới”.</div>
                    <template id="petTpl">${petCard(EMPTY_PET, '__I__')}</template>

                    <div class="pt-save">
                        <small>Bấm Lưu để áp dụng. Thứ tự trong danh sách chính là thứ tự hiển thị ngoài website.</small>
                        <button class="btn primary" type="submit" form="petForm" id="petSaveBtn">Lưu thay đổi</button>
                    </div>
                </section>
`;
}
