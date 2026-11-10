import { cache } from 'react';
import { syncContent } from '@/lib/json-file';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { PetGalleryBehavior } from '@/components/muaban/PetGalleryBehavior';
import { IconArrow, IconCat, IconDog } from '@/components/muaban/icons';
import { getSiteData } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { imgUrl } from '@/lib/json-file';
import { escapeHtml } from '@/lib/text';
import { petsFind, petsGalleryItems, type Pet, type PetGalleryItem } from '@/lib/stores/pets';
import '../../styles/muaban-detail.css';

/**
 * Trang chi tiết một bé chó/mèo — port mua-ban/chi-tiet/index.php  (/mua-ban/chi-tiet?p=ten-pet)
 * Ảnh/video + ảnh nhỏ bên trái, thông tin bên phải, mô tả chi tiết (chuẩn SEO) phía dưới.
 */
export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | string[] | undefined>>;

const SITE_NAME = 'CHUNORA PET';

/** $_GET['p'] (giá trị lặp lại → lấy giá trị cuối, giống PHP) */
function slugParam(sp: Record<string, string | string[] | undefined>): string {
  const v = sp.p;
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length) return String(v[v.length - 1]);
  return '';
}

interface PetView {
  pet: Pet;
  items: PetGalleryItem[];
  typeLabel: string;
  name: string;
  alt: string;
  title: string;
  metaDesc: string;
  path: string;
  ogImage: string;
}

const loadPet = cache(async (slug: string): Promise<PetView | null> => {
  const pet = slug !== '' ? await petsFind(slug) : null;
  if (!pet) return null;
  const items = petsGalleryItems(pet, imgUrl);
  const typeLabel = pet.type === 'meo' ? 'Mèo' : 'Chó';
  const title =
    pet.seo_title !== ''
      ? pet.seo_title
      : (pet.name + (pet.breed !== '' ? ' – ' + pet.breed : '') + ' | Mua ' + typeLabel.toLowerCase() + ' ' + SITE_NAME).trim();
  const plainDesc = pet.description.replace(/^(?:##\s+|-\s+)/gmu, '').replace(/\s+/gu, ' ').trim();
  const metaDesc =
    pet.seo_description !== ''
      ? pet.seo_description
      : plainDesc !== ''
        ? Array.from(plainDesc).slice(0, 155).join('')
        : (typeLabel + ' ' + pet.breed + ' ' + pet.name + ' – ' + pet.identity + '. Liên hệ ' + SITE_NAME + ' để được tư vấn.').trim();
  let ogImage = '';
  for (const it of items) {
    if (it.kind !== 'video') {
      ogImage = it.thumb;
      break;
    }
  }
  return {
    pet,
    items,
    typeLabel,
    name: pet.name || pet.breed,
    alt: (typeLabel + ' ' + pet.breed + ' ' + pet.name).trim(),
    title,
    metaDesc,
    path: '/mua-ban/chi-tiet?p=' + encodeURIComponent(pet.slug),
    ogImage,
  };
});

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  await syncContent();
  const v = await loadPet(slugParam(await searchParams));
  if (!v) redirect('/mua-ban');
  const m = await pageMetadata({ title: v.title, description: v.metaDesc, path: v.path, ogImage: v.ogImage || undefined });
  return {
    ...m,
    openGraph: { ...(m.openGraph ?? {}), siteName: SITE_NAME },
    twitter: { card: 'summary_large_image' },
  };
}

/** Mô tả: dòng trống = đoạn mới; "## " = tiêu đề phụ (H2); "- " = gạch đầu dòng. Mọi thứ đều được escape. */
function renderDescription(text: string): string {
  let out = '';
  const blocks = text.trim().split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l !== '');
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => {
      if (para.length) {
        out += '<p>' + para.map(escapeHtml).join('<br>') + '</p>';
        para = [];
      }
    };
    const flushList = () => {
      if (list.length) {
        out += '<ul>' + list.map((l) => '<li>' + escapeHtml(l) + '</li>').join('') + '</ul>';
        list = [];
      }
    };
    for (const line of lines) {
      if (line.startsWith('## ')) {
        flushPara();
        flushList();
        out += '<h2>' + escapeHtml(line.slice(3)) + '</h2>';
      } else if (line.startsWith('- ')) {
        flushPara();
        list.push(line.slice(2));
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
  }
  return out;
}

const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
);

