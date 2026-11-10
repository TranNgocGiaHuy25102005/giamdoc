/* multilang.js — tab Đa Quốc Gia & Dịch Thuật (port script trong admin/index.php) */
(function () {
  var S = window.ADMIN_STATE || { q: {} };
  var btn = document.getElementById('mlSyncBtn');
  if (btn) {
    var bar = document.getElementById('mlBar'), st = document.getElementById('mlStatus'), logEl = document.getElementById('mlLog');
    var csrf = S.csrf || '';
    var parse = function (s, d) { try { return JSON.parse(s || ''); } catch (e) { return d; } };
    var pages = parse(btn.getAttribute('data-pages'), []);
    var langs = parse(btn.getAttribute('data-langs'), []);
    var langNames = parse(btn.getAttribute('data-lang-names'), {});
    var log = function (t) { logEl.hidden = false; logEl.textContent += t + '\n'; logEl.scrollTop = logEl.scrollHeight; };
    var post = function (params) {
      var b = new FormData(); b.append('csrf_token', csrf);
      Object.keys(params).forEach(function (k) { b.append(k, params[k]); });
      return fetch('/admin/action', { method: 'POST', credentials: 'same-origin', body: b })
        .then(function (r) { return r.text(); })
        .then(function (t) { try { return JSON.parse(t); } catch (e) { return { ok: false, error: 'Máy chủ trả về dữ liệu không hợp lệ.' }; } });
    };
    var setBar = function (p) { bar.style.width = Math.max(0, Math.min(100, p)) + '%'; };
    var srcUrl = function (p) {
      // giữ nguyên query sẵn có (vd. /chinh-sach?trang=doi-tra), chỉ thêm lang_src=1; luôn cùng origin
      var u = new URL(p, window.location.origin);
      u.searchParams.set('lang_src', '1');
      return u.pathname + u.search;
    };
    btn.addEventListener('click', async function () {
      btn.disabled = true; logEl.textContent = ''; setBar(0);
      var steps = pages.length + langs.length * 3, done = 0;
      try {
        // 1. quét nội dung gốc (Tiếng Việt)
        for (var i = 0; i < pages.length; i++) {
          st.textContent = 'Đang quét: ' + pages[i];
          try {
            var res = await fetch(srcUrl(pages[i]), { credentials: 'same-origin', cache: 'no-store' });
            var html = await res.text();
            if (!res.ok) { log('⚠ ' + pages[i] + ' — HTTP ' + res.status + ' (bỏ qua)'); }
            else {
              var r = await post({ ml_collect: 1, reset: i === 0 ? 1 : 0, html: html });
              if (!r.ok) { log('⚠ ' + pages[i] + ': ' + (r.error || 'lỗi')); }
              else log('✔ ' + pages[i] + ' — ' + r.total + ' câu (+' + r.new + ' mới)');
            }
          } catch (e) { log('⚠ ' + pages[i] + ': ' + e.message); }
          done++; setBar(done / steps * 100);
        }
        // 2. dịch từng ngôn ngữ theo lô
        for (var l = 0; l < langs.length; l++) {
          var lg = langs[l], guard = 0, fails = 0, total = 0;
          while (guard++ < 400) {
            st.textContent = 'Đang dịch ' + langNames[lg] + '…';
            var s = await post({ ml_translate_step: 1, lang: lg });
            if (!s.ok && s.remaining !== 0) {
              fails++;
              if (s.error) log('⚠ ' + langNames[lg] + ': ' + s.error);
              if (fails >= 5) break;
              st.textContent = 'Máy chủ dịch đang bận, thử lại sau 5 giây… (' + langNames[lg] + ')';
              await new Promise(function (rs) { setTimeout(rs, 5000); });
              continue;
            }
            fails = 0;
            total += s.done || 0;
            if (!s.remaining) break;
            setBar((done + 3 * (1 - Math.min(1, s.remaining / 400))) / steps * 100);
          }
          done += 3; setBar(done / steps * 100);
          log((fails >= 5 ? '✖ ' : '✔ ') + langNames[lg] + ' — dịch thêm ' + total + ' câu');
        }
        st.textContent = '✅ Hoàn tất. Tải lại trang để xem thống kê.'; setBar(100);
      } catch (e) { st.textContent = 'Lỗi: ' + e.message; }
      btn.disabled = false;
    });
  }
  if (S.q.ml_saved !== undefined || S.flashKey === 'mlError' || S.q.tab === 'multilang') {
    var t = document.querySelector('button.nav-tab[data-target="pane-multilang"]');
    if (t) t.click();
  }
})();
