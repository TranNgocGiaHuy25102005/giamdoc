'use client';

import { useEffect } from 'react';

export interface GalleryItem { kind: 'image' | 'video' | 'youtube'; url: string; thumb: string }

/**
 * Port script cuối mua-ban/chi-tiet/index.php: khung ảnh/video chính + ảnh nhỏ,
 * nút trước/sau, phím mũi tên trái/phải, vuốt trên điện thoại.
 */
export function PetGalleryBehavior({ items, alt }: { items: GalleryItem[]; alt: string }) {
  useEffect(() => {
    if (items.length < 2) return;
    const stage = document.getElementById('stage');
    const thumbs = document.getElementById('thumbs');
    const cnt = document.getElementById('cnt');
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');
    if (!stage || !thumbs || !cnt || !prev || !next) return;
    const btns = Array.prototype.slice.call(thumbs.querySelectorAll('.th')) as HTMLElement[];
    let cur = 0;
    const timers: number[] = [];

    const show = (i: number) => {
      cur = (i + items.length) % items.length;
      const it = items[cur];
      const old = stage.querySelector('img,video,iframe') as HTMLElement | null;
      let el: HTMLElement;
      if (it.kind === 'image') {
        const img = document.createElement('img');
        img.src = it.url;
        img.alt = alt;
        el = img;
      } else if (it.kind === 'video') {
        const vid = document.createElement('video');
        vid.src = it.url;
        vid.controls = true;
        vid.playsInline = true;
        vid.preload = 'metadata';
        el = vid;
      } else {
        const fr = document.createElement('iframe');
        fr.src = it.url;
        fr.title = 'Video';
        fr.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
        fr.allowFullscreen = true;
        el = fr;
      }
      el.style.opacity = '0';
      el.style.transition = 'opacity .35s';
      stage.insertBefore(el, stage.firstChild);
      requestAnimationFrame(() => {
        el.style.opacity = '1';
      });
      if (old) {
        old.style.transition = 'opacity .35s';
        old.style.opacity = '0';
        timers.push(window.setTimeout(() => {
          if (old.parentNode) old.parentNode.removeChild(old);
        }, 360));
      }
      btns.forEach((b, k) => b.classList.toggle('on', k === cur));
      cnt.textContent = cur + 1 + ' / ' + items.length;
      const b = btns[cur];
      if (b) {
        const left = b.offsetLeft - (thumbs.clientWidth - b.offsetWidth) / 2;
        thumbs.scrollTo({ left, behavior: 'smooth' });
      }
    };

    const onPrev = () => show(cur - 1);
    const onNext = () => show(cur + 1);
    const onThumb = (e: Event) => {
      const t = e.target as Element | null;
      const b = t && 'closest' in t ? (t.closest('.th') as HTMLElement | null) : null;
      if (b) show(parseInt(b.dataset.i ?? '0', 10));
    };
    const gal = stage.parentNode as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    };
    // vuốt trái/phải trên điện thoại
    let x0: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    };

    prev.addEventListener('click', onPrev);
    next.addEventListener('click', onNext);
    thumbs.addEventListener('click', onThumb);
    gal?.addEventListener('keydown', onKey);
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchend', onTouchEnd);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      prev.removeEventListener('click', onPrev);
      next.removeEventListener('click', onNext);
      thumbs.removeEventListener('click', onThumb);
      gal?.removeEventListener('keydown', onKey);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchend', onTouchEnd);
    };
  }, [items, alt]);
  return null;
}
