import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import { PageShell } from '@/components/site/PageShell';
import { Nl2br } from '@/components/site/Nl2br';
import { CareBehavior } from '@/components/care/CareBehavior';
import { getSiteData } from '@/lib/site';
import { getCsrfToken } from '@/lib/csrf';
import { pageMetadata } from '@/lib/seo';
import { imgUrl } from '@/lib/json-file';
import { telOf } from '@/lib/text';
import { careDefaults, careLoad, type CareData, type CareItem } from '@/lib/stores/care';
import '../styles/care.css';

/**
 * Trang "Chăm sóc tại store" — port cham-soc-tai-store.php.
 * Spa/Grooming, Khách sạn VIP, Bảng giá, Thư viện ảnh + Form đặt lịch.
 * Nội dung đọc từ content/care_service_data.json (sửa trong Admin → "Quản lý Chăm Sóc Store").
 * Form đặt lịch gửi về /api/send-consultation (xem components/care/CareBehavior.tsx).
 */
export const dynamic = 'force-dynamic';

const seoTitle = 'Chăm sóc tại store · Spa, tắm sấy, khách sạn VIP · CHUNORA PET';
const seoDesc = 'Dịch vụ spa, tắm sấy, cắt tỉa và khách sạn lưu trú VIP cho chó mèo tại store CHUNORA PET. Bảng giá minh bạch, đặt lịch trực tuyến nhanh chóng.';

export async function generateMetadata(): Promise<Metadata> {
  await syncContent();
  return pageMetadata({ title: seoTitle, description: seoDesc, path: '/cham-soc-tai-store' });
}

function SvgCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
  );
}
function SvgArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}
function SvgPaw() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="5.5" cy="11" r="1.8" /><circle cx="9.5" cy="6.5" r="1.8" /><circle cx="14.5" cy="6.5" r="1.8" /><circle cx="18.5" cy="11" r="1.8" /><path d="M12 12c-3 0-5.5 3-5.5 5.2 0 1.7 1.3 2.3 2.7 2.3 1 0 1.8-.5 2.8-.5s1.8.5 2.8.5c1.4 0 2.7-.6 2.7-2.3C17.5 15 15 12 12 12Z" /></svg>
  );
}
function SvgImg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
  );
}
function SvgPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg>
  );
}

/** care_figure(): ảnh mặc định của mục (hoặc khung tạm). Bấm thẻ bên cạnh sẽ đổi ảnh (CareBehavior). */
function CareFigure({ src, alt, id }: { src: string; alt: string; id: string }) {
  return (
    <figure className={'cs-fig' + (src === '' ? ' cs-fig--ph' : '')} id={id} data-default={src} data-alt={alt}>
      {src !== '' && <img className="cs-main" src={src} alt={alt} loading="lazy" />}
      <span className="cs-ph" aria-hidden="true" hidden={src !== ''}><SvgPaw /></span>
    </figure>
  );
}

/** care_items(): danh sách thẻ — thẻ nào có ảnh thì bấm được để xem ảnh tương ứng. */
function CareItems({ items, figId, mode }: { items: CareItem[]; figId: string; mode: 'num' | 'check' }) {
  return (
    <ul className="cs-list" data-fig={figId}>
      {items.map((s, i) => {
        const img = imgUrl(s.image ?? '');
        const body = (
          <>
            <span className="ico">{mode === 'num' ? String(i + 1) : <SvgCheck />}</span>
            <span className="tx"><strong>{s.title}</strong>{s.desc !== '' && <span className="d">{s.desc}</span>}</span>
          </>
        );
        return img !== '' ? (
          <li key={i}>
            <button type="button" className="cs-item" data-img={img} data-alt={s.title} aria-pressed="false">
              {body}
              <span className="cam" aria-hidden="true"><SvgImg /><em>Xem ảnh</em></span>
            </button>
          </li>
        ) : (
          <li key={i}><div className="cs-item cs-item--static">{body}</div></li>
        );
      })}
    </ul>
  );
}

