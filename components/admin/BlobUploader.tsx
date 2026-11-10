'use client';

import { useEffect } from 'react';
import { upload } from '@vercel/blob/client';

/**
 * Chỉ dùng khi chạy trên Vercel (có Vercel Blob): trước khi gửi form admin, tải các tệp đã chọn
 * thẳng lên Blob (thư mục tmp/), rồi gửi form kèm đường dẫn thay cho nội dung tệp.
 * Máy chủ tải lại tệp từ Blob, chuyển WebP… như bình thường (xem app/admin/action/route.ts).
 */
export function BlobUploader() {
  useEffect(() => {
    const onSubmit = async (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!(form instanceof HTMLFormElement) || !form.action.includes('/admin/action')) return;
      const inputs = Array.from(form.elements).filter(
        (el): el is HTMLInputElement => el instanceof HTMLInputElement && el.type === 'file' && !el.disabled && !!el.files?.length,
      );
      if (!inputs.length) return;
      e.preventDefault();
      e.stopPropagation();
      const submitter = (e.submitter as HTMLElement | null) ?? null;
      const btn = submitter instanceof HTMLButtonElement ? submitter : (form.querySelector('[type="submit"]') as HTMLButtonElement | null);
      const label = btn?.innerHTML;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang tải tệp lên...';
      }
      try {
        for (const input of inputs) {
          for (const file of Array.from(input.files ?? [])) {
            const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80) || 'file';
            const blob = await upload('tmp/' + safe, file, {
              access: 'public',
              handleUploadUrl: '/api/blob-upload',
              multipart: file.size > 5 * 1024 * 1024,
              contentType: file.type || undefined,
            });
            const h = document.createElement('input');
            h.type = 'hidden';
            h.name = '__blob__' + input.name;
            h.value = blob.url;
            if (form.id) {
              h.setAttribute('form', form.id);
              document.body.appendChild(h);
            } else form.appendChild(h);
          }
          input.disabled = true; // không gửi nội dung tệp nữa
        }
      } catch (err) {
        alert('Tải tệp lên thất bại: ' + (err as Error).message);
        inputs.forEach((i) => (i.disabled = false));
        if (btn) {
          btn.disabled = false;
          if (label !== undefined) btn.innerHTML = label;
        }
        return;
      }
      if (btn) {
        btn.disabled = false;
        if (label !== undefined) btn.innerHTML = label;
      }
      if (submitter && (submitter as HTMLButtonElement).form === form) form.requestSubmit(submitter as HTMLButtonElement);
      else form.requestSubmit();
    };
    const handler = (e: Event) => void onSubmit(e as SubmitEvent);
    document.addEventListener('submit', handler, true);
    return () => document.removeEventListener('submit', handler, true);
  }, []);
  return null;
}
