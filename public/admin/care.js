/* care.js — tab Quản lý Chăm Sóc Store (port script trong admin/index.php) */
(function () {
  var pane = document.getElementById('pane-care'), seq = 1000;
  if (!pane) return;
  function tplHtml(key, k) {
    var t = pane.querySelector('template[data-tpl="' + key + '"]');
    return t ? t.innerHTML.replace(/__I__/g, 'n' + k).replace(/__K__/g, 'n' + k) : '';
  }
  function addRow(key) {
    var list = pane.querySelector('.cr-list[data-list="' + key + '"]');
    var box = document.createElement('div'); box.innerHTML = tplHtml(key, ++seq).trim();
    var row = box.firstElementChild; list.appendChild(row); return row;
  }
  pane.addEventListener('click', function (e) {
    var add = e.target.closest('.cr-add[data-add]');
    if (add) { var r = addRow(add.getAttribute('data-add')); var i = r.querySelector('input.cr-in'); if (i) i.focus(); return; }
    var row = e.target.closest('.cr-row'); if (!row) return;
    if (e.target.closest('.cr-del')) row.remove();
    else if (e.target.closest('.cr-up') && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
    else if (e.target.closest('.cr-down') && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
  });
  function preview(file, box) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    box.innerHTML = '<img alt="" src="' + url + '">';
  }
  pane.addEventListener('change', function (e) {
    var f = e.target;
    if (f.matches('.cr-single, .cr-gfile') && f.files[0]) {
      if (f.files[0].size > 5 * 1024 * 1024) { alert('Ảnh vượt quá 5 MB, hãy chọn ảnh nhẹ hơn.'); f.value = ''; return; }
      preview(f.files[0], f.closest('.cr-row, .cr-img').querySelector('.cr-thumb'));
    }
  });
  // Tải nhiều ảnh: mỗi ảnh thành 1 dòng riêng (gán file vào ô của dòng đó)
  var multi = document.getElementById('crGalMulti');
  if (multi) multi.addEventListener('change', function () {
    Array.prototype.slice.call(multi.files).forEach(function (file) {
      if (file.size > 5 * 1024 * 1024) return;
      var row = addRow('care[gallery][images]'), inp = row.querySelector('.cr-gfile');
      try { var dt = new DataTransfer(); dt.items.add(file); inp.files = dt.files; preview(file, row.querySelector('.cr-thumb')); } catch (err) {}
    });
    multi.value = '';
  });
  var cf = document.getElementById('careForm');
  if (cf) cf.addEventListener('submit', function () {
    var b = document.getElementById('careSaveBtn'); if (b) { b.disabled = true; b.textContent = 'Đang lưu...'; }
  });
  var S = window.ADMIN_STATE || { q: {} };
  if (S.q.care_saved !== undefined || S.flashKey === 'careError' || ['care_service', 'care'].indexOf(S.q.tab) !== -1) {
    var t = document.querySelector('button.nav-tab[data-target="pane-care"]'); if (t) t.click();
  }
})();
