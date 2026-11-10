'use client';

import { useEffect } from 'react';
import { T } from '@/components/forms/ConsultationForm';

/**
 * Port <script> của ve-chunora.php: popup video (YouTube / MP4), số liệu chạy số khi cuộn tới,
 * cuộn mượt tới các neo trong trang. Markup do server render — ở đây chỉ gắn sự kiện.
 */
export function AboutBehavior() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const on = (t: EventTarget, ev: string, fn: EventListener) => {
      t.addEventListener(ev, fn);
      cleanups.push(() => t.removeEventListener(ev, fn));
    };
    const reduce = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Popup video (YouTube hoặc MP4/WebM); đóng bằng nút X, nền mờ hoặc phím ESC ---- */
    const modal = document.getElementById('abModal');
    const box = document.getElementById('abBox');
    if (modal && box) {
      let opener: HTMLElement | null = null;
      const openV = (btn: HTMLElement) => {
        opener = btn;
        const yt = modal.getAttribute('data-yt');
        const src = modal.getAttribute('data-src') ?? '';
        box.innerHTML = '';
        if (yt) {
          const f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&rel=0';
          f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
          f.allowFullscreen = true;
          f.title = T('Video giới thiệu');
          box.appendChild(f);
        } else {
          const v = document.createElement('video');
          v.src = src;
          v.controls = true;
          v.autoplay = true;
          v.playsInline = true;
          box.appendChild(v);
        }
        modal.classList.add('open');
        document.body.classList.add('ab-lock');
        (modal.querySelector('.ab-close') as HTMLElement | null)?.focus();
      };
      const closeV = () => {
        modal.classList.remove('open');
        document.body.classList.remove('ab-lock');
        box.innerHTML = '';
        if (opener) opener.focus();
      };
      document.querySelectorAll<HTMLElement>('[data-video]').forEach((b) => on(b, 'click', () => openV(b)));
      on(modal, 'click', (e) => {
        const t = e.target as Element | null;
        if (t === modal || t?.closest('.ab-close')) closeV();
      });
      on(document, 'keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Escape' && modal.classList.contains('open')) closeV();
      });
      cleanups.push(() => {
        document.body.classList.remove('ab-lock');
        box.innerHTML = '';
      });
    }

    /* ---- Số liệu chạy số khi cuộn tới ---- */
    const nums = document.querySelectorAll<HTMLElement>('[data-count]');
    const parse = (t: string | null) => {
      const m = /^(\D*?)(\d[\d.,]*)(.*)$/.exec(t ?? '');
      if (!m) return null;
      return { pre: m[1], n: parseInt(m[2].replace(/[.,]/g, ''), 10), suf: m[3] };
    };
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const fmt = (n: number) => n.toLocaleString('vi-VN');
    let alive = true;
    const run = (el: HTMLElement) => {
      const p = parse(el.getAttribute('data-count'));
      if (!p || isNaN(p.n)) return;
      if (reduce) return;
      let t0: number | null = null;
      const dur = 1500;
      const step = (ts: number) => {
        if (!alive) return;
        if (t0 === null) t0 = ts;
        const k = Math.min(1, (ts - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.innerHTML = esc(p.pre) + fmt(Math.round(p.n * e)) + '<span>' + esc(p.suf) + '</span>';
        if (k < 1) requestAnimationFrame(step);
      };
      el.innerHTML = esc(p.pre) + '0<span>' + esc(p.suf) + '</span>';
      requestAnimationFrame(step);
    };
    // kiểu hiển thị cuối cùng: phần hậu tố (+, %) màu cam
    nums.forEach((el) => {
      const p = parse(el.getAttribute('data-count'));
      if (p && !isNaN(p.n)) el.innerHTML = esc(p.pre) + fmt(p.n) + '<span>' + esc(p.suf) + '</span>';
    });
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(
        (en) => {
          en.forEach((x) => {
            if (x.isIntersecting) {
              run(x.target as HTMLElement);
              io.unobserve(x.target);
            }
          });
        },
        { threshold: 0.4 },
      );
      nums.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }
    cleanups.push(() => {
      alive = false;
    });

    /* ---- Cuộn mượt tới các neo trong trang ---- */
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
      const id = (a.getAttribute('href') ?? '').slice(1);
      if (!id) return;
      on(a, 'click', (e) => {
        const t = document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 70, behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
