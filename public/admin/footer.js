/* footer.js — tab Cấu hình Footer (port script trong admin/index.php) */
(function () {
                        var pane = document.getElementById('pane-footer');
                        if (!pane) return;
                        pane.addEventListener('click', function (e) {
                            var add = e.target.closest('[data-add]');
                            if (add) {
                                var k = add.getAttribute('data-add');
                                var rows = pane.querySelector('.fs-rows[data-key="' + k + '"]');
                                rows.insertAdjacentHTML('beforeend', document.getElementById('fs-tpl-' + k).innerHTML);
                                rows.lastElementChild.querySelector('input').focus();
                                return;
                            }
                            var del = e.target.closest('.fs-del');
                            if (del) del.closest('.fs-row').remove();
                        });
                        // Nhập link vào ô đang trống → tự tick bật mạng xã hội đó
                        pane.addEventListener('input', function (e) {
                            var el = e.target;
                            if (!el.matches || !el.matches('input[name^="fs_soc_url"]')) return;
                            var cb = el.closest('.fs-soc').querySelector('input[type="checkbox"]');
                            if (el.dataset.was === undefined) el.dataset.was = el.defaultValue ? '1' : '';
                            if (!el.dataset.was && el.value.trim() && cb) { cb.checked = true; el.dataset.was = '1'; }
                        });
                        // Bật/tắt thanh "Lưu" chung của các mục khác khi đang ở tab Footer
                        document.addEventListener('click', function (e) {
                            var tab = e.target.closest('button.nav-tab');
                            if (tab) document.body.classList.toggle('fs-active', ['pane-footer', 'pane-muaban', 'pane-care', 'pane-transport', 'pane-about', 'pane-news', 'pane-multilang'].indexOf(tab.dataset.target) !== -1);
                        });
                        var S = window.ADMIN_STATE || { q: {} };
                        if (S.q.footer_saved !== undefined || S.flashKey === 'footerError' || S.q.tab === 'footer') {
                            var t = document.querySelector('button.nav-tab[data-target="pane-footer"]');
                            if (t) t.click();
                        }
                    })();
