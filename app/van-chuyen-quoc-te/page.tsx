import type { CSSProperties, ReactNode } from 'react';
import { syncContent } from '@/lib/json-file';
import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { Nl2br } from '@/components/site/Nl2br';
import { TransportBehavior } from '@/components/transport/TransportBehavior';
import { getSiteData } from '@/lib/site';
import { getCsrfToken } from '@/lib/csrf';
import { pageMetadata } from '@/lib/seo';
import { imgUrl } from '@/lib/json-file';
import { transportDefaults, transportLoad, type TransportData } from '@/lib/stores/transport';
import '../styles/transport.css';

/**
 * Trang "Vận chuyển đa quốc gia" — port van-chuyen-quoc-te.php:
 * Hero, 3 trụ cột dịch vụ, hành trình của bé, phạm vi tuyến bay, thư viện ảnh thực tế + form nhận báo giá.
 * Nội dung đọc từ content/transport_service_data.json (Admin → "Quản lý Vận Chuyển").
 */
export const dynamic = 'force-dynamic';

/** Dữ liệu trang (lỗi đọc file → dùng mặc định, không làm hỏng trang) */
function loadData(): TransportData {
  try {
    return transportLoad();
  } catch {
    return transportDefaults();
  }
}

function seoOf(tp: TransportData) {
  const t = tp.hero.title;
  return {
    title: (t === '' || t === '0' ? 'Vận chuyển đa quốc gia' : t) + ' · Vận chuyển chó mèo quốc tế · CHUNORA PET',
    desc: 'Vận chuyển chó mèo trong nước và quốc tế an toàn: hồ sơ kiểm dịch, lồng chuẩn IATA, tư vấn tuyến bay và cập nhật hình ảnh suốt hành trình. Nhận báo giá nhanh từ CHUNORA PET.',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  await syncContent();
  const seo = seoOf(loadData());
  return pageMetadata({ title: seo.title, description: seo.desc, path: '/van-chuyen-quoc-te' });
}

/* ---- Icon SVG inline ---- */
type IconName = 'doc' | 'plane' | 'camera' | 'chat' | 'shield' | 'box' | 'heart' | 'globe' | 'pin' | 'phone' | 'arrow' | 'check';
const IC: Record<IconName, ReactNode> = {
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></>,
  plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3.5" /></>,
  chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  box: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></>,
  heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M20 6 9 17l-5-5" />,
};
const PILLAR_ICONS: IconName[] = ['doc', 'plane', 'camera'];
const STEP_ICONS: IconName[] = ['chat', 'shield', 'box', 'heart', 'plane', 'doc', 'pin', 'camera'];

function Svg({ name, size = 28 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {IC[name]}
    </svg>
  );
}

/** Mô tả nhiều dòng → danh sách có dấu tick (1 dòng → đoạn văn). — tp_lines() */
function TpLines({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  if (!lines.length) return null;
  if (lines.length === 1) return <p>{lines[0]}</p>;
  return (
    <ul className="vc-ticks">
      {lines.map((l, i) => (
        <li key={i}>
          <Svg name="check" size={18} />
          <span>{l.replace(/^[-•\s]+/u, '')}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function TransportPage() {
  await syncContent();
  const site = await getSiteData();
  const tp = loadData();
  const csrf = await getCsrfToken();
  const { hero, pillars, journey, routes, gallery, quote } = tp;

  const hotline = quote.hotline !== '' ? quote.hotline : String(site.contact.hotline ?? '');
  const hotlineTel = hotline.replace(/[^0-9+]/g, '');
  const zaloRaw = quote.zalo !== '' ? quote.zalo : String(site.social.zalo ?? '');
  let zaloUrl = '';
  if (/^https?:\/\//i.test(zaloRaw)) zaloUrl = zaloRaw;
  else if (/^[0-9+\s.\-]{6,20}$/.test(zaloRaw)) zaloUrl = 'https://zalo.me/' + zaloRaw.replace(/[^0-9]/g, '');
  const chatName = String(site.chat.name ?? 'Zalo');
  if ((site.chat.key ?? 'zalo') !== 'zalo' && String(site.chat.url ?? '') !== '' && site.chat.url !== '#') {
    zaloUrl = String(site.chat.url);
  }
  const contactHref = zaloUrl !== '' ? zaloUrl : hotlineTel !== '' ? 'tel:' + hotlineTel : '#bao-gia';
  const contactBlank = zaloUrl !== '';

  const seo = seoOf(tp);
  const heroImg = imgUrl(hero.image);
  const gImgs = gallery.images
    .map((g) => ({ u: imgUrl(g.src), a: g.alt }))
    .filter((g) => g.u !== '');
  const tlStyle = { '--n': String(Math.max(1, journey.steps.length)) } as CSSProperties;

  return (
    <PageShell active="van-chuyen" extraKeys={[seo.title, seo.desc]}>
      <main className="main vc" id="main">

        {/* Mở đầu */}
        <section className="vc-hero">
          {heroImg !== '' && <div className="vc-hero-bg" style={{ backgroundImage: `url('${heroImg}')` }} role="img" aria-label={hero.title}></div>}
          <div className="vc-hero-ico" aria-hidden="true"><Svg name="plane" size={220} /></div>
          <div className="vc-wrap">
            <span className="vc-badge"><Svg name="plane" size={16} /> {hero.badge}</span>
            <h1>{hero.title}</h1>
            <p><Nl2br text={hero.desc} /></p>
            <div className="vc-cta">
              <a className="vc-btn" href="#bao-gia" data-scroll="">{hero.cta_primary} <Svg name="arrow" size={16} /></a>
              <a className="vc-btn vc-btn--ghost" href={contactHref} {...(contactBlank ? { target: '_blank', rel: 'noopener' } : {})}>{hero.cta_secondary}</a>
            </div>
          </div>
        </section>

        {/* 3 trụ cột dịch vụ */}
        <section className="vc-sec" id="dich-vu" aria-label="Dịch vụ trọng tâm">
          <div className="vc-wrap vc-cards">
            {pillars.map((p, i) => (
              <article className="vc-card" key={i}>
                <div className="vc-ico"><Svg name={PILLAR_ICONS[i] ?? 'doc'} size={30} /></div>
                <h3>{p.title}</h3>
                <TpLines text={p.desc} />
              </article>
            ))}
          </div>
        </section>

        {/* Hành trình của bé */}
        <section className="vc-sec vc-sec--white" id="hanh-trinh" aria-labelledby="ht-t">
          <div className="vc-wrap">
            <div className="vc-head">
              <span className="vc-badge"><Svg name="pin" size={16} /> Từ liên hệ đến bàn giao</span>
              <h2 id="ht-t">{journey.title}</h2>
              <p className="vc-lead"><Nl2br text={journey.desc} /></p>
            </div>
            <ol className="vc-tl" style={tlStyle}>
              {journey.steps.map((s, i) => (
                <li className="vc-step" key={i}>
                  <div className="dot"><Svg name={STEP_ICONS[i % STEP_ICONS.length]} size={30} /></div>
                  <h3>{s.title}</h3>
                  {s.desc !== '' && <p>{s.desc}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Phạm vi tuyến bay */}
        <section className="vc-sec" id="tuyen-bay" aria-labelledby="tb-t">
          <div className="vc-wrap">
            <div className="vc-head">
              <span className="vc-badge"><Svg name="globe" size={16} /> Tuyến bay</span>
              <h2 id="tb-t">{routes.title}</h2>
              <p className="vc-lead"><Nl2br text={routes.desc} /></p>
            </div>
            <div className="vc-routes">
              <div className="vc-route vc-route--dark">
                <div className="top"><div className="vc-ico"><Svg name="globe" size={28} /></div><h3>{routes.intl_title}</h3></div>
                <p className="vc-lead"><Nl2br text={routes.intl_desc} /></p>
                <ul className="vc-chips">{routes.intl.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
              <div className="vc-route">
                <div className="top"><div className="vc-ico"><Svg name="pin" size={28} /></div><h3>{routes.domestic_title}</h3></div>
                <p className="vc-lead"><Nl2br text={routes.domestic_desc} /></p>
                <ul className="vc-chips">{routes.domestic.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        {gImgs.length > 0 && (
          /* Thư viện ảnh thực tế */
          <section className="vc-sec vc-sec--white" id="hinh-anh" aria-labelledby="ga-t">
            <div className="vc-wrap">
              <div className="vc-head">
                <span className="vc-badge"><Svg name="camera" size={16} /> Hình ảnh thực tế</span>
                <h2 id="ga-t">{gallery.title}</h2>
                {gallery.desc !== '' && <p className="vc-lead"><Nl2br text={gallery.desc} /></p>}
              </div>
              <div className={'vc-gal' + (gImgs.length < 5 ? ' vc-gal--few' : '')}>
                {gImgs.map((g, i) => (
                  <figure key={i}><img src={g.u} alt={g.a !== '' ? g.a : gallery.title} loading="lazy" /></figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Form nhận báo giá */}
        <section className="vc-sec" id="bao-gia-wrap" aria-labelledby="bg-t">
          <div className="vc-wrap">
            <div className="vc-book" id="bao-gia">
              <div>
                <span className="vc-badge"><Svg name="plane" size={16} /> Báo giá nhanh</span>
                <h2 id="bg-t">{quote.title}</h2>
                <p><Nl2br text={quote.desc} /></p>
                <div className="vc-contacts">
                  {hotlineTel !== '' && <a className="vc-contact" href={`tel:${hotlineTel}`}><Svg name="phone" size={22} /> {hotline}</a>}
                  {zaloUrl !== '' && <a className="vc-contact" href={zaloUrl} target="_blank" rel="noopener"><Svg name="chat" size={22} /> Nhắn {chatName}</a>}
                </div>
              </div>
              <form className="vc-form" id="quoteForm" noValidate data-api="/api/send-consultation">
                <input type="hidden" id="csrf" defaultValue={csrf} />
                <div className="vc-hp" aria-hidden="true"><label>Website<input type="text" id="hp" tabIndex={-1} autoComplete="off" /></label></div>
                <div className="vc-f"><label htmlFor="q-name">Họ và tên <i>*</i></label><input className="vc-in" id="q-name" maxLength={120} autoComplete="name" placeholder="Nguyễn Văn A" required /></div>
                <div className="vc-f"><label htmlFor="q-phone">Số điện thoại / Zalo / WhatsApp <i>*</i></label><input className="vc-in" id="q-phone" type="tel" maxLength={20} autoComplete="tel" inputMode="tel" placeholder="0912345678 hoặc +66912345678" required /></div>
                <div className="vc-f"><label htmlFor="q-from">Điểm khởi hành</label><input className="vc-in" id="q-from" maxLength={100} placeholder="VD: TP. Hồ Chí Minh" /></div>
                <div className="vc-f"><label htmlFor="q-to">Điểm đến (Quốc gia / Thành phố)</label><input className="vc-in" id="q-to" maxLength={100} placeholder="VD: Tokyo, Nhật Bản" /></div>
                <div className="vc-f"><label htmlFor="q-pet">Giống thú cưng &amp; cân nặng ước tính</label><input className="vc-in" id="q-pet" maxLength={100} placeholder="VD: Poodle, 4 kg" /></div>
                <div className="vc-f"><label htmlFor="q-date">Thời gian dự kiến bay</label><input className="vc-in" id="q-date" type="date" /></div>
                <div className="vc-f vc-f--full"><label htmlFor="q-note">Ghi chú thêm</label><textarea className="vc-in" id="q-note" maxLength={800} placeholder="Tình trạng tiêm phòng, chip, yêu cầu đặc biệt…"></textarea></div>
                <div className="vc-msg" id="q-msg" role="status" aria-live="polite"></div>
                <button className="vc-btn" type="submit" id="q-btn">{quote.submit} <Svg name="arrow" size={16} /></button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <TransportBehavior />
    </PageShell>
  );
}
