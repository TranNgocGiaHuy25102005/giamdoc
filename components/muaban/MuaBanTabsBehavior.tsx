'use client';

import { useEffect } from 'react';

/** Port script cuối mua-ban/index.php: tab Mua chó / Mua mèo trượt ngang, viên "pill", chiều cao khung, #meo. */
export function MuaBanTabsBehavior() {
  useEffect(() => {
    const root = document.documentElement;
    const order = ['cho', 'meo'] as const;
    type Key = (typeof order)[number];
    const tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]')) as HTMLElement[];
    const panelCho = document.getElementById('panel-cho');
    const panelMeo = document.getElementById('panel-meo');
    const track = document.getElementById('track');
    const viewport = document.getElementById('viewport');
    const pill = document.getElementById('pill');
    if (!panelCho || !panelMeo || !track || !viewport || !pill) return;
    const panels: Record<Key, HTMLElement> = { cho: panelCho, meo: panelMeo };
    let current: Key = 'cho';
    const isKey = (k: string | null): k is Key => k === 'cho' || k === 'meo';

    const movePill = () => {
      const btn = document.getElementById('tab-' + current);
      if (!btn) return;
      pill.style.width = btn.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    };
    const setHeight = () => {
      viewport.style.height = panels[current].offsetHeight + 'px';
    };
    const show = (key: Key) => {
      current = key;
      track.style.transform = 'translateX(' + -order.indexOf(key) * 100 + '%)';
      tabs.forEach((t) => {
        t.setAttribute('aria-selected', t.getAttribute('data-tab') === key ? 'true' : 'false');
      });
      order.forEach((k) => {
        const on = k === key;
        panels[k].classList.toggle('on', on);
        panels[k].setAttribute('aria-hidden', on ? 'false' : 'true');
        if ('inert' in panels[k]) panels[k].inert = !on;
      });
      movePill();
      setHeight();
    };

    const cleanups: (() => void)[] = [];
    tabs.forEach((t) => {
      const onClick = () => {
        const key = t.getAttribute('data-tab');
        if (!isKey(key) || key === current) return;
        show(key);
        try {
          history.replaceState(history.state, '', '#' + key);
        } catch {}
      };
      // phím mũi tên trái / phải để đổi tab
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const next = order[(order.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length];
          show(next);
          document.getElementById('tab-' + next)?.focus();
        }
      };
      t.addEventListener('click', onClick);
      t.addEventListener('keydown', onKey);
      cleanups.push(() => {
        t.removeEventListener('click', onClick);
        t.removeEventListener('keydown', onKey);
      });
    });

    // Bố cục ban đầu không chạy hiệu ứng; mở thẳng tab mèo bằng /mua-ban#meo
    root.classList.add('no-anim');
    const h = (location.hash || '').replace('#', '');
    show(h === 'meo' ? 'meo' : 'cho');
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => root.classList.remove('no-anim'));
    });

    // Cập nhật chiều cao khi ảnh tải xong hoặc đổi cỡ màn hình
    const relayout = () => {
      movePill();
      setHeight();
    };
    window.addEventListener('resize', relayout);
    window.addEventListener('load', relayout);
    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => setHeight());
      order.forEach((k) => ro?.observe(panels[k]));
    }
    let alive = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (alive) relayout(); });

    return () => {
      alive = false;
      cleanups.forEach((f) => f());
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      root.classList.remove('no-anim');
      window.removeEventListener('resize', relayout);
      window.removeEventListener('load', relayout);
      ro?.disconnect();
    };
  }, []);
  return null;
}
