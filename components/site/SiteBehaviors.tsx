'use client';

import { useEffect } from 'react';

/**
 * Hành vi giao diện dùng chung (port nguyên các <script> vanilla JS của template.html, footer.php,
 * i18n.php và assets/nav-slide.js). Markup do server render (đã dịch sẵn) — ở đây chỉ gắn sự kiện.
 */
export function SiteBehaviors() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const on = (t: EventTarget, ev: string, fn: EventListener, opt?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn, opt);
      cleanups.push(() => t.removeEventListener(ev, fn, opt));
    };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    /* ---- Menu điện thoại (drawer) ---- */
    const drawer = document.getElementById('sn-drawer');
    const backdrop = document.getElementById('sn-backdrop');
    const openBtn = document.getElementById('sn-open');
    const closeBtn = document.getElementById('sn-close');
    if (drawer && openBtn && backdrop && closeBtn) {
      let isOpen = false;
      const setOpen = (open: boolean) => {
        if (open === isOpen) return;
        isOpen = open;
        drawer.classList.toggle('is-open', open);
        backdrop.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('overflow-hidden', open);
        (open ? closeBtn : openBtn).focus({ preventScroll: true });
      };
      on(openBtn, 'click', () => setOpen(true));
      on(closeBtn, 'click', () => setOpen(false));
      on(backdrop, 'click', () => setOpen(false));
      on(document, 'keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape' && isOpen) setOpen(false); });
      on(drawer, 'click', (e) => { if ((e.target as Element).closest('a')) setOpen(false); });
      const mq = window.matchMedia('(min-width: 1100px)');
      const mqFn = (m: MediaQueryListEvent) => { if (m.matches) setOpen(false); };
      mq.addEventListener?.('change', mqFn);
      cleanups.push(() => { mq.removeEventListener?.('change', mqFn); document.body.classList.remove('overflow-hidden'); });
    }

    /* ---- Nút lên đầu trang ---- */
    const top = document.getElementById('sn-totop');
    if (top) {
      const t = () => top.classList.toggle('is-show', (window.pageYOffset || document.documentElement.scrollTop) > 400);
      on(window, 'scroll', t, { passive: true });
      t();
      on(top, 'click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    }

    /* ---- Bảng chọn quốc gia ---- */
    const p = document.getElementById('cp-cpop');
    const b = document.getElementById('cp-cbtn');
    const bm = document.getElementById('cp-cbtn-m');
    if (p) {
      const pos = (a: HTMLElement) => {
        const r = a.getBoundingClientRect();
        const w = Math.min(420, window.innerWidth - 16);
        p.style.width = w + 'px';
        p.style.left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8) + 'px';
        p.style.top = r.bottom + 8 + 'px';
      };
      const close = () => {
        p.hidden = true;
        [b, bm].forEach((x) => x?.setAttribute('aria-expanded', 'false'));
      };
      const tog = (a: HTMLElement) => (e: Event) => {
        e.stopPropagation();
        if (p.hidden) { pos(a); p.hidden = false; a.setAttribute('aria-expanded', 'true'); } else close();
      };
      if (b) on(b, 'click', tog(b));
      if (bm) on(bm, 'click', tog(bm));
      on(document, 'click', (e) => { if (!p.hidden && !p.contains(e.target as Node)) close(); });
      on(document, 'keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') close(); });
      on(window, 'resize', close);
      on(window, 'scroll', () => { if (!p.hidden) close(); }, { passive: true });
    }

    /* ---- Lời chào quốc tế: ẩn trong phiên ---- */
    const greet = document.getElementById('cp-greet');
    if (greet) {
      try { if (sessionStorage.getItem('cpg') === '1') greet.style.display = 'none'; } catch {}
      const x = greet.querySelector('[data-greet-close]');
      if (x) on(x, 'click', () => { try { sessionStorage.setItem('cpg', '1'); } catch {} greet.style.display = 'none'; });
    }

    /* ---- Footer: accordion trên điện thoại ---- */
    document.querySelectorAll<HTMLElement>('.ft-acc-h').forEach((h) => {
      on(h, 'click', () => {
        if (window.matchMedia('(min-width: 821px)').matches) return; // desktop: luôn mở
        const open = h.getAttribute('aria-expanded') !== 'true';
        h.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.getElementById(h.getAttribute('aria-controls') || '')?.classList.toggle('is-open', open);
      });
    });

    /* ---- Thanh gạch cam trượt ở menu chính (nav-slide.js) ---- */
    const holder = document.querySelector<HTMLElement>('header nav div > div');
    if (holder) {
      const links = Array.from(holder.querySelectorAll<HTMLAnchorElement>('a'));
      if (links.length) {
        const active = links.find((a) => a.hasAttribute('aria-current')) || links[0];
        links.forEach((a) => (a.style.borderBottom = '0'));
        holder.style.position = 'relative';
        const bar = document.createElement('span');
        bar.setAttribute('aria-hidden', 'true');
        bar.style.cssText = 'position:absolute;left:0;top:0;height:3px;width:0;background:#FF9F43;border-radius:2px;pointer-events:none;opacity:0;' +
          'transition:transform .45s cubic-bezier(.22,.8,.2,1),width .45s cubic-bezier(.22,.8,.2,1),opacity .2s';
        holder.appendChild(bar);
        cleanups.push(() => bar.remove());
        const place = (a: HTMLElement, animate: boolean) => {
          if (!animate || reduce) bar.style.transition = 'none';
          bar.style.width = a.offsetWidth + 'px';
          bar.style.transform = 'translate(' + a.offsetLeft + 'px,' + (a.offsetTop + a.offsetHeight - 3) + 'px)';
          bar.style.opacity = '1';
          if (!animate) { void bar.offsetWidth; bar.style.transition = ''; }
        };
        const idx = links.indexOf(active);
        let prev = -1;
        try {
          const s = sessionStorage.getItem('nav-idx');
          if (s !== null) prev = parseInt(s, 10);
          sessionStorage.setItem('nav-idx', String(idx));
        } catch {}
        const init = () => {
          if (prev >= 0 && prev < links.length && prev !== idx && !reduce) {
            place(links[prev], false);
            requestAnimationFrame(() => requestAnimationFrame(() => place(active, true)));
          } else place(active, false);
        };
        if (document.fonts?.ready) document.fonts.ready.then(init); else init();
        links.forEach((a) => {
          on(a, 'mouseenter', () => place(a, true));
          on(a, 'focus', () => place(a, true));
          on(a, 'blur', () => place(active, true));
        });
        on(holder, 'mouseleave', () => place(active, true));
        on(window, 'resize', () => place(active, false));
      }
    }

    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
