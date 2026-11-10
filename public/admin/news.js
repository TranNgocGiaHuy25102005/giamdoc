/* news.js — tab Quản lý Tin Tức (SEO) (port script trong admin/index.php) */
(function () {
                      var S = window.ADMIN_STATE || { q: {} };
                      var CSRF = S.csrf || '', BASE = '', DOMAIN = window.location.host || 'chunorapet.com';
                      document.querySelectorAll('#pane-news .nw-del').forEach(function (b) {
                        b.addEventListener('click', function () {
                          if (!confirm('Xoá bài viết "' + b.dataset.title + '"? Không thể hoàn tác.')) return;
                          document.getElementById('newsDelId').value = b.dataset.id; document.getElementById('newsDelForm').submit();
                        });
                      });
                      var ncl = document.getElementById('ncList');
                      if (ncl) {
                        document.getElementById('ncAdd').addEventListener('click', function () {
                          var d = document.createElement('div'); d.className = 'nc-row'; d.style.cssText = 'display:flex;gap:8px';
                          d.innerHTML = '<input form="newsCatForm" type="hidden" name="nc_key[]" value=""><input form="newsCatForm" class="cr-in" name="nc_label[]" maxlength="60" placeholder="Tên danh mục mới"><button type="button" class="nw-btn red nc-del">Xoá</button>';
                          ncl.appendChild(d); d.querySelector('.cr-in').focus();
                        });
                        ncl.addEventListener('click', function (e) { var b = e.target.closest('.nc-del'); if (b && ncl.children.length > 1) b.closest('.nc-row').remove(); });
                      }
                      var ed = document.getElementById('nwEd');
                      if (ed) {
                        var $ = function (id) { return document.getElementById(id); };
                        var title = $('nwTitle'), slug = $('nwSlug'), mt = $('nwMT'), md = $('nwMD'), kw = $('nwFocus');
                        var MAP = {'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a','è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e','ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i','ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o','ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u','ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y','đ':'d'};
                        function slugify(s) { s = s.toLowerCase().replace(/[^\u0000-\u007f]/g, function (c) { return MAP[c] || c; }); return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90); }
                        var auto = !slug.value || slug.value === slugify(title.value);
                        title.addEventListener('input', function () { if (auto) slug.value = slugify(title.value); serp(); });
                        slug.addEventListener('input', function () { auto = false; serp(); });
                        function cnt(el, out, max) { var n = el.value.length, o = $(out); o.textContent = n + '/' + max; o.classList.toggle('over', n > max); }
                        function serp() {
                          cnt(mt, 'nwMTc', 60); cnt(md, 'nwMDc', 160);
                          var t = mt.value.trim() || title.value.trim() || 'Tiêu đề bài viết';
                          var d = md.value.trim() || ($('nwExc').value.trim()) || ed.textContent.trim().replace(/\s+/g, ' ');
                          $('nwSu').textContent = DOMAIN + ' › tin-tuc › ' + (slug.value || 'duong-dan');
                          $('nwSt').textContent = t.length > 60 ? t.slice(0, 60) + '…' : t;
                          $('nwSd').textContent = d.length > 160 ? d.slice(0, 160) + '…' : (d || 'Mô tả sẽ hiển thị ở đây.');
                          var k = kw.value.trim().toLowerCase(), c = $('nwKwChk');
                          if (!k) { c.textContent = ''; return; }
                          var inT = t.toLowerCase().indexOf(k) >= 0, inD = (md.value || '').toLowerCase().indexOf(k) >= 0, inC = ed.textContent.toLowerCase().indexOf(k) >= 0;
                          c.innerHTML = 'Từ khóa trong: Meta title ' + (inT ? '✅' : '⚠️') + ' · Meta description ' + (inD ? '✅' : '⚠️') + ' · Nội dung ' + (inC ? '✅' : '⚠️');
                        }
                        [mt, md, kw, $('nwExc')].forEach(function (e) { e.addEventListener('input', serp); });
                        ed.addEventListener('input', serp); serp();
                        // thumbnail xem trước
                        var tb = $('nwThumbBox');
                        function showThumb(src) { tb.innerHTML = ''; if (src) { var im = new Image(); im.src = src; tb.appendChild(im); } else tb.textContent = 'Chưa có ảnh'; }
                        $('nwThumbUrl').addEventListener('change', function () { var v = this.value.trim(); showThumb(/^https?:/i.test(v) ? v : (v ? BASE + '/' + v : '')); });
                        $('nwThumbFile').addEventListener('change', function () { if (this.files[0]) showThumb(URL.createObjectURL(this.files[0])); });
                        // thanh công cụ
                        var pick = $('nwImgPick');
                        function exec(c, v) { ed.focus(); document.execCommand(c, false, v || null); serp(); }
                        $('nwTools').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
                        $('nwTools').addEventListener('click', function (e) {
                          var b = e.target.closest('button'); if (!b) return;
                          switch (b.dataset.cmd) {
                            case 'h2': exec('formatBlock', 'H2'); break;
                            case 'h3': exec('formatBlock', 'H3'); break;
                            case 'p': exec('formatBlock', 'P'); break;
                            case 'bold': exec('bold'); break;
                            case 'italic': exec('italic'); break;
                            case 'ul': exec('insertUnorderedList'); break;
                            case 'ol': exec('insertOrderedList'); break;
                            case 'quote': exec('formatBlock', 'BLOCKQUOTE'); break;
                            case 'clear': exec('removeFormat'); exec('formatBlock', 'P'); break;
                            case 'link': var u = prompt('Nhập địa chỉ liên kết (https://…)'); if (u) exec('createLink', u); break;
                            case 'image': pick.click(); break;
                          }
                        });
                        pick.addEventListener('change', function () {
                          var f = pick.files[0]; if (!f) return;
                          var fd = new FormData(); fd.append('csrf_token', CSRF); fd.append('news_upload', '1'); fd.append('file', f);
                          fetch('/admin/action', { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
                            if (!j.ok) { alert(j.error || 'Không tải được ảnh.'); return; }
                            var alt = prompt('Mô tả ảnh (alt, tốt cho SEO):', title.value) || '';
                            exec('insertHTML', '<img src="' + BASE + '/' + j.url + '" alt="' + alt.replace(/"/g, '&quot;') + '">');
                          }).catch(function () { alert('Lỗi mạng khi tải ảnh.'); });
                          pick.value = '';
                        });
                        ed.addEventListener('paste', function (e) {
                          e.preventDefault();
                          var t = (e.clipboardData || window.clipboardData).getData('text/plain');
                          document.execCommand('insertText', false, t);
                        });
                        var f = $('newsForm');
                        f.addEventListener('submit', function () {
                          $('nwContent').value = ed.innerHTML;
                          var b = $('nwSaveBtn'); if (b) { b.disabled = true; b.textContent = 'Đang lưu...'; }
                        });
                      }
                      if (S.q.news_saved !== undefined || S.q.news_deleted !== undefined || S.q.news_cats_saved !== undefined || S.flashKey === 'newsError' || S.q.edit !== undefined || S.q.tab === 'news') {
                      var t = document.querySelector('button.nav-tab[data-target="pane-news"]'); if (t) t.click();
                      }
})();
