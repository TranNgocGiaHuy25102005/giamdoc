import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import { PageShell } from '@/components/site/PageShell';
import { MuaBanTabsBehavior } from '@/components/muaban/MuaBanTabsBehavior';
import { IconArrow, IconCat, IconDog } from '@/components/muaban/icons';
import { getSiteData } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { imgUrl } from '@/lib/json-file';
import { petsLoadSafe, type Pet, type PetType } from '@/lib/stores/pets';
import '../styles/muaban.css';

/**
 * Trang "Mua bán chó mèo" — port mua-ban/index.php.
 * Danh sách các bé quản lý ở Admin → Mua bán (MySQL site_content id = 2, mẫu từ content/mua-ban.json).
 */
export const dynamic = 'force-dynamic';

const SEO_TITLE = 'Mua bán chó mèo · CHUNORA PET';
const SEO_DESC = 'Mua chó, mua mèo cùng CHUNORA PET. Làm quen với các giống chó mèo và nhận tư vấn chọn bé phù hợp với nhịp sống của bạn.';

export async function generateMetadata(): Promise<Metadata> {
  await syncContent();
  return pageMetadata({ title: SEO_TITLE, description: SEO_DESC, path: '/mua-ban' });
}

const TABS: { key: PetType; label: string; noun: string; title: string }[] = [
  { key: 'cho', label: 'Mua chó', noun: 'chó', title: 'Tìm một người bạn vẫy đuôi.' },
  { key: 'meo', label: 'Mua mèo', noun: 'mèo', title: 'Tìm một người bạn nhỏ cho tổ ấm.' },
];

export default async function MuaBanPage() {
  await syncContent();
  const site = await getSiteData();
  const zalo = String(site.chat.url ?? '');
  const zaloOk = zalo !== '' && zalo !== '#';
  const chatName = site.chat.name || 'Zalo';

  const pets: Record<PetType, Pet[]> = { cho: [], meo: [] };
  try {
    for (const p of await petsLoadSafe()) pets[p.type === 'meo' ? 'meo' : 'cho'].push(p);
  } catch {
    pets.cho = [];
    pets.meo = [];
  }

  return (
    <PageShell active="mua-ban" extraKeys={[SEO_TITLE, SEO_DESC]}>
      <noscript dangerouslySetInnerHTML={{ __html: '<style>.track{display:block}.panel{opacity:1;transform:none}.tabs{display:none}</style>' }} />
      <main className="main" id="main">
        <div className="wrap">
          <div className="tabs">
            <div className="tabs-in" id="tabsIn" role="tablist" aria-label="Chọn loại thú cưng">
              <span className="pill" id="pill" aria-hidden="true"></span>
              {TABS.map((t) => (
                <button key={t.key} className="tab" role="tab" type="button" id={`tab-${t.key}`} aria-controls={`panel-${t.key}`} aria-selected={t.key === 'cho' ? 'true' : 'false'} data-tab={t.key}>
                  {t.key === 'cho' ? <IconDog /> : <IconCat />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="viewport" id="viewport">
            <div className="track" id="track">
              {TABS.map((t) => (
                <section key={t.key} className={'panel' + (t.key === 'cho' ? ' on' : '')} id={`panel-${t.key}`} role="tabpanel" aria-labelledby={`tab-${t.key}`}>
                  <div className="eyebrow">{'MUA BÁN ' + t.noun.toUpperCase()}</div>
                  <div className="head">
                    <h1>{t.title}</h1>
                    <p className="lead">Bắt đầu từ giống bạn yêu thích. Chunora cùng bạn tìm bé phù hợp với nhịp sống và tổ ấm của mình.</p>
                  </div>
                  <div className="sub">
                    <h2>{'Làm quen với những bé ' + t.noun}</h2>
                    <small>Danh sách minh họa · Liên hệ để biết các bé hiện có</small>
                  </div>
                  {pets[t.key].length === 0 ? (
                    <div className="empty">Danh sách đang được cập nhật. Hãy liên hệ Chunora để biết các bé hiện có.</div>
                  ) : (
                    <div className="grid">
                      {pets[t.key].map((p, i) => {
                        const img = imgUrl(p.image);
                        return (
                          <a key={p.slug + '-' + i} className="pet" href={'/mua-ban/chi-tiet?p=' + encodeURIComponent(p.slug)}>
                            <div className="ph">
                              {img !== '' ? (
                                <img loading="lazy" src={img} alt={p.name} />
                              ) : t.key === 'cho' ? (
                                <IconDog size={44} />
                              ) : (
                                <IconCat size={44} />
                              )}
                            </div>
                            <div className="info">
                              <span className="breed">{p.breed}</span>
                              <h3>{p.name}</h3>
                              <span className="meta">{p.identity}</span>
                              {p.price !== '' && <span className="price">{p.price}</span>}
                              <span className="go">Xem chi tiết <IconArrow /></span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  <div className="foot-note">
                    <span>Ảnh minh họa theo giống. Thông tin từng bé được trao đổi trực tiếp khi tư vấn.</span>
                    {zaloOk && (
                      <a href={zalo} target="_blank" rel="noopener">Chưa thấy giống bạn tìm? Trò chuyện cùng Chunora ↗</a>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <section className="cta">
          <div className="wrap">
            <div>
              <div className="eyebrow">CHỌN BÉ CÙNG CHUNORA</div>
              <h2>Chọn một bé. Bắt đầu một tình bạn.</h2>
              <p>Bạn đang ở căn hộ hay nhà vườn, lần đầu nuôi hay đã có bạn nhỏ? Chia sẻ cùng Chunora để được tư vấn giống và cách chuẩn bị đón bé phù hợp.</p>
            </div>
            <div className="cta-r">
              <a className="tel" href={`tel:${site.contact.hotline_tel}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                {site.contact.hotline}
              </a>
              {zaloOk ? (
                <>
                  <a className="btn" href={zalo} target="_blank" rel="noopener">{'Nhắn Chunora qua ' + chatName} <IconArrow /></a>
                  <span className="zl">{chatName + ': ' + zalo}</span>
                </>
              ) : (
                <a className="btn" href="/#tu-van">Đăng ký tư vấn <IconArrow /></a>
              )}
            </div>
          </div>
        </section>
      </main>
      <MuaBanTabsBehavior />
    </PageShell>
  );
}
