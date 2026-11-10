import 'server-only';
import { h, on } from '../html';
import { flashFor, type AdminState } from '../types';
import { COUNTRIES, LANGS } from '../../i18n/countries';
import { FLAGS } from '../../i18n/flags';
import { loadPhrases } from '../../i18n/phrases';
import { loadSettings, type MlSettings } from '../../i18n/settings';
import { mlPagesAll, mlSecret, mlStats, mlUnits } from '../../i18n/admin';

/** Tab "Đa Quốc Gia & Dịch Thuật" — port nguyên từ admin/index.php (pane-multilang) */

const flag = (code: string, w = 22) =>
  `<svg class="cp-flag" width="${w}" height="${Math.round((w * 2) / 3)}" viewBox="0 0 30 20" aria-hidden="true" focusable="false">${FLAGS[code] ?? '<rect width="30" height="20" fill="#cbd5e1"/>'}</svg>`;

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '');

const STYLE = `
#pane-multilang{--primary:#0F3D8A;--accent:#2563EB;--text:#0F172A;--muted:#64748B;--border:#E2E8F0}
#pane-multilang *{box-sizing:border-box}
#pane-multilang .cr-msg{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-weight:500}
#pane-multilang .cr-msg.ok{background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0}
#pane-multilang .cr-msg.bad{background:#FEF2F2;color:#B91C1C;border:1px solid #FECACA}
#pane-multilang .cr-card{background:#fff;border:1px solid var(--border);border-radius:16px;margin-bottom:18px;overflow:hidden}
#pane-multilang .cr-card>h3{margin:0;padding:14px 18px;background:#F8FAFC;border-bottom:1px solid var(--border);font-size:15px}
#pane-multilang .cr-body{padding:18px;display:grid;gap:14px}
#pane-multilang .cr-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#pane-multilang .cr-field>label{display:block;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}
#pane-multilang .cr-hint{font-size:12.5px;color:var(--muted);margin:5px 0 0;line-height:1.5}
#pane-multilang .cr-in{width:100%;border:1px solid #CBD5E1;border-radius:9px;padding:9px 12px;font:500 14px 'Be Vietnam Pro',sans-serif;color:var(--text);background:#fff}
#pane-multilang .cr-in:focus{outline:2px solid #BFDBFE;border-color:var(--accent)}
#pane-multilang .ml-tblw{overflow-x:auto}
#pane-multilang .ml-tbl{width:100%;border-collapse:collapse;font-size:14px;min-width:620px}
#pane-multilang .ml-tbl th,#pane-multilang .ml-tbl td{padding:9px 10px;border-bottom:1px solid var(--border);text-align:left;vertical-align:middle}
#pane-multilang .ml-tbl th{background:#F8FAFC;font-size:12.5px;color:#475569}
#pane-multilang .ml-fl{display:flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap}
#pane-multilang .ml-btn{display:inline-block;border:1px solid #BFDBFE;background:#EFF6FF;color:var(--primary);border-radius:9px;padding:9px 16px;font:700 14px 'Be Vietnam Pro',sans-serif;cursor:pointer;text-decoration:none}
#pane-multilang .ml-btn.pri{background:var(--primary);color:#fff;border-color:var(--primary)}
#pane-multilang .ml-btn.go{background:#F59E0B;border-color:#F59E0B;color:#0B1E3B;font-size:15px;padding:12px 20px}
#pane-multilang .ml-btn:disabled{opacity:.55;cursor:wait}
#pane-multilang .ml-bar{height:14px;border-radius:99px;background:#E2E8F0;overflow:hidden}
#pane-multilang .ml-bar>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2563EB,#F59E0B);transition:width .25s}
#pane-multilang .ml-log{font:500 13px/1.6 'Be Vietnam Pro',sans-serif;color:#334155;max-height:220px;overflow:auto;background:#F8FAFC;border:1px solid var(--border);border-radius:9px;padding:10px 12px;white-space:pre-wrap}
#pane-multilang .ml-st{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;background:#F1F5F9;color:#334155}
#pane-multilang .ml-st.full{background:#DCFCE7;color:#166534}
#pane-multilang .ml-radio{display:flex;gap:16px;flex-wrap:wrap}
#pane-multilang .ml-radio label{font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px}
#pane-multilang .ml-ph{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)}
#pane-multilang .ml-ph .src{font-size:13px;color:#475569;line-height:1.5;word-break:break-word}
#pane-multilang textarea.cr-in{resize:vertical;min-height:44px}
@media(max-width:760px){#pane-multilang .cr-grid2,#pane-multilang .ml-ph{grid-template-columns:1fr}}
`;

