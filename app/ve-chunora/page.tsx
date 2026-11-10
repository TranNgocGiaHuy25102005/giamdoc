import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import type { CSSProperties, ReactNode } from 'react';
import { PageShell } from '@/components/site/PageShell';
import { Nl2br } from '@/components/site/Nl2br';
import { AboutEm } from '@/components/about/AboutEm';
import { AboutBehavior } from '@/components/about/AboutBehavior';
import { getSiteData } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { imgUrl } from '@/lib/json-file';
import { cleanHref } from '@/lib/links';
import { telOf } from '@/lib/text';
import { aboutDefaults, aboutLoad, aboutYoutubeId, type AboutData } from '@/lib/stores/about';
import '../styles/about.css';

/** Trang "Về Chunora PET" — port ve-chunora.php (nội dung: content/about_chunora_data.json, sửa trong Admin). */
export const dynamic = 'force-dynamic';

const SEO_TITLE = 'Về Chunora PET · Câu chuyện thương hiệu & đội ngũ';
const SEO_DESC =
  'Chunora PET – chuỗi dịch vụ mua bán, chăm sóc và vận chuyển chó mèo đa quốc gia. Tìm hiểu câu chuyện thương hiệu, cam kết và đội ngũ của chúng tôi.';

export async function generateMetadata(): Promise<Metadata> {
  await syncContent();
  return pageMetadata({ title: SEO_TITLE, description: SEO_DESC, path: '/ve-chunora' });
}

/* ---- Icon SVG inline ---- */
function Svg({ children, s = 24, sw = '1.8' }: { children: ReactNode; s?: number; sw?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ic = {
  doc: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></>),
  globe: (<><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>),
  home: (<><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>),
  chat: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></>),
  play: <path d="M8 5v14l11-7z" fill="currentColor" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  paw: (<><circle cx="5.5" cy="11" r="1.8" /><circle cx="9.5" cy="6.5" r="1.8" /><circle cx="14.5" cy="6.5" r="1.8" /><circle cx="18.5" cy="11" r="1.8" /><path d="M12 12c-3 0-5.5 3-5.5 5.2 0 1.7 1.3 2.3 2.7 2.3 1 0 1.8-.5 2.8-.5s1.8.5 2.8.5c1.4 0 2.7-.6 2.7-2.3C17.5 15 15 12 12 12Z" /></>),
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
};

const cardStyles: [keyof typeof ic, string, string][] = [
  ['doc', '#FFF3E0', '#C25E0A'],
  ['globe', '#EBF3FE', '#1E4E9C'],
  ['home', '#E6F4EA', '#0B6B3A'],
  ['chat', '#FCE8E6', '#B3261E'],
];

const socIcons: Record<string, ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.4 1.7 4 4 4.2v3.1c-1.5 0-2.9-.4-4-1.2v6.2a6.1 6.1 0 1 1-6.1-6.1c.3 0 .6 0 .9.1v3.2a3 3 0 1 0 2.1 2.8V3h3.1z" /></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.6V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6V13h2.7v8h3.2z" /></svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.8-.4-1.7-.9-2.5-2.2-.2-.3.2-.3.6-1.1.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-.9 2.4.3 1.6 1.6 3.1 3 4 1.8 1.2 3.4 1.4 4.3 1.1.7-.2 1.4-.9 1.6-1.6.1-.4.1-.7 0-.8z" /></svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.5 3.6 2.8 10.8c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.8.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.5-1.8-1.4-1.4zM9 14.4l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.2-1.8-4.5z" /></svg>
  ),
  zalo: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5C6.5 2.5 2 6.2 2 10.9c0 2.5 1.3 4.7 3.4 6.2l-.8 3.2c-.1.4.3.7.7.5l3.5-1.9c1 .3 2 .4 3.2.4 5.5 0 10-3.7 10-8.4S17.500 2.500 12 2.500z" /><text x="12" y="13.600" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="6.500" fontWeight="700" fill="#fff">Zalo</text></svg>
  ),
};

