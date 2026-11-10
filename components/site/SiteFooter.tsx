import type { JSX } from 'react';
import { footerLoad, FOOTER_NETWORKS } from '@/lib/stores/footer';
import { siteHref } from '@/lib/links';

const A = { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true as const, focusable: 'false' as const };
const ICONS: Record<string, JSX.Element> = {
  facebook: <svg {...A} fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21z" /></svg>,
  instagram: <svg {...A} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" /></svg>,
  tiktok: <svg {...A} fill="currentColor"><path d="M16.6 3c.3 2.2 1.6 3.6 3.8 3.8v3a7 7 0 0 1-3.8-1.2v6.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.1a2.7 2.7 0 1 0 1.8 2.5V3z" /></svg>,
  whatsapp: <svg {...A} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 8 19.3z" /><path d="M9 8.8c.2 2.2 2.6 4.6 4.8 5l1.2-1.2-1.8-1-.8.7c-.8-.3-1.5-1-1.9-1.9l.7-.8-1-1.8z" fill="currentColor" stroke="none" /></svg>,
  telegram: <svg {...A} fill="currentColor"><path d="M21.5 3.4 2.6 10.6c-.8.3-.8 1.4 0 1.6l4.8 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.7-2.5 4.9 3.6c.6.4 1.4.1 1.6-.6L22.9 4.7c.2-.8-.6-1.6-1.4-1.3zM9 13.1l9.1-5.7-7 6.8-.3 3.3z" /></svg>,
  zalo: <svg {...A} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><text x="12" y="15.6" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8.2" fontWeight="700" fill="currentColor" stroke="none">Zalo</text></svg>,
  phone: <svg {...A} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  pin: <svg {...A} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  globe: <svg {...A} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>,
  plane: <svg {...A} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>,
  chip: <svg {...A} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></svg>,
  chev: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>,
};

/** Footer website (port footer_render() của footer.php) — cấu hình trong Admin → "Cấu hình Footer" */
export async function SiteFooter() {
  const f = await footerLoad();
  const b = f.brand;
  const c = f.contact;
  const tel = c.hotline.replace(/[^0-9+]/g, '');
  const ext = (h: string) => (/^https?:\/\//i.test(h) ? { target: '_blank', rel: 'noopener' } : {});
  const mapsHref = siteHref(c.maps_url);
  const site = c.website.trim();
  const siteUrl = site === '' ? '' : /^https?:\/\//i.test(site) ? site : 'https://' + site;
  const social = Object.entries(FOOTER_NETWORKS).filter(([k]) => f.social[k].enabled && f.social[k].url !== '' && f.social[k].url !== '#');
  return (
    <footer className="ft" aria-label="Chân trang">
      <div className="ft-in">
        <div className="ft-grid">
          <div className="ft-brand">
            <span className="ft-brand-name">{b.name}</span>
            {b.slogan !== '' && <p className="ft-slogan">{b.slogan}</p>}
            {(b.show_iata || b.show_microchip) && (
              <div className="ft-badges">
                {b.show_iata && <span className="ft-badge">{ICONS.plane}IATA</span>}
                {b.show_microchip && <span className="ft-badge">{ICONS.chip}Microchip</span>}
              </div>
            )}
            {social.length > 0 && (
              <div className="ft-socials">
                {social.map(([k, label]) => (
                  <a key={k} className="ft-soc" href={siteHref(f.social[k].url)} target="_blank" rel="noopener" aria-label={label} title={label}>{ICONS[k]}</a>
                ))}
              </div>
            )}
          </div>
          {(['services', 'policies'] as const).map((key) => {
            const id = key === 'services' ? 'sv' : 'po';
            const col = f[key];
            return (
              <div className="ft-col ft-acc" key={key}>
                <button type="button" className="ft-acc-h" aria-expanded="false" aria-controls={'ft-' + id}><span>{col.title}</span>{ICONS.chev}</button>
                <div className="ft-acc-b" id={'ft-' + id}>
                  <div className="ft-acc-in">
                    <ul className="ft-list">
                      {col.links.map((l, i) => {
                        const href = siteHref(l.url);
                        return <li key={i}>{href !== '' ? <a href={href} {...ext(href)}>{l.label}</a> : <span>{l.label}</span>}</li>;
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="ft-col ft-contact">
            <h2 className="ft-h">Liên hệ</h2>
            <div className="ft-ct">
              {c.address !== '' && (
                <div className="ft-row">{ICONS.pin}<span>{mapsHref !== '' ? <a href={mapsHref} target="_blank" rel="noopener">{c.address}</a> : c.address}</span></div>
              )}
              {tel !== '' && (
                <div className="ft-row ft-hot-row">{ICONS.phone}<a className="ft-hot" href={'tel:' + tel}>{c.hotline}</a></div>
              )}
              {siteUrl !== '' && (
                <div className="ft-row">{ICONS.globe}<a href={siteUrl} target="_blank" rel="noopener">{site}</a></div>
              )}
            </div>
          </div>
        </div>
        <div className="ft-bar">{f.copyright}</div>
      </div>
    </footer>
  );
}
