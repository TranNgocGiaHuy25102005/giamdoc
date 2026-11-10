'use client';

import { useEffect } from 'react';
import { T } from '@/components/forms/ConsultationForm';

/**
 * Port script cuối trang van-chuyen-quoc-te.php:
 * - Nút CTA [data-scroll]: cuộn mượt xuống form báo giá rồi focus ô họ tên.
 * - Ô ngày bay: không chọn được ngày đã qua.
 * - Gửi form báo giá (JSON → /api/send-consultation), thông báo trong #q-msg.
 */
export function TransportBehavior() {
  useEffect(() => {
    const reduce = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const form = document.getElementById('quoteForm') as HTMLFormElement | null;
    const cleanups: Array<() => void> = [];
    const timers: number[] = [];

    /* ---- Nút CTA: cuộn mượt xuống form báo giá ---- */
    document.querySelectorAll<HTMLAnchorElement>('a[data-scroll]').forEach((a) => {
      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        const box = document.getElementById('bao-gia');
        if (!box) return;
        window.scrollTo({ top: box.getBoundingClientRect().top + window.pageYOffset - 90, behavior: reduce ? 'auto' : 'smooth' });
        timers.push(
          window.setTimeout(() => {
            const n = document.getElementById('q-name') as HTMLInputElement | null;
            if (n) n.focus({ preventScroll: true });
          }, reduce ? 0 : 600),
        );
      };
      a.addEventListener('click', onClick);
      cleanups.push(() => a.removeEventListener('click', onClick));
    });

    const dt = document.getElementById('q-date') as HTMLInputElement | null;
    if (dt) dt.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    /* ---- Gửi form (JSON → /api/send-consultation) ---- */
    const msg = document.getElementById('q-msg');
    const btn = document.getElementById('q-btn') as HTMLButtonElement | null;
    const show = (type: 'ok' | 'err', text: string) => {
      if (!msg) return;
      msg.className = 'vc-msg ' + type;
      msg.textContent = T(text);
    };

    if (form) {
      const onSubmit = (e: Event) => {
        e.preventDefault();
        const v = (id: string) => ((document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value || '').trim();
        const focus = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.focus();
        if (!v('q-name')) { show('err', 'Vui lòng nhập họ và tên.'); focus('q-name'); return; }
        if (!v('q-phone')) { show('err', 'Vui lòng nhập số điện thoại / Zalo / WhatsApp.'); focus('q-phone'); return; }
        const parts: string[] = [];
        if (v('q-from')) parts.push('Điểm khởi hành: ' + v('q-from'));
        if (v('q-to')) parts.push('Điểm đến: ' + v('q-to'));
        if (v('q-pet')) parts.push('Thú cưng: ' + v('q-pet'));
        if (v('q-date')) parts.push('Dự kiến bay: ' + v('q-date'));
        if (v('q-note')) parts.push('Ghi chú: ' + v('q-note'));
        if (btn) btn.disabled = true;
        if (msg) msg.className = 'vc-msg';
        let status = 0;
        fetch(form.getAttribute('data-api') || '/api/send-consultation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            csrf_token: v('csrf'), website: v('hp'),
            fullName: v('q-name'), phone: v('q-phone'),
            service: 'Vận chuyển đa quốc gia',
            message: '[YÊU CẦU BÁO GIÁ VẬN CHUYỂN]\n' + parts.join('\n'),
          }),
        })
          .then((r) => { status = r.status; return r.text(); })
          .then((t) => {
            let j: any = null;
            try { j = JSON.parse(t); } catch { /* không phải JSON (thường do lỗi máy chủ) */ }
            if (j && j.success) { show('ok', (j.message || 'Gửi yêu cầu thành công!') + (j.debug ? ' [debug: ' + j.debug + ']' : '')); form.reset(); }
            else if (j) show('err', (j.message || 'Chưa gửi được, vui lòng thử lại hoặc gọi hotline.') + (j.debug ? ' [debug: ' + j.debug + ']' : ''));
            else show('err', 'Máy chủ phản hồi lỗi. Vui lòng thử lại hoặc gọi hotline.' + ' (' + status + ')');
          })
          .catch(() => {
            show('err', 'Không kết nối được máy chủ. Vui lòng thử lại hoặc gọi hotline.');
          })
          .then(() => { if (btn) btn.disabled = false; });
      };
      form.addEventListener('submit', onSubmit);
      cleanups.push(() => form.removeEventListener('submit', onSubmit));
    }

    return () => {
      cleanups.forEach((f) => f());
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return null;
}
