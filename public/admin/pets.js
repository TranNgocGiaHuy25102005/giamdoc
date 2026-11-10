/* pets.js — tab Mua bán chó mèo (port script trong admin/index.php, pane-muaban) */
(function () {
  var list = document.getElementById('petList'), tpl = document.getElementById('petTpl'), form = document.getElementById('petForm');
  if (!list || !tpl) return;
  var filter = 'all', seq = 0, mseq = 0, MAX_IMG = 5 * 1024 * 1024, MAX_VID = 100 * 1024 * 1024;
  function cards() { return Array.prototype.slice.call(list.querySelectorAll('.pet-card')); }
  function refresh() {
    var c = {cho: 0, meo: 0}, i = 0;
    cards().forEach(function (el) {
      var t = el.querySelector('.sel-type').value; el.dataset.type = t; c[t]++;
      el.querySelector('.pc-num').textContent = '#' + (++i);
      el.querySelector('.pc-name').textContent = el.querySelector('.in-name').value;
      var b = el.querySelector('.pc-type'); b.textContent = t === 'meo' ? 'Mèo' : 'Chó'; b.className = 'pc-type pc-type-' + t;
      el.querySelector('.cnt-media').textContent = el.querySelectorAll('.mrow').length;
      el.classList.toggle('hide', filter !== 'all' && filter !== t);
    });
    document.getElementById('petCAll').textContent = c.cho + c.meo;
    document.getElementById('petCCho').textContent = c.cho;
    document.getElementById('petCMeo').textContent = c.meo;
    document.getElementById('petEmpty').hidden = (c.cho + c.meo) > 0;
  }
  function slugify(t) {
    var s = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  }
  function addMediaRow(card) {
    var t = card.querySelector('.mtpl');
    card.querySelector('.mlist').insertAdjacentHTML('beforeend', t.innerHTML.split('__K__').join('n' + (++mseq)));
    refresh();
    return card.querySelector('.mlist').lastElementChild;
  }
  function checkSize(file, err) {
    var isVid = /^video\//.test(file.type) || /\.(mp4|mov|avi|mkv|wmv|webm|3gp|m4v|flv|mpe?g)$/i.test(file.name), max = isVid ? MAX_VID : MAX_IMG;
    if (file.size > max) { err.textContent = isVid ? 'Video vượt quá 100 MB — hãy đăng YouTube rồi dán link.' : 'Ảnh vượt quá 5 MB.'; err.hidden = false; return false; }
    err.hidden = true; return true;
  }
  function previewInto(box, file) {
    if (/^image\//.test(file.type)) {
      var r = new FileReader();
      r.onload = function (ev) { box.innerHTML = '<img alt="">'; box.firstChild.src = ev.target.result; };
      r.readAsDataURL(file);
    } else { box.textContent = '▶ ' + file.name.slice(0, 14); }
  }

  document.getElementById('petFilters').addEventListener('click', function (e) {
    var b = e.target.closest('.flt'); if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll('#petFilters .flt').forEach(function (x) { x.classList.toggle('on', x === b); });
    refresh();
  });
  document.getElementById('petAddBtn').addEventListener('click', function () {
    list.insertAdjacentHTML('beforeend', tpl.innerHTML.split('__I__').join('n' + (++seq)));
    var el = list.lastElementChild;
    if (filter !== 'all') el.querySelector('.sel-type').value = filter;
    refresh();
    el.scrollIntoView({behavior: 'smooth', block: 'center'});
    el.querySelector('input[name$="[breed]"]').focus({preventScroll: true});
  });

  list.addEventListener('click', function (e) {
    var card = e.target.closest('.pet-card'); if (!card) return;
    var row = e.target.closest('.mrow');
    if (e.target.closest('.madd')) { addMediaRow(card).querySelector('.msrc').focus(); return; }
    if (row) {
      if (e.target.closest('.mdel')) { row.remove(); refresh(); }
      else if (e.target.closest('.mup') && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
      else if (e.target.closest('.mdown') && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
      return;
    }
    if (e.target.closest('.del')) { if (confirm('Xóa thẻ pet này?')) { card.remove(); refresh(); } }
    else if (e.target.closest('.up')) { var p = card.previousElementSibling; while (p && p.classList.contains('hide')) p = p.previousElementSibling; if (p) { list.insertBefore(card, p); refresh(); } }
    else if (e.target.closest('.down')) { var n = card.nextElementSibling; while (n && n.classList.contains('hide')) n = n.nextElementSibling; if (n) { list.insertBefore(n, card); refresh(); } }
  });

  list.addEventListener('input', function (e) {
    var card = e.target.closest('.pet-card'); if (!card) return;
    if (e.target.matches('.in-name')) { card.querySelector('.pc-name').textContent = e.target.value; }
    if (e.target.matches('input[name$="[name]"], input[name$="[slug]"]')) {
      var sl = card.querySelector('input[name$="[slug]"]').value || slugify(card.querySelector('.in-name').value);
      card.querySelector('.slug-show').textContent = sl || '…';
    }
  });

  list.addEventListener('change', function (e) {
    var card = e.target.closest('.pet-card');
    if (e.target.matches('.sel-type')) { refresh(); return; }
    if (e.target.matches('.file')) {
      var f = e.target.files[0], err = card.querySelector('.pc-img .err'), prev = card.querySelector('.pc-prev');
      if (!f) return;
      if (!checkSize(f, err) || !/^image\//.test(f.type)) { e.target.value = ''; if (/^image\//.test(f.type) === false) { err.textContent = 'Ảnh thẻ chỉ nhận file ảnh.'; err.hidden = false; } return; }
      prev.classList.remove('empty'); previewInto(prev, f);
    } else if (e.target.matches('.mfile')) {
      var row = e.target.closest('.mrow'), mf = e.target.files[0], merr = row.querySelector('.err');
      if (!mf) return;
      if (!checkSize(mf, merr)) { e.target.value = ''; return; }
      row.querySelector('.msrc').value = '';
      previewInto(row.querySelector('.mth'), mf);
    } else if (e.target.matches('.mmulti')) {
      var files = Array.prototype.slice.call(e.target.files);
      if (!window.DataTransfer) { alert('Trình duyệt chưa hỗ trợ chọn nhiều tệp. Hãy dùng nút “Thêm” từng mục.'); e.target.value = ''; return; }
      files.forEach(function (file) {
        var r = addMediaRow(card), err = r.querySelector('.err');
        if (!checkSize(file, err)) return;
        var dt = new DataTransfer(); dt.items.add(file);
        r.querySelector('.mfile').files = dt.files;
        previewInto(r.querySelector('.mth'), file);
      });
      e.target.value = '';
    }
  });

  if (form) form.addEventListener('submit', function () {
    // bỏ các dòng ảnh/video trống để khỏi gửi dữ liệu thừa
    list.querySelectorAll('.mrow').forEach(function (r) {
      if (!r.querySelector('.msrc').value.trim() && !r.querySelector('.mfile').files.length) r.remove();
    });
    var b = document.getElementById('petSaveBtn'); b.disabled = true; b.textContent = 'Đang lưu...';
  });
  refresh();
  var S = window.ADMIN_STATE || { q: {} };
  if (S.q.pets_saved !== undefined || S.flashKey === 'petsError' || S.q.tab === 'muaban') {
    var t = document.querySelector('button.nav-tab[data-target="pane-muaban"]');
    if (t) t.click();
  }
})();