export default async function PetDetailPage({ searchParams }: { searchParams: SP }) {
  await syncContent();
  const v = await loadPet(slugParam(await searchParams));
  // PHP: không tìm thấy → 302 về danh sách (thay vì trang 404 trống)
  if (!v) redirect('/mua-ban');
  const { pet, items, typeLabel } = v;

  const site = await getSiteData();
  const zalo = String(site.chat.url ?? '');
  const zaloOk = zalo !== '' && zalo !== '#';
  const chatName = site.chat.name || 'Zalo';

  const origin = 'https://' + String(site.contact.domain || 'chunorapet.com');
  const canonical = origin + v.path;
  const ogAbs = v.ogImage === '' ? '' : /^https?:\/\//i.test(v.ogImage) ? v.ogImage : origin + v.ogImage;

  // Giá dạng số (VD "12.000.000đ") → dữ liệu có cấu trúc cho Google
  let priceNum = '';
  if (/^\s*[\d.,\s]{4,}\s*(?:đ|vnđ|vnd|₫)?\s*$/iu.test(pet.price)) priceNum = pet.price.replace(/\D/g, '');
  const product: Record<string, unknown> = {
    '@type': 'Product',
    name: pet.name || pet.breed,
    description: v.metaDesc,
    category: 'Mua bán ' + typeLabel.toLowerCase(),
    brand: { '@type': 'Brand', name: SITE_NAME },
    url: canonical,
  };
  if (ogAbs !== '') product.image = ogAbs;
  if (priceNum !== '' && parseInt(priceNum, 10) > 0) {
    product.offers = { '@type': 'Offer', priceCurrency: 'VND', price: priceNum, availability: 'https://schema.org/InStock', url: canonical };
  }
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      product,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: origin + '/' },
          { '@type': 'ListItem', position: 2, name: 'Mua bán chó mèo', item: origin + '/mua-ban' },
          { '@type': 'ListItem', position: 3, name: pet.name || pet.breed },
        ],
      },
    ],
  };
  const ldJson = JSON.stringify(ld).replace(/</g, '\\u003C').replace(/>/g, '\\u003E').replace(/&/g, '\\u0026');

  const listHref = '/mua-ban' + (pet.type === 'meo' ? '#meo' : '');
  const first = items[0];

  return (
    <PageShell active="mua-ban" extraKeys={[v.title, v.metaDesc]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson }} />
      <main className="main" id="main">
        <div className="wrap">
          <nav className="crumbs" aria-label="Đường dẫn">
            <a href="/">Trang chủ</a><span aria-hidden="true">›</span>
            <a href={listHref}>Mua bán chó mèo</a><span aria-hidden="true">›</span>
            <span>{v.name}</span>
          </nav>

          <div className="split">
            <section className="gal" aria-label="Ảnh và video">
              <div className="stage" id="stage">
                {!first ? (
                  pet.type === 'meo' ? <IconCat size={64} strokeWidth={1.4} /> : <IconDog size={64} strokeWidth={1.4} />
                ) : first.kind === 'image' ? (
                  <img src={first.url} alt={v.alt} />
                ) : first.kind === 'video' ? (
                  <video src={first.url} controls playsInline preload="metadata"></video>
                ) : (
                  <iframe src={first.url} title="Video" loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen></iframe>
                )}
                {items.length > 1 && (
                  <>
                    <button type="button" className="arr l" id="prev" aria-label="Trước"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                    <button type="button" className="arr r" id="next" aria-label="Sau"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
                    <span className="cnt" id="cnt">{'1 / ' + items.length}</span>
                  </>
                )}
              </div>
              {items.length > 1 && (
                <div className="thumbs-wrap">
                  <div className="thumbs" id="thumbs" role="tablist" aria-label="Ảnh nhỏ">
                    {items.map((it, i) => (
                      <button key={i} type="button" className={'th' + (i === 0 ? ' on' : '')} data-i={i} role="tab" aria-label={'Xem mục ' + (i + 1)}>
                        {it.kind === 'video' ? (
                          <>
                            <span className="vbg"></span>
                            <span className="pl"><PlayIcon /></span>
                          </>
                        ) : (
                          <>
                            <img loading="lazy" src={it.thumb} alt="" />
                            {it.kind === 'youtube' && <span className="pl"><PlayIcon /></span>}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="info">
              <span className="badge">{'MUA BÁN ' + typeLabel.toUpperCase()}</span>
              {pet.breed !== '' && <span className="breed">{pet.breed}</span>}
              <h1>{v.name}</h1>
              {pet.identity !== '' && <p className="ident">{pet.identity}</p>}
              <div className="price"><small>Giá</small><strong>{pet.price !== '' ? pet.price : 'Liên hệ'}</strong></div>
              <dl className="specs">
                <dt>Loại</dt><dd>{typeLabel}</dd>
                {pet.breed !== '' && (<><dt>Giống</dt><dd>{pet.breed}</dd></>)}
                {pet.identity !== '' && (<><dt>Nhận diện</dt><dd>{pet.identity}</dd></>)}
              </dl>
              <div className="cta">
                <a className="btn p" href="/#tu-van">Đăng ký tư vấn <IconArrow size={14} /></a>
                <a className="btn o" href={`tel:${site.contact.hotline_tel}`}>{'Gọi ' + site.contact.hotline}</a>
                {zaloOk && <a className="btn z" href={zalo} target="_blank" rel="noopener">{'Nhắn ' + chatName}</a>}
              </div>
              <p className="note">Thông tin từng bé được trao đổi trực tiếp khi tư vấn. Hãy liên hệ Chunora để biết bé còn hay không và hẹn lịch xem bé.</p>
            </section>
          </div>
        </div>

        <section className="desc">
          <div className="wrap">
            <div className="box">
              <h2 className="t">Mô tả chi tiết</h2>
              {pet.description !== '' ? (
                <div className="prose" dangerouslySetInnerHTML={{ __html: renderDescription(pet.description) }} />
              ) : (
                <div className="prose">
                  <p>Liên hệ CHUNORA PET để nhận mô tả chi tiết, tình trạng sức khỏe, lịch tiêm phòng và hướng dẫn đón bé về nhà.</p>
                </div>
              )}
              <a className="back" href={listHref}>← Xem các bé khác</a>
            </div>
          </div>
        </section>
      </main>
      <PetGalleryBehavior items={items} alt={v.alt} />
    </PageShell>
  );
}