/** Đổi liên kết lưu trong JSON thành href dùng được (ab_href). */
function abHref(link: string, def: string): string {
  if (link === '') return def;
  if (link[0] === '#' || /^https?:\/\//i.test(link)) return link;
  return cleanHref(link[0] === '/' ? link : '/' + link);
}

export default async function AboutPage() {
  await syncContent();
  const site = await getSiteData();
  let ab: AboutData;
  try {
    ab = aboutLoad();
  } catch {
    ab = aboutDefaults();
  }
  const { story, why, team, cta } = ab;
  const stats = ab.stats.items;
  const soc = ab.social_section;
  const socCh = soc.channels.filter((c) => c.enabled && c.url !== '');

  const hotline = cta.hotline !== '' ? cta.hotline : String(site.contact.hotline ?? '');
  const hotlineTel = telOf(hotline);
  const contactHref = abHref(cta.button_link, '/#lien-he');

  /* ---- Video ---- */
  const videoUrl = story.video;
  const ytId = videoUrl !== '' ? aboutYoutubeId(videoUrl) : '';
  const videoSrc = ytId === '' && videoUrl !== '' ? imgUrl(videoUrl) : '';
  const hasVideo = ytId !== '' || videoSrc !== '';
  let thumb = imgUrl(story.thumbnail);
  if (thumb === '' && ytId !== '') thumb = 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg';
  const wi = imgUrl(why.image);

  return (
    <PageShell active="ve-chunora" extraKeys={[SEO_TITLE, SEO_DESC]}>
      <main className="main ab" id="main">
        {/* Giới thiệu & câu chuyện thương hiệu */}
        <section className="ab-sec" id="gioi-thieu" aria-labelledby="st-t">
          <div className="ab-wrap ab-story">
            <div>
              <span className="ab-eyebrow">{story.eyebrow}</span>
              <h1 className="ab-title" id="st-t"><AboutEm text={story.title} /></h1>
              {story.positioning !== '' && <p className="ab-pos"><Nl2br text={story.positioning} /></p>}
              {story.intro !== '' && <p className="ab-lead"><Nl2br text={story.intro} /></p>}
              {hasVideo && (
                <button className="ab-btn" type="button" data-video="">
                  <Svg s={18}>{ic.play}</Svg> {story.cta}
                </button>
              )}
            </div>
            <figure className="ab-media">
              {thumb !== '' ? (
                <img src={thumb} alt={story.title} loading="lazy" />
              ) : (
                <span className="ph" aria-hidden="true"><Svg s={96} sw="1.2">{ic.paw}</Svg></span>
              )}
              {hasVideo && (
                <button className="ab-play" type="button" data-video="" aria-label={story.cta}>
                  <Svg s={34}>{ic.play}</Svg>
                </button>
              )}
            </figure>
          </div>
        </section>

        {/* Vì sao chọn Chunora PET */}
        <section className="ab-sec ab-sec--navy" id="vi-sao" aria-labelledby="vs-t">
          <div className="ab-wrap ab-why">
            <div>
              <span className="ab-eyebrow">{why.eyebrow}</span>
              <h2 className="ab-title" id="vs-t"><AboutEm text={why.title} /></h2>
              <p className="ab-lead"><Nl2br text={why.desc} /></p>
              <figure className="ab-why-img">
                {wi !== '' ? (
                  <img src={wi} alt={why.title} loading="lazy" />
                ) : (
                  <span className="ph" aria-hidden="true"><Svg s={72} sw="1.2">{ic.paw}</Svg></span>
                )}
              </figure>
              {why.cta !== '' && (
                <a className="ab-btn" href={abHref(why.cta_link, '#doi-ngu')}>
                  {why.cta} <Svg s={16}>{ic.arrow}</Svg>
                </a>
              )}
            </div>
            <div className="ab-grid">
              {why.cards.map((c, i) => {
                const [ik, bg, fg] = cardStyles[i % 4];
                const st: CSSProperties = { background: bg, color: fg };
                return (
                  <article className="ab-card" key={i}>
                    <span className="ab-ico" style={st}><Svg s={24}>{ic[ik]}</Svg></span>
                    <h3>{c.title}</h3>
                    {c.desc !== '' && <p>{c.desc}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Đội ngũ */}
        <section className="ab-sec" id="doi-ngu" aria-labelledby="dn-t">
          <div className="ab-wrap">
            <div className="ab-center">
              <span className="ab-eyebrow">{team.eyebrow}</span>
              <h2 className="ab-title" id="dn-t"><AboutEm text={team.title} /></h2>
              <p className="ab-lead"><Nl2br text={team.desc} /></p>
            </div>
            {team.members.length > 0 && (
              <div className="ab-team">
                {team.members.map((m, i) => {
                  const mi = imgUrl(m.image);
                  return (
                    <article className="ab-member" key={i}>
                      <div className="ab-photo">
                        {mi !== '' ? (
                          <img src={mi} alt={m.name !== '' ? m.name : m.role} loading="lazy" />
                        ) : (
                          <Svg s={64} sw="1.2">{ic.user}</Svg>
                        )}
                      </div>
                      <div className="tx">
                        {m.name !== '' && <h3>{m.name}</h3>}
                        {m.role !== '' && <span className="role">{m.role}</span>}
                        {m.desc !== '' && <p>{m.desc}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {team.cta !== '' && (
              <div className="ab-teamcta">
                <a className="ab-btn ab-btn--line" href={abHref(team.cta_link, '#lien-he-cta')}>
                  {team.cta} <Svg s={16}>{ic.arrow}</Svg>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Kênh truyền thông (Mạng xã hội) */}
        {socCh.length > 0 && (
          <section className="ab-soc" id="kenh-truyen-thong" aria-labelledby="soc-t">
            <div className="ab-wrap">
              <div className="ab-soc-head">
                <span className="ab-eyebrow">{soc.eyebrow}</span>
                <h2 id="soc-t"><AboutEm text={soc.title} /></h2>
                {soc.subtitle !== '' && <p><Nl2br text={soc.subtitle} /></p>}
              </div>
              <div className="ab-soc-grid">
                {socCh.map((c) => (
                  <a className="ab-soc-card" href={c.url} target="_blank" rel="noopener noreferrer" key={c.key}>
                    <span className="ab-soc-ico" style={{ background: c.bg, color: c.color }}>{socIcons[c.key] ?? null}</span>
                    <span>
                      <span className="ab-soc-nm">{c.name}</span>
                      {c.subtext !== '' && <span className="ab-soc-sub">{c.subtext}</span>}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Số liệu uy tín */}
        <section className="ab-sec--band" id="so-lieu" aria-label="Số liệu uy tín">
          <div className="ab-wrap ab-stats">
            {stats.map((s, i) => (
              <div className="ab-stat" key={i}>
                <div className="ab-num" data-count={s.value}>{s.value}</div>
                <span className="lb">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Kêu gọi hành động */}
        <section className="ab-sec ab-sec--navy" id="lien-he-cta" aria-labelledby="cta-t">
          <div className="ab-wrap ab-cta">
            <span className="ab-ico"><Svg s={26}>{ic.paw}</Svg></span>
            <h2 className="ab-title" id="cta-t" style={{ marginTop: 0 }}><AboutEm text={cta.title} /></h2>
            <p className="ab-lead"><Nl2br text={cta.desc} /></p>
            <div className="ab-cta-btns">
              <a className="ab-btn" href={contactHref}>
                {cta.button} <Svg s={16}>{ic.arrow}</Svg>
              </a>
              {hotlineTel !== '' && (
                <a className="ab-btn ab-btn--ghost" href={`tel:${hotlineTel}`}>
                  <Svg s={18}>{ic.phone}</Svg> {hotline}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {hasVideo && (
        <div className="ab-modal" id="abModal" role="dialog" aria-modal="true" aria-label={story.cta} data-yt={ytId} data-src={videoSrc}>
          <button className="ab-close" type="button" aria-label="Đóng video">&times;</button>
          <div className="ab-modal-box" id="abBox"></div>
        </div>
      )}

      <AboutBehavior />
    </PageShell>
  );
}
