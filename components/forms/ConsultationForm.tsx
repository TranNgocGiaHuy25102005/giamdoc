'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    CP_I18N?: Record<string, string>;
    CPT?: (s: string) => string;
  }
}
export const T = (s: string) => (typeof window !== 'undefined' && window.CP_I18N?.[s]) || s;

/** Toast thông báo (giống consultation-form.js) */
export function showToast(text: string, type: 'success' | 'error') {
  const el = document.createElement('div');
  el.textContent = T(text);
  el.setAttribute('role', 'alert');
  el.style.cssText =
    'position:fixed;top:20px;right:20px;left:20px;margin-left:auto;z-index:99999;max-width:340px;padding:14px 18px;' +
    'border-radius:10px;color:#fff;font:15px/1.4 Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);' +
    'background:' + (type === 'success' ? '#16a34a' : '#dc2626');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

const PHONE_REGEX = /^(?:0\d{9}|(?:\+|00)[1-9]\d{7,14})$/;
const PHONE_ERROR = 'Số điện thoại không hợp lệ. Số quốc tế cần bắt đầu bằng + và mã quốc gia (vd: +66912345678).';
const CHANNELS: Record<string, { label: string; placeholder: string }> = {
  Zalo: { label: 'Số Zalo hoặc link Zalo', placeholder: '0912 345 678 hoặc zalo.me/...' },
  Telegram: { label: 'Username hoặc link Telegram', placeholder: '@username hoặc t.me/username' },
  WhatsApp: { label: 'Số WhatsApp (kèm mã quốc gia)', placeholder: '+66 912 345 678 hoặc wa.me/...' },
  Facebook: { label: 'Link Facebook của bạn', placeholder: 'facebook.com/ten-cua-ban' },
  Instagram: { label: 'Username hoặc link Instagram', placeholder: '@username hoặc instagram.com/...' },
};

/**
 * Port assets/consultation-form.js — gửi form "Đăng ký tư vấn" bằng fetch, không tải lại trang.
 * Form được server render (đã dịch); nếu JS tắt, form vẫn POST thường về /contact.php.
 */
export function ConsultationForm({ formId = 'tu-van' }: { formId?: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const api = form.getAttribute('data-api') || '/api/send-consultation';
    const sel = document.getElementById('kenh-tu-van') as HTMLSelectElement | null;
    const wrap = document.getElementById('kenh-lien-he-wrap');
    const label = document.getElementById('kenh-lien-he-label');
    const input = document.getElementById('kenh-lien-he') as HTMLInputElement | null;

    const update = () => {
      if (!sel || !wrap || !input || !label) return;
      const cfg = CHANNELS[sel.value];
      if (cfg) {
        label.textContent = T(cfg.label);
        input.placeholder = T(cfg.placeholder);
        input.required = true;
        wrap.style.display = 'flex';
      } else {
        input.required = false;
        input.value = '';
        wrap.style.display = 'none';
      }
    };
    const onChange = () => {
      update();
      if (sel && CHANNELS[sel.value]) input?.focus();
    };
    const onReset = () => setTimeout(update, 0);
    sel?.addEventListener('change', onChange);
    form.addEventListener('reset', onReset);
    update();

    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const defaultText = btn?.textContent ?? '';
    const val = (n: string) => ((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? '');

    const onSubmit = async (e: Event) => {
      e.preventDefault();
      if (!btn || btn.disabled) return;
      const payload = {
        fullName: val('ho_ten').trim(),
        phone: val('so_dien_thoai').trim(),
        service: val('dich_vu'),
        message: val('loi_nhan').trim(),
        channel: val('kenh_tu_van'),
        channelContact: val('kenh_lien_he').trim(),
        website: val('website'),
        csrf_token: val('csrf_token'),
      };
      let error = '';
      const phone = payload.phone.replace(/[\s.\-()]/g, '');
      if (!payload.fullName) error = 'Vui lòng nhập họ và tên.';
      else if (!phone) error = 'Vui lòng nhập số điện thoại.';
      else if (!PHONE_REGEX.test(phone)) error = PHONE_ERROR;
      else if (payload.channel && !payload.channelContact) error = T('Vui lòng nhập link hoặc số điện thoại ' + payload.channel + ' của bạn.');
      if (error) {
        showToast(error, 'error');
        return;
      }
      btn.disabled = true;
      btn.textContent = T('Đang gửi...');
      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });
        let result: any = null;
        try { result = await res.json(); } catch {}
        if (res.ok && result?.success) {
          form.reset();
          showToast((result.message || 'Gửi yêu cầu thành công!') + (result.debug ? ' [debug: ' + result.debug + ']' : ''), 'success');
        } else {
          showToast((result?.message || 'Gửi thất bại. Vui lòng thử lại.' + ' (' + res.status + ')') + (result?.debug ? ' [debug: ' + result.debug + ']' : ''), 'error');
        }
      } catch {
        showToast('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = defaultText;
      }
    };
    form.addEventListener('submit', onSubmit);
    return () => {
      sel?.removeEventListener('change', onChange);
      form.removeEventListener('reset', onReset);
      form.removeEventListener('submit', onSubmit);
    };
  }, [formId]);
  return null;
}