export default async function CareStorePage() {
  await syncContent();
  const site = await getSiteData();
  const csrf = await getCsrfToken();

  /* Dữ liệu trang (lỗi đọc file → dùng mặc định, không làm hỏng trang) */
  let care: CareData;
  try {
    care = careLoad();
  } catch {
    care = careDefaults();
  }
  const { spa, hotel, pricing, gallery, booking } = care;

  const hotline = booking.hotline !== '' ? booking.hotline : String(site.contact.hotline ?? '');
  const hotlineTel = telOf(hotline);

  const gImgs: { u: string; a: string }[] = [];
  for (const g of gallery.images) {
    const u = imgUrl(g.src);
    if (u !== '') gImgs.push({ u, a: g.alt });
  }

  const panels: ['spa' | 'hotel', string][] = [['spa', 'Dịch vụ'], ['hotel', 'Gói lưu trú']];

  return (
    <PageShell active="cham-soc" extraKeys={[seoTitle, seoDesc]}>
      <main className="main cs" id="main">

        {/* Hero */}
        <section className="cs-hero">
          <div className="cs-wrap">
            <span className="cs-badge">Chăm sóc tại store</span>
            <h1>Yêu thương bé trọn vẹn, từ spa đến giấc ngủ.</h1>
            <p>Spa, tắm sấy, cắt tỉa tạo kiểu và khách sạn lưu trú VIP ngay tại store CHUNORA PET, Quận 11.</p>
            <div className="cs-hero-cta">
              <a className="cs-btn" href="#dat-lich" data-service={booking.services[0] ?? ''}>{booking.title} <SvgArrow /></a>
              <a className="cs-btn cs-btn--ghost" href="#bang-gia">Xem bảng giá</a>
            </div>
          </div>
        </section>

        {/* Spa / Tắm sấy / Cắt tỉa */}
        <section className="cs-sec" id="spa" aria-labelledby="spa-t">
          <div className="cs-wrap cs-split">
            <CareFigure src={imgUrl(spa.image)} alt={spa.title} id="fig-spa" />
            <div className="cs-txt">
              <span className="cs-badge">{spa.badge}</span>
              <h2 id="spa-t">{spa.title}</h2>
              <p className="cs-lead"><Nl2br text={spa.desc} /></p>
              {spa.steps.length > 0 && <CareItems items={spa.steps} figId="fig-spa" mode="num" />}
              <a className="cs-btn" href="#dat-lich" data-service="Spa & Grooming">{spa.cta} <SvgArrow /></a>
            </div>
          </div>
        </section>

        {/* Khách sạn VIP */}
        <section className="cs-sec cs-sec--alt" id="khach-san" aria-labelledby="ks-t">
          <div className="cs-wrap cs-split cs-split--rev">
            <CareFigure src={imgUrl(hotel.image)} alt={hotel.title} id="fig-hotel" />
            <div className="cs-txt">
              <span className="cs-badge">{hotel.badge}</span>
              <h2 id="ks-t">{hotel.title}</h2>
              <p className="cs-lead"><Nl2br text={hotel.desc} /></p>
              {hotel.features.length > 0 && <CareItems items={hotel.features} figId="fig-hotel" mode="check" />}
              <a className="cs-btn" href="#dat-lich" data-service="Khách sạn lưu trú VIP">{hotel.cta} <SvgArrow /></a>
            </div>
          </div>
        </section>

        {/* 4.3 Bảng giá */}
        <section className="cs-sec" id="bang-gia" aria-labelledby="bg-t">
          <div className="cs-wrap">
            <div className="cs-price-head">
              <span className="cs-badge">Bảng giá</span>
              <h2 id="bg-t">{pricing.title}</h2>
              <p className="cs-lead"><Nl2br text={pricing.desc} /></p>
            </div>
            <div className="cs-tabs" role="tablist" aria-label="Chọn bảng giá">
              <button className="cs-tab" role="tab" id="tab-spa" aria-controls="panel-spa" aria-selected="true" type="button">{pricing.spa_tab}</button>
              <button className="cs-tab" role="tab" id="tab-hotel" aria-controls="panel-hotel" aria-selected="false" tabIndex={-1} type="button">{pricing.hotel_tab}</button>
            </div>
            {panels.map(([key, col]) => (
              <div key={key} className="cs-panel" role="tabpanel" id={`panel-${key}`} aria-labelledby={`tab-${key}`} hidden={key === 'hotel'}>
                <div className="cs-table-wrap">
                  {pricing[key].length > 0 ? (
                    <table className="cs-table">
                      <thead><tr><th scope="col">{col}</th><th scope="col">Hạng cân</th><th scope="col">Giá</th></tr></thead>
                      <tbody>
                        {pricing[key].map((r, i) => (
                          <tr key={i}><td className="n">{r.name}</td><td data-l="Hạng cân">{r.weight}</td><td className="p" data-l="Giá">{r.price}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="cs-empty">Bảng giá đang được cập nhật. Vui lòng liên hệ hotline.</div>
                  )}
                </div>
              </div>
            ))}
            {pricing.note !== '' && <p className="cs-note"><Nl2br text={pricing.note} /></p>}
          </div>
        </section>

        {/* 4.4 Thư viện ảnh + Form đặt lịch */}
        <section className="cs-sec cs-sec--alt" id="dat-lich-wrap" aria-labelledby="dl-t">
          <div className="cs-wrap">
            {gImgs.length > 0 && (
              <>
                <h2 className="cs-gal-title">{gallery.title}</h2>
                <div className={'cs-gal' + (gImgs.length < 5 ? ' cs-gal--few' : '')}>
                  {gImgs.map((g, i) => (
                    <figure key={i}><img src={g.u} alt={g.a !== '' ? g.a : gallery.title} loading="lazy" /></figure>
                  ))}
                </div>
              </>
            )}

            <div className="cs-book" id="dat-lich">
              <div>
                <span className="cs-badge">Đặt lịch</span>
                <h2 id="dl-t">{booking.title}</h2>
                <p><Nl2br text={booking.desc} /></p>
                {hotlineTel !== '' && (
                  <a className="cs-hot" href={`tel:${hotlineTel}`}><SvgPhone /> {hotline}</a>
                )}
              </div>
              <form className="cs-form" id="careForm" noValidate data-api="/api/send-consultation">
                <input type="hidden" id="csrf" defaultValue={csrf} />
                <div className="cs-hp" aria-hidden="true"><label>Website<input type="text" id="hp" tabIndex={-1} autoComplete="off" /></label></div>
                <div className="cs-f"><label htmlFor="c-name">Họ và tên <i>*</i></label><input className="cs-in" id="c-name" maxLength={120} autoComplete="name" placeholder="Nguyễn Văn A" required /></div>
                <div className="cs-f"><label htmlFor="c-phone">SĐT / Zalo <i>*</i></label><input className="cs-in" id="c-phone" type="tel" maxLength={20} autoComplete="tel" inputMode="tel" placeholder="0912 345 678 hoặc +66912345678" required /></div>
                <div className="cs-f"><label htmlFor="c-pet">Loại thú cưng &amp; cân nặng</label><input className="cs-in" id="c-pet" maxLength={100} placeholder="VD: Chó Poodle, 4 kg" /></div>
                <div className="cs-f"><label htmlFor="c-service">Dịch vụ cần đặt <i>*</i></label>
                  <select className="cs-in" id="c-service" required>
                    {booking.services.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div className="cs-f cs-f--full"><label htmlFor="c-date">Ngày giờ hẹn</label><input className="cs-in" id="c-date" type="datetime-local" /></div>
                <div className="cs-f cs-f--full"><label htmlFor="c-note">Ghi chú</label><textarea className="cs-in" id="c-note" maxLength={800} placeholder="Tình trạng lông/da, yêu cầu đặc biệt…"></textarea></div>
                <div className="cs-msg" id="c-msg" role="status" aria-live="polite"></div>
                <button className="cs-btn" type="submit" id="c-btn">{booking.submit} <SvgArrow /></button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <CareBehavior />
    </PageShell>
  );
}
