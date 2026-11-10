'use client';

import { useEffect } from 'react';
import { T } from '@/components/forms/ConsultationForm';

/**
 * Port <script> cuối trang cham-soc-tai-store.php:
 * - chuyển tab bảng giá (bàn phím ← →)
 * - nút CTA "#dat-lich": cuộn mượt xuống form + chọn sẵn dịch vụ
 * - bấm thẻ Spa / Khách sạn → đổi ảnh tương ứng (bấm lần nữa để quay lại ảnh chính)
 * - min cho ô ngày giờ hẹn, gửi form JSON → /api/send-consultation
 * Markup do server render (đã dịch); ở đây chỉ gắn sự kiện.
 */
export function CareBehavior() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(type, fn as EventListener);
      cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };
    const timers: number[] = [];

    /* ---- Chuyển tab bảng giá (hỗ trợ bàn phím ← →) ---- */
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.cs-tab'));
    const selectTab = (t: HTMLButtonElement) => {
      tabs.forEach((b) => {
        const sel = b === t;
        b.setAttribute('aria-selected', sel ? 'true' : 'false');
        b.tabIndex = sel ? 0 : -1;
        const p = document.getElementById(b.getAttribute('aria-controls') || '');
        if (p) p.hidden = !sel;
      });
    };
    tabs.forEach((b, i) => {
      on(b, 'click', () => selectTab(b));
      on(b, 'keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        selectTab(n);
        n.focus();
      });
    });

    /* ---- Nút CTA: cuộn mượt xuống form và chọn sẵn dịch vụ ---- */
    const form = document.getElementById('careForm') as HTMLFormElement | null;
    const sel = document.getElementById('c-service') as HTMLSelectElement | null;
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    document.querySelectorAll<HTMLAnchorElement>('a[href="#dat-lich"]').forEach((a) => {
      on(a, 'click', (e) => {
        e.preventDefault();
        const want = a.getAttribute('data-service');
        if (want && sel) {
          for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === want || sel.options[i].value.indexOf(want.split(' ')[0]) === 0) {
              sel.selectedIndex = i;
              break;
            }
          }
        }
        const box = document.getElementById('dat-lich');
        if (!box) return;
        const top = box.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
        timers.push(
          window.setTimeout(() => {
            const n = document.getElementById('c-name');
            if (n) n.focus({ preventScroll: true });
          }, reduce ? 0 : 600),
        );
      });
    });

    /* ---- Bấm thẻ Spa / Khách sạn → đổi ảnh tương ứng (bấm lần nữa để quay lại ảnh chính) ---- */
    document.querySelectorAll<HTMLElement>('.cs-list[data-fig]').forEach((list) => {
      const fig = document.getElementById(list.getAttribute('data-fig') || '');
      if (!fig) return;
      let main = fig.querySelector<HTMLImageElement>('.cs-main');
      const ph = fig.querySelector<HTMLElement>('.cs-ph');
      const def = fig.getAttribute('data-default') || '';
      const defAlt = fig.getAttribute('data-alt') || '';
      const show = (src: string, alt: string) => {
        if (!src) {
          if (main) main.style.opacity = '0';
          if (ph) ph.hidden = false;
          return;
        }
        if (!main) {
          main = document.createElement('img');
          main.className = 'cs-main';
          fig.insertBefore(main, fig.firstChild);
        }
        const m = main;
        if (ph) ph.hidden = true;
        if (m.getAttribute('src') === src) {
          m.style.opacity = '1';
          return;
        }
        m.style.opacity = '0';
        const pre = new Image();
        pre.onload = () => {
          m.src = src;
          m.alt = alt;
          m.style.opacity = '1';
        };
        pre.onerror = () => {
          m.style.opacity = '1';
        };
        pre.src = src;
      };
      on(list, 'click', (e) => {
        const target = e.target as Element | null;
        const b = target && target.closest ? target.closest<HTMLButtonElement>('button.cs-item') : null;
        if (!b) return;
        const pressed = b.getAttribute('aria-pressed') === 'true';
        list.querySelectorAll('button.cs-item').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        if (pressed) {
          show(def, defAlt);
        } else {
          b.setAttribute('aria-pressed', 'true');
          show(b.getAttribute('data-img') || '', b.getAttribute('data-alt') || '');
          // trên điện thoại ảnh nằm phía trên: cuộn nhẹ để thấy ảnh vừa đổi
          const r = fig.getBoundingClientRect();
          if (r.bottom < 80 || r.top > window.innerHeight - 80) fig.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }
      });
    });

    const min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const dt = document.getElementById('c-date') as HTMLInputElement | null;
    if (dt) dt.min = min;

    /* ---- Gửi form (JSON → /api/send-consultation) ---- */
    const msg = document.getElementById('c-msg');
    const btn = document.getElementById('c-btn') as HTMLButtonElement | null;
    if (form && msg && btn) {
      const showMsg = (type: string, text: string) => {
        msg.className = 'cs-msg ' + type;
        msg.textContent = text ? T(text) : text;
      };
      const v = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value || '').trim();
      on(form, 'submit', (e) => {
        e.preventDefault();
        if (!v('c-name')) {
          showMsg('err', 'Vui lòng nhập họ và tên.');
          document.getElementById('c-name')?.focus();
          return;
        }
        if (!v('c-phone')) {
          showMsg('err', 'Vui lòng nhập số điện thoại / Zalo.');
          document.getElementById('c-phone')?.focus();
          return;
        }
        const parts = ['Dịch vụ: ' + v('c-service')];
        if (v('c-pet')) parts.push('Thú cưng: ' + v('c-pet'));
        if (v('c-date')) parts.push('Hẹn: ' + v('c-date').replace('T', ' '));
        if (v('c-note')) parts.push('Ghi chú: ' + v('c-note'));
        btn.disabled = true;
        showMsg('', '');
        msg.className = 'cs-msg';
        let status = 0;
        fetch(form.getAttribute('data-api') || '/api/send-consultation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            csrf_token: v('csrf'),
            website: v('hp'),
            fullName: v('c-name'),
            phone: v('c-phone'),
            service: 'Chăm sóc tại store',
            message: '[ĐẶT LỊCH CHĂM SÓC TẠI STORE]\n' + parts.join('\n'),
          }),
        })
          .then((r) => {
            status = r.status;
            return r.text();
          })
          .then((t) => {
            let j: { success?: boolean; message?: string; debug?: string } | null = null;
            try {
              j = JSON.parse(t);
            } catch {
              /* máy chủ trả về không phải JSON */
            }
            if (j && j.success) {
              showMsg('ok', (j.message || 'Gửi yêu cầu thành công!') + (j.debug ? ' [debug: ' + j.debug + ']' : ''));
              form.reset();
              if (sel) sel.selectedIndex = 0;
            } else if (j) {
              showMsg('err', (j.message || 'Chưa gửi được, vui lòng thử lại hoặc gọi hotline.') + (j.debug ? ' [debug: ' + j.debug + ']' : ''));
            } else {
              showMsg('err', 'Máy chủ phản hồi lỗi. Vui lòng thử lại hoặc gọi hotline.' + ' (' + status + ')');
            }
          })
          .catch(() => {
            showMsg('err', 'Không kết nối được máy chủ. Vui lòng thử lại hoặc gọi hotline.');
          })
          .then(() => {
            btn.disabled = false;
          });
      });
    }

    return () => {
      cleanups.forEach((f) => f());
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return null;
}
