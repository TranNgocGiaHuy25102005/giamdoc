import 'server-only';
import { h, on } from '../html';
import { flashFor, type AdminState } from '../types';
import { newsCategories, newsDateDmy, newsLoad, phpInt, type NewsArticle } from '../../stores/news';

/** Tab "📰 Quản lý Tin Tức (SEO)" — port nguyên khối #pane-news của admin/index.php */

type NewsEdit = Pick<NewsArticle, 'id' | 'title' | 'slug' | 'category' | 'thumbnail' | 'excerpt' | 'content' | 'meta_title' | 'meta_description' | 'focus_keyword' | 'author' | 'status'>;

/** Ảnh: URL tuyệt đối giữ nguyên, đường dẫn tương đối → '/' + path */
const imgSrc = (p: string): string => (/^https?:\/\//i.test(p) ? p : '/' + p);

/** date('d/m/Y', strtotime($d) ?: time()) */
function dmy(s: string): string {
  const d = newsDateDmy(s);
  if (d) return d;
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(n.getDate())}/${p(n.getMonth() + 1)}/${n.getFullYear()}`;
}

export async function renderNewsPane(st: AdminState): Promise<string> {
  let newsList: NewsArticle[] = [];
  try {
    newsList = newsLoad();
  } catch {
    newsList = [];
  }
  const cats = newsCategories();
  const newsError = flashFor(st, 'newsError');
  const newsEditing = st.q.edit !== undefined;
  let newsEdit: NewsEdit = {
    id: 0, title: '', slug: '', category: 'thu-tuc-bay', thumbnail: '', excerpt: '', content: '',
    meta_title: '', meta_description: '', focus_keyword: '', author: 'Chunora PET', status: 'published',
  };
  if (newsEditing) {
    const eid = phpInt(st.q.edit);
    for (const a of newsList) {
      if (eid > 0 && a.id === eid) newsEdit = a;
    }
  }

  const listHtml = `
                    <div class="cr-card"><h3>Danh mục bài viết</h3><div class="cr-body">
                        <p class="cr-hint" style="margin:0">Đổi tên, thêm hoặc xoá danh mục. Bài thuộc danh mục đã xoá sẽ chuyển về danh mục đầu tiên. Danh mục hiển thị thành nút lọc ở trang Tin tức.</p>
                        <div id="ncList" style="display:grid;gap:8px">
                        ${Object.entries(cats).map(([ck, cl]) => `
                            <div class="nc-row" style="display:flex;gap:8px"><input form="newsCatForm" type="hidden" name="nc_key[]" value="${h(ck)}"><input form="newsCatForm" class="cr-in" name="nc_label[]" value="${h(cl)}" maxlength="60"><button type="button" class="nw-btn red nc-del">Xoá</button></div>
                        `).join('')}
                        </div>
                        <div style="display:flex;gap:10px"><button type="button" class="nw-btn" id="ncAdd">+ Thêm danh mục</button><button type="submit" form="newsCatForm" class="nw-btn pri">Lưu danh mục</button></div>
                    </div></div>
                    <div class="nw-bar"><span style="color:var(--muted)">${newsList.length} bài viết</span><a class="nw-btn pri" href="/admin?edit=0">+ Viết bài mới</a></div>
                    <div class="cr-card" style="overflow:auto"><table class="nw-tbl">
                        <thead><tr><th>Ảnh</th><th>Tiêu đề</th><th class="hide-m">Danh mục</th><th>Trạng thái</th><th class="hide-m">Lượt xem</th><th class="hide-m">Ngày đăng</th><th></th></tr></thead>
                        <tbody>
                        ${newsList.map((a) => `
                            <tr>
                                <td>${a.thumbnail !== '' ? `<img src="${h(imgSrc(a.thumbnail))}" alt="">` : ''}</td>
                                <td><strong>${h(a.title)}</strong><div style="font-size:12px;color:var(--muted)">/tin-tuc?slug=${h(a.slug)}</div></td>
                                <td class="hide-m">${h(Object.prototype.hasOwnProperty.call(cats, a.category) ? cats[a.category] : '')}</td>
                                <td><span class="nw-st ${a.status === 'draft' ? 'dr' : 'pub'}">${a.status === 'draft' ? 'Bản nháp' : 'Đã đăng'}</span></td>
                                <td class="hide-m">${phpInt(a.views)}</td>
                                <td class="hide-m">${h(dmy(a.created_at))}</td>
                                <td style="white-space:nowrap">
                                    <a class="nw-btn" href="/admin?edit=${phpInt(a.id)}">Sửa</a>
                                    <button type="button" class="nw-btn red nw-del" data-id="${phpInt(a.id)}" data-title="${h(a.title)}">Xoá</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${!newsList.length ? `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Chưa có bài viết.</td></tr>` : ''}
                        </tbody></table></div>`;

  const e = newsEdit;
  const editHtml = `
                    <div class="nw-bar"><a class="nw-btn" href="/admin?tab=news">← Danh sách bài viết</a></div>
                    <input form="newsForm" type="hidden" name="nw[id]" value="${phpInt(e.id)}">
                    <div class="cr-card"><h3>Nội dung bài viết</h3><div class="cr-body">
                        <div class="cr-field"><label for="nwTitle">Tiêu đề bài viết (H1)</label><input form="newsForm" class="cr-in" id="nwTitle" name="nw[title]" value="${h(e.title)}" maxlength="200" required></div>
                        <div class="cr-grid2">
                            <div class="cr-field"><label for="nwSlug">Đường dẫn (slug)</label><input form="newsForm" class="cr-in" id="nwSlug" name="nw[slug]" value="${h(e.slug)}" maxlength="120"><p class="cr-hint">Tự tạo không dấu khi bạn gõ tiêu đề. Có thể tự sửa.</p></div>
                            <div class="cr-field"><label>Danh mục</label>
                                <select form="newsForm" class="cr-in" name="nw[category]">${Object.entries(cats).map(([k, lb]) => `<option value="${h(k)}"${on(e.category === k, 'selected')}>${h(lb)}</option>`).join('')}</select></div>
                        </div>
                        <div class="cr-field"><label>Ảnh đại diện (thumbnail)</label>
                            <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
                                <div class="nw-thumb" id="nwThumbBox">${e.thumbnail !== '' ? `<img src="${h(imgSrc(e.thumbnail))}" alt="">` : 'Chưa có ảnh'}</div>
                                <div style="flex:1;min-width:240px;display:grid;gap:8px">
                                    <input form="newsForm" class="cr-in" id="nwThumbUrl" name="nw[thumbnail]" value="${h(e.thumbnail)}" placeholder="Dán link ảnh (URL) hoặc tải ảnh lên bên dưới">
                                    <input form="newsForm" class="cr-in" type="file" id="nwThumbFile" name="nw_thumb" accept="image/*">
                                    <p class="cr-hint" style="margin:0">Ảnh tải lên được tự chuyển sang WebP. Nên dùng ảnh ngang tỉ lệ 16:9.</p>
                                </div></div></div>
                        <div class="cr-field"><label for="nwExc">Mô tả ngắn (hiển thị ở danh sách)</label><textarea form="newsForm" class="cr-in" id="nwExc" name="nw[excerpt]" rows="3" maxlength="400">${h(e.excerpt)}</textarea></div>
                        <div class="cr-field"><label>Nội dung bài viết</label>
                            <div class="nw-tools" id="nwTools">
                                <button type="button" data-cmd="h2" title="Tiêu đề H2">H2</button><button type="button" data-cmd="h3" title="Tiêu đề H3">H3</button><button type="button" data-cmd="p" title="Đoạn văn">¶</button>
                                <button type="button" data-cmd="bold" title="In đậm"><b>B</b></button><button type="button" data-cmd="italic" title="In nghiêng"><i>I</i></button>
                                <button type="button" data-cmd="ul" title="Danh sách">• Danh sách</button><button type="button" data-cmd="ol" title="Danh sách số">1. Số</button>
                                <button type="button" data-cmd="quote" title="Trích dẫn">❝</button><button type="button" data-cmd="link" title="Chèn liên kết">🔗</button>
                                <button type="button" data-cmd="image" title="Chèn ảnh từ máy">🖼 Ảnh</button><button type="button" data-cmd="clear" title="Xoá định dạng">Tx</button>
                                <input type="file" id="nwImgPick" accept="image/*" hidden>
                            </div>
                            <div class="nw-ed" id="nwEd" contenteditable="true">${String(e.content)}</div>
                            <textarea form="newsForm" name="nw[content]" id="nwContent" hidden></textarea>
                            <p class="cr-hint">Dùng H2/H3 để chia mục — trang bài viết sẽ tự tạo mục lục. Chèn ảnh sẽ tự chuyển sang WebP.</p></div>
                    </div></div>

                    <div class="cr-card"><h3>Tối ưu SEO (Technical SEO)</h3><div class="cr-body">
                        <div class="cr-field"><label for="nwFocus">Từ khóa chính (Focus Keyword)</label><input form="newsForm" class="cr-in" id="nwFocus" name="nw[focus_keyword]" value="${h(e.focus_keyword)}" maxlength="100"><div id="nwKwChk" class="cr-hint"></div></div>
                        <div class="cr-field"><label for="nwMT">Meta title <span class="nw-cnt" id="nwMTc">0/60</span></label><input form="newsForm" class="cr-in" id="nwMT" name="nw[meta_title]" value="${h(e.meta_title)}" maxlength="120"></div>
                        <div class="cr-field"><label for="nwMD">Meta description <span class="nw-cnt" id="nwMDc">0/160</span></label><textarea form="newsForm" class="cr-in" id="nwMD" name="nw[meta_description]" rows="3" maxlength="320">${h(e.meta_description)}</textarea></div>
                        <div class="cr-field"><label>Xem trước kết quả trên Google</label>
                            <div class="nw-serp"><div class="u" id="nwSu"></div><div class="t" id="nwSt"></div><div class="d" id="nwSd"></div></div></div>
                        <div class="cr-grid2">
                            <div class="cr-field"><label for="nwAuthor">Tác giả</label><input form="newsForm" class="cr-in" id="nwAuthor" name="nw[author]" value="${h(e.author)}" maxlength="80"></div>
                            <div class="cr-field"><label>Trạng thái</label><select form="newsForm" class="cr-in" name="nw[status]"><option value="published"${on(e.status !== 'draft', 'selected')}>Đăng công khai</option><option value="draft"${on(e.status === 'draft', 'selected')}>Lưu bản nháp</option></select></div>
                        </div>
                    </div></div>
                    <div class="nw-save"><button type="submit" form="newsForm" id="nwSaveBtn">${phpInt(e.id) > 0 ? 'LƯU CẬP NHẬT' : 'ĐĂNG BÀI VIẾT'}</button></div>`;

  return `
                <section class="panel section-pane" id="pane-news">
                    <div class="panel-header">
                        <h2>📰 Quản lý Tin Tức (SEO)</h2>
                        <a class="button outline btn-sm" href="/tin-tuc" target="_blank" rel="noopener">Xem trang Tin tức</a>
                    </div>
                    <style>
#pane-news{--primary:#0F3D8A;--accent:#2563EB;--text:#0F172A;--muted:#64748B;--border:#E2E8F0}
#pane-news *{box-sizing:border-box}
#pane-news .cr-msg{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-weight:500}
#pane-news .cr-msg.ok{background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0}
#pane-news .cr-msg.bad{background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA}
#pane-news .cr-card{background:#fff;border:1px solid var(--border);border-radius:16px;margin-bottom:18px;overflow:hidden}
#pane-news .cr-card>h3{margin:0;padding:14px 18px;background:#F8FAFC;border-bottom:1px solid var(--border);font-size:15px}
#pane-news .cr-body{padding:18px;display:grid;gap:14px}
#pane-news .cr-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#pane-news .cr-field>label{display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}
#pane-news .cr-hint{font-size:12.5px;color:var(--muted);margin:5px 0 0}
#pane-news .cr-in{width:100%;border:1px solid #CBD5E1;border-radius:9px;padding:9px 12px;font:500 14px 'Be Vietnam Pro',sans-serif;color:var(--text);background:#fff}
#pane-news .cr-in:focus{outline:2px solid #BFDBFE;border-color:var(--accent)}
#pane-news textarea.cr-in{resize:vertical}
#pane-news .nw-tbl{width:100%;border-collapse:collapse;font-size:14px}
#pane-news .nw-tbl th,#pane-news .nw-tbl td{padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;vertical-align:middle}
#pane-news .nw-tbl th{background:#F8FAFC;font-size:12.5px;color:#475569}
#pane-news .nw-tbl img{width:64px;height:44px;object-fit:cover;border-radius:7px;display:block;background:#F1F5F9}
#pane-news .nw-st{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700}
#pane-news .nw-st.pub{background:#DCFCE7;color:#166534}
#pane-news .nw-st.dr{background:#FEF3C7;color:#92400E}
#pane-news .nw-btn{display:inline-block;border:1px solid #BFDBFE;background:#EFF6FF;color:var(--primary);border-radius:8px;padding:6px 12px;font:700 13px 'Be Vietnam Pro',sans-serif;cursor:pointer;text-decoration:none}
#pane-news .nw-btn.red{border-color:#FECACA;background:#FEF2F2;color:#B91C1C}
#pane-news .nw-btn.pri{background:var(--primary);color:#fff;border-color:var(--primary);padding:10px 18px}
#pane-news .nw-bar{display:flex;gap:10px;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap}
#pane-news .nw-tools{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#F8FAFC;border:1px solid #CBD5E1;border-bottom:0;border-radius:9px 9px 0 0}
#pane-news .nw-tools button{border:1px solid var(--border);background:#fff;border-radius:7px;min-width:36px;height:34px;padding:0 10px;font-weight:700;cursor:pointer}
#pane-news .nw-tools button:hover{background:#EFF6FF}
#pane-news .nw-ed{min-height:380px;max-height:640px;overflow:auto;border:1px solid #CBD5E1;border-radius:0 0 9px 9px;padding:16px 18px;background:#fff;line-height:1.7;font-size:15px}
#pane-news .nw-ed:focus{outline:2px solid #BFDBFE}
#pane-news .nw-ed h2{font-size:24px;margin:18px 0 8px}
#pane-news .nw-ed h3{font-size:19px;margin:14px 0 6px}
#pane-news .nw-ed img{max-width:100%;height:auto;border-radius:8px}
#pane-news .nw-ed blockquote{border-left:4px solid #F59E0B;background:#FFF8E7;margin:12px 0;padding:8px 14px}
#pane-news .nw-cnt{font-size:12.5px;color:var(--muted);float:right;font-weight:600}
#pane-news .nw-cnt.over{color:#B91C1C}
#pane-news .nw-serp{border:1px solid var(--border);border-radius:12px;padding:16px 18px;background:#fff;max-width:640px}
#pane-news .nw-serp .u{font:13px Arial,sans-serif;color:#202124;margin-bottom:2px}
#pane-news .nw-serp .t{font:20px Arial,sans-serif;color:#1a0dab;line-height:1.3;margin-bottom:3px;word-break:break-word}
#pane-news .nw-serp .d{font:14px Arial,sans-serif;color:#4d5156;line-height:1.5;word-break:break-word}
#pane-news .nw-thumb{width:150px;height:96px;border:1px dashed #CBD5E1;border-radius:9px;overflow:hidden;background:#F8FAFC;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px}
#pane-news .nw-thumb img{width:100%;height:100%;object-fit:cover}
#pane-news .nw-save{position:sticky;bottom:0;background:#fff;border-top:1px solid var(--border);padding:14px 0}
#pane-news .nw-save button{width:100%;border:0;border-radius:12px;padding:16px;background:var(--primary);color:#fff;font:800 15px 'Be Vietnam Pro',sans-serif;cursor:pointer;letter-spacing:.4px}
#pane-news .nw-save button:hover{background:var(--accent)}
@media(max-width:900px){#pane-news .cr-grid2{grid-template-columns:1fr}#pane-news .nw-tbl .hide-m{display:none}}
                    </style>
                    ${st.q.news_saved !== undefined ? '<div class="cr-msg ok">Đã lưu bài viết. Nội dung đã hiển thị trên website.</div>' : ''}
                    ${st.q.news_cats_saved !== undefined ? '<div class="cr-msg ok">Đã lưu danh mục.</div>' : ''}
                    ${st.q.news_deleted !== undefined ? '<div class="cr-msg ok">Đã xoá bài viết.</div>' : ''}
                    ${newsError ? `<div class="cr-msg bad">${h(newsError)}</div>` : ''}
${newsEditing ? editHtml : listHtml}
                </section>
`;
}
