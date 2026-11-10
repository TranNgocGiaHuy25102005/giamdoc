/* admin.js — port các <script> chung cuối trang admin/index.php (nạp sau khi trang hiển thị) */
(function () {
// thông báo lỗi chỉ hiện 1 lần
document.cookie = 'cp_admin_flash=; Max-Age=0; path=/';
var MAX_IMAGE = (window.ADMIN_STATE && window.ADMIN_STATE.maxImage) || 5 * 1024 * 1024;
// Điện thoại: bấm 1 mục menu thì tự cuộn xuống phần nội dung tương ứng
document.addEventListener('click', function (e) {
    var t = e.target.closest('button.nav-tab');
    if (!t || window.innerWidth > 960) return;
    setTimeout(function () {
        var id = t.dataset.target === 'all' ? null : document.getElementById(t.dataset.target);
        var el = id || document.querySelector('.wrap .panel');
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    }, 60);
});
// 1. Xử lý thêm / xóa mục trong danh sách (Repeater)
document.addEventListener('click', function (event) {
    const addButton = event.target.closest('.add-item');
    if (addButton) {
        const repeater = addButton.closest('.repeater');
        const template = repeater.querySelector('.repeat-template');
        const index = repeater.dataset.nextIndex;
        const content = template.innerHTML.replaceAll('__INDEX__', index);
        repeater.querySelector('.repeat-items').insertAdjacentHTML('beforeend', content);
        repeater.dataset.nextIndex = String(Number(index) + 1);
        return;
    }

    const removeButton = event.target.closest('.remove-item');
    if (removeButton) {
        if (confirm('Bạn có chắc muốn xóa mục này?')) {
            removeButton.closest('.repeat-item').remove();
        }
        return;
    }

    // 2. Chuyển đổi Tab Sidebar
    const navTab = event.target.closest('button.nav-tab');
    if (navTab) {
        const target = navTab.dataset.target;
        document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
        navTab.classList.add('active');

        const panes = document.querySelectorAll('.section-pane');
        if (target === 'all') {
            panes.forEach(pane => pane.classList.add('active'));
        } else {
            panes.forEach(pane => {
                pane.classList.toggle('active', pane.id === target);
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});

// 3. Xem trước ảnh ngay khi chọn file mới
document.addEventListener('change', function (event) {
    if (event.target.matches('.file-input')) {
        const file = event.target.files[0];
        const uploader = event.target.closest('.image-uploader');
        if (!uploader || !file) return;

        const errorMessage = uploader.querySelector('.upload-error');
        const labelText = uploader.querySelector('.file-label-text');
        if (file.size > MAX_IMAGE) {
            event.target.value = '';
            errorMessage.textContent = 'Ảnh vượt quá giới hạn 5 MB. Vui lòng chọn ảnh có dung lượng nhỏ hơn.';
            errorMessage.hidden = false;
            if (labelText) labelText.textContent = 'Tải ảnh mới lên';
            return;
        }
        errorMessage.textContent = '';
        errorMessage.hidden = true;

        const previewBox = uploader.querySelector('.image-preview-box');
        if (labelText) {
            labelText.textContent = file.name.length > 22 ? file.name.slice(0, 19) + '...' : file.name;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            previewBox.classList.remove('is-empty');
            previewBox.innerHTML = '<img src="' + e.target.result + '" alt="Preview" class="img-preview">';
        };
        reader.readAsDataURL(file);
    }
});

// 4. Nút hiện/ẩn mật khẩu ở trang Login
const togglePwd = document.getElementById('togglePwd');
if (togglePwd) {
    togglePwd.addEventListener('click', function () {
        const pwdInput = document.getElementById('login_password');
        pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    });
}

// 5. Hiệu ứng đang lưu khi Submit
const adminForm = document.getElementById('adminForm');
if (adminForm) {
    adminForm.addEventListener('submit', function (event) {
        const oversizedInput = Array.from(adminForm.querySelectorAll('.file-input'))
            .find(input => input.files[0]?.size > MAX_IMAGE);
        if (oversizedInput) {
            event.preventDefault();
            const uploader = oversizedInput.closest('.image-uploader');
            const errorMessage = uploader.querySelector('.upload-error');
            errorMessage.textContent = 'Ảnh vượt quá giới hạn 5 MB. Vui lòng chọn ảnh có dung lượng nhỏ hơn.';
            errorMessage.hidden = false;
            oversizedInput.focus();
            return;
        }

        const btn = document.getElementById('submitBtn');
        if (btn) {
            btn.disabled = true;
            btn.querySelector('span').textContent = 'Đang lưu dữ liệu...';
        }
    });
}
})();