export async function renderMultilangPane(st: AdminState): Promise<string> {
  let mlError = flashFor(st, 'mlError');
  let ready = false;
  let set: MlSettings | null = null;
  let stats: Record<string, [number, number]> = {};
  let pages: string[] = [];
  let langSel = st.q.ml_lang ?? 'en';
  if (!(langSel in LANGS) || langSel === 'vi') langSel = 'en';
  const mlQ = (st.q.ml_q ?? '').trim();
  try {
    set = loadSettings();
    stats = mlStats();
    pages = Object.keys(await mlPagesAll());
    ready = true;
  } catch (e) {
    mlError = mlError || (e as Error).message;
  }

  let body = '';
  if (ready && set) {
    const s = set;
    const langs = Object.keys(LANGS).filter((l) => l !== 'vi');
    const keyLabel = (name: 'anthropic' | 'openai' | 'gemini') => (mlSecret(name) !== '' ? '(đã có — để trống nếu giữ nguyên)' : '');

    const countryRows = Object.entries(COUNTRIES)
      .map(([mc, mi]) => {
        const mr = s.countries[mc];
        const opts: [string, string][] = [
          ['auto', 'Tự động (' + (mc === 'VN' ? 'Zalo' : 'WhatsApp') + ')'],
          ['zalo', 'Zalo'],
          ['whatsapp', 'WhatsApp'],
          ['telegram', 'Telegram'],
        ];
        return `
                                    <tr>
                                        <td><span class="ml-fl">${flag(mc, 28)} ${h(mi[0])} <small style="color:#64748B">(${h(mc)} · ${h(mi[2])})</small></span></td>
                                        <td>${h(LANGS[mi[1]])}</td>
                                        <td><input form="mlForm" type="checkbox" name="c[${h(mc)}][enabled]" value="1"${on(mr.enabled)}${on(mc === 'VN', 'disabled')}></td>
                                        <td><select form="mlForm" class="cr-in" name="c[${h(mc)}][channel]" ${mc === 'VN' ? 'aria-label="Zalo"' : ''}>
                                            ${opts.map(([ov, ol]) => `<option value="${h(ov)}"${on(mr.channel === ov, 'selected')}>${h(ol)}</option>`).join('')}</select></td>
                                        <td><input form="mlForm" class="cr-in" name="c[${h(mc)}][greeting]" value="${h(mr.greeting)}" maxlength="200" placeholder="Lời chào hiện khi khách chọn nước này"></td>
                                    </tr>`;
      })
      .join('');

    const statRows = Object.entries(stats)
      .map(
        ([sl, sv]) =>
          `<tr><td>${h(LANGS[sl])} <small style="color:#64748B">(${h(sl)})</small></td><td><span class="ml-st${sv[1] > 0 && sv[0] >= sv[1] ? ' full' : ''}" id="mlSt-${h(sl)}">${sv[0]} / ${sv[1]}</span></td></tr>`,
      )
      .join('');

    const dict = loadPhrases(langSel);
    let rows: [string, string][] = [];
    const ql = mlQ.toLowerCase();
    for (const mu of mlUnits()) {
      const mv = String(dict[mu] ?? '');
      if (mlQ !== '' && !stripTags(mu + ' ' + mv).toLowerCase().includes(ql)) continue;
      rows.push([mu, mv]);
    }
    const totalRows = rows.length;
    rows = rows.slice(0, 150);

    const phrasesBlock = !rows.length
      ? `<p class="cr-hint">Chưa có câu nào. Bấm nút “Tự động dịch &amp; Đồng bộ” phía trên để quét nội dung.</p>`
      : `<p class="cr-hint">Hiển thị ${rows.length} / ${totalRows} câu. Ô để trống = chưa dịch (sẽ hiện tiếng Việt). Chỉ cho phép thẻ nhẹ như &lt;em&gt;, &lt;strong&gt;, &lt;br&gt;.</p>
                                <form method="post" action="/admin/action">
                                    <input type="hidden" name="csrf_token" value="${h(st.csrf)}">
                                    <input type="hidden" name="ml_phrases_save" value="1">
                                    <input type="hidden" name="ml_lang" value="${h(langSel)}">
                                    ${rows
                                      .map(
                                        ([mu, mv], i) => `
                                    <div class="ml-ph">
                                        <div class="src">${h(mu)}</div>
                                        <div><input type="hidden" name="ph[${i}][k]" value="${h(mu)}"><textarea class="cr-in" name="ph[${i}][v]" rows="2">${h(mv)}</textarea></div>
                                    </div>`,
                                      )
                                      .join('')}
                                    <div style="margin-top:14px"><button type="submit" class="ml-btn pri">Lưu bản dịch</button></div>
                                </form>`;

    body = `
                    <div class="cr-card">
                        <h3>📞 Liên hệ cho khách quốc tế</h3>
                        <div class="cr-body">
                            <div class="cr-grid2">
                                <div class="cr-field"><label>Hotline hiển thị</label><input form="mlForm" class="cr-in" name="intl_phone" value="${h(s.intl_phone)}" maxlength="40"></div>
                                <div class="cr-field"><label>Số bấm gọi (tel:)</label><input form="mlForm" class="cr-in" name="intl_phone_tel" value="${h(s.intl_phone_tel)}" maxlength="30"></div>
                                <div class="cr-field"><label>Link WhatsApp</label><input form="mlForm" class="cr-in" name="whatsapp_url" value="${h(s.whatsapp_url)}" maxlength="300"></div>
                                <div class="cr-field"><label>Link Telegram (https://t.me/…)</label><input form="mlForm" class="cr-in" name="telegram_url" value="${h(s.telegram_url)}" maxlength="300" placeholder="https://t.me/ten_ban"><p class="cr-hint">Để trống nếu chưa có — hệ thống sẽ dùng WhatsApp.</p></div>
                            </div>
                            <p class="cr-hint">Việt Nam vẫn dùng Zalo + hotline trong mục “Thông tin liên hệ”. Khách chọn quốc gia khác sẽ thấy các thông tin ở trên (Header, Hero, nút nổi, form liên hệ, Footer).</p>
                        </div>
                    </div>
                    <div class="cr-card">
                        <h3>🤖 Động cơ dịch tự động</h3>
                        <div class="cr-body">
                            <div class="ml-radio">
                                <label><input form="mlForm" type="radio" name="engine" value="free"${on(s.engine === 'free')}> Miễn phí (Google GTX, không cần khoá)</label>
                                <label><input form="mlForm" type="radio" name="engine" value="gemini"${on(s.engine === 'gemini')}> Gemini API (có gói miễn phí, không cần thẻ)</label>
                                <label><input form="mlForm" type="radio" name="engine" value="claude"${on(s.engine === 'claude')}> Claude API (thuật ngữ thú y chuẩn hơn)</label>
                                <label><input form="mlForm" type="radio" name="engine" value="openai"${on(s.engine === 'openai')}> OpenAI API</label>
                            </div>
                            <div class="cr-grid2">
                                <div class="cr-field"><label>Gemini API key ${keyLabel('gemini')}</label><input form="mlForm" class="cr-in" type="password" name="gemini_key" autocomplete="off" placeholder="AIza…"><label style="font-weight:500;margin-top:6px"><input form="mlForm" type="checkbox" name="gemini_key_clear" value="1"> Xóa khoá đã lưu</label><p class="cr-hint">Lấy miễn phí tại aistudio.google.com/apikey</p></div>
                                <div class="cr-field"><label>Model Gemini</label><input form="mlForm" class="cr-in" name="gemini_model" value="${h(s.gemini_model)}" maxlength="60"></div>
                                <div class="cr-field"><label>Claude API key ${keyLabel('anthropic')}</label><input form="mlForm" class="cr-in" type="password" name="claude_key" autocomplete="off" placeholder="sk-ant-…"><label style="font-weight:500;margin-top:6px"><input form="mlForm" type="checkbox" name="claude_key_clear" value="1"> Xóa khoá đã lưu</label></div>
                                <div class="cr-field"><label>Model Claude</label><input form="mlForm" class="cr-in" name="claude_model" value="${h(s.claude_model)}" maxlength="60"></div>
                                <div class="cr-field"><label>OpenAI API key ${keyLabel('openai')}</label><input form="mlForm" class="cr-in" type="password" name="openai_key" autocomplete="off" placeholder="sk-…"><label style="font-weight:500;margin-top:6px"><input form="mlForm" type="checkbox" name="openai_key_clear" value="1"> Xóa khoá đã lưu</label></div>
                                <div class="cr-field"><label>Model OpenAI</label><input form="mlForm" class="cr-in" name="openai_model" value="${h(s.openai_model)}" maxlength="60"></div>
                            </div>
                            <p class="cr-hint">Có thể đặt khoá trong <code>.env.local</code> (<code>GEMINI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, <code>OPENAI_API_KEY</code>) thay vì nhập ở đây. Khoá không bao giờ hiển thị lại trên màn hình.</p>
                        </div>
                    </div>
                    <div class="cr-card">
                        <h3>🏳️ 14 quốc gia hỗ trợ</h3>
                        <div class="cr-body ml-tblw">
                            <table class="ml-tbl">
                                <thead><tr><th>Quốc gia</th><th>Ngôn ngữ</th><th>Hiện trên menu</th><th>Kênh ưu tiên</th><th>Lời chào riêng</th></tr></thead>
                                <tbody>${countryRows}
                                </tbody>
                            </table>
                            <div><button type="submit" form="mlForm" class="ml-btn pri">Lưu cấu hình</button></div>
                        </div>
                    </div>
                    <div class="cr-card">
                        <h3>⚡ Dịch &amp; đồng bộ toàn bộ dữ liệu</h3>
                        <div class="cr-body">
                            <p class="cr-hint" style="margin:0">Hệ thống quét toàn bộ nội dung tiếng Việt hiện có (trang chủ, vận chuyển, chăm sóc, mua bán, tin tức, footer…) rồi dịch sang 8 ngôn ngữ, giữ nguyên cấu trúc, thẻ HTML và tên thương hiệu “Chunora PET”. Chỉ dịch các câu chưa có bản dịch — chạy lại sau mỗi lần sửa nội dung tiếng Việt.</p>
                            <div><button type="button" class="ml-btn go" id="mlSyncBtn" data-pages="${h(JSON.stringify(pages))}" data-langs="${h(JSON.stringify(langs))}" data-lang-names="${h(JSON.stringify(LANGS))}">⚡ Tự động dịch &amp; Đồng bộ toàn bộ dữ liệu</button></div>
                            <div class="ml-bar" aria-hidden="true"><i id="mlBar"></i></div>
                            <div id="mlStatus" style="font-weight:700"></div>
                            <div class="ml-log" id="mlLog" hidden></div>
                            <div class="ml-tblw"><table class="ml-tbl" style="min-width:420px">
                                <thead><tr><th>Ngôn ngữ</th><th>Đã dịch</th></tr></thead>
                                <tbody>
                                ${statRows}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                    <div class="cr-card">
                        <h3>✏️ Sửa bản dịch thủ công</h3>
                        <div class="cr-body">
                            <form method="get" action="/admin" class="cr-grid2">
                                <input type="hidden" name="tab" value="multilang">
                                <div class="cr-field"><label>Ngôn ngữ</label><select class="cr-in" name="ml_lang" onchange="this.form.submit()">
                                    ${langs.map((sl) => `<option value="${h(sl)}"${on(sl === langSel, 'selected')}>${h(LANGS[sl])} (${h(sl)})</option>`).join('')}
                                </select></div>
                                <div class="cr-field"><label>Tìm câu</label><input class="cr-in" name="ml_q" value="${h(mlQ)}" placeholder="Gõ từ khoá tiếng Việt hoặc bản dịch…"></div>
                            </form>
                            ${phrasesBlock}
                        </div>
                    </div>`;
  } else {
    body = `
                    <div class="cr-msg bad">Chưa nạp được bộ đa quốc gia (lib/i18n/admin.ts).</div>`;
  }

  return `
                <section class="panel section-pane" id="pane-multilang">
                    <div class="panel-header">
                        <h2>🌍 Đa Quốc Gia &amp; Dịch Thuật</h2>
                    </div>
                    <style>${STYLE}</style>
                    ${st.q.ml_saved !== undefined ? '<div class="cr-msg ok">Đã lưu. Website đã được cập nhật.</div>' : ''}
                    ${mlError ? `<div class="cr-msg bad">${h(mlError)}</div>` : ''}${body}
                </section>`;
}
