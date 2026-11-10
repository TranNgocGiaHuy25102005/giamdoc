import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/site/PageShell';
import { getSiteData } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { imgUrl } from '@/lib/json-file';
import { cleanHref } from '@/lib/links';
import {
  newsBuildToc,
  newsBumpViews,
  newsCategories,
  newsDateDmy,
  newsDateIso,
  newsLoad,
  newsReadingMinutes,
  phpInt,
  stripTags,
  type NewsArticle,
  type NewsCategories,
} from '@/lib/stores/news';
import '../styles/news.css';

/**
 * Port tin-tuc.php — /tin-tuc (danh sách, ?q= tìm, ?cat= danh mục, ?page= phân trang)
 *                    /tin-tuc?slug=ten-bai-viet (chi tiết bài).
 * Dữ liệu: content/news_articles_data.json (lib/stores/news.ts).
 */
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

/** $_GET['x'] dạng chuỗi ((string) của mảng trong PHP là "Array") */
const qp = (sp: SP, k: string): string => {
  const v = sp[k];
  return v === undefined ? '' : Array.isArray(v) ? 'Array' : v;
};

const LIST_TITLE = 'Cẩm nang & Nhật ký Chunora PET | Tin tức chăm sóc, vận chuyển thú cưng';
const LIST_DESC = 'Cẩm nang thủ tục bay, kiểm dịch, chăm sóc và chọn giống chó mèo từ đội ngũ Chunora PET.';

/** bài đã xuất bản (lỗi đọc → []) */
function loadPublished(): NewsArticle[] {
  try {
    return newsLoad().filter((a) => a.status === 'published');
  } catch {
    return [];
  }
}

const articleUrl = (slug: string) => '/tin-tuc?slug=' + encodeURIComponent(slug);

function seoOf(a: NewsArticle): { title: string; desc: string } {
  const title = a.meta_title !== '' ? a.meta_title : a.title + ' | Chunora PET';
  const src = a.excerpt !== '' ? a.excerpt : stripTags(a.content).replace(/[ \t\n\r\v\f]+/g, ' ').trim();
  const desc = a.meta_description !== '' ? a.meta_description : Array.from(src).slice(0, 160).join('');
  return { title, desc };
}

/** Tham số danh sách (giống phần else của tin-tuc.php) */
function listParams(sp: SP, cats: NewsCategories, all: NewsArticle[]) {
  const q = qp(sp, 'q').trim();
  let cat = qp(sp, 'cat');
  if (!Object.prototype.hasOwnProperty.call(cats, cat)) cat = '';
  let list = all.filter((a) => {
    if (cat !== '' && a.category !== cat) return false;
    if (q !== '') {
      const hay = (a.title + ' ' + a.excerpt + ' ' + stripTags(a.content)).toLowerCase();
      return hay.includes(q.toLowerCase());
    }
    return true;
  });
  let featured: NewsArticle | null = null;
  if (q === '' && cat === '' && list.length) {
    featured = list[0];
    list = list.slice(1);
  }
  const perPage = 9;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const rawPage = sp.page;
  const pg = Math.min(pages, Math.max(1, rawPage === undefined ? 1 : Array.isArray(rawPage) ? 1 : phpInt(rawPage)));
  const pageItems = list.slice((pg - 1) * perPage, pg * perPage);
  let canonPath = '/tin-tuc';
  if (pg > 1 || q !== '' || cat !== '') canonPath = '/tin-tuc' + (cat !== '' && q === '' && pg === 1 ? '?cat=' + cat : '');
  return { q, cat, featured, pages, pg, pageItems, canonPath };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  await syncContent();
  const sp = await searchParams;
  const slug = qp(sp, 'slug');
  const all = loadPublished();
  const article = slug !== '' ? all.find((a) => a.slug === slug) ?? null : null;
  if (article) {
    const { title, desc } = seoOf(article);
    const site = await getSiteData();
    const siteUrl = 'https://' + String(site.content.contact?.domain ?? 'chunorapet.com');
    let ogImg = imgUrl(article.thumbnail);
    if (ogImg !== '' && !/^https?:\/\//i.test(ogImg)) ogImg = siteUrl + ogImg;
    const md = await pageMetadata({ title, description: desc, path: articleUrl(article.slug), ...(ogImg ? { ogImage: ogImg } : {}) });
    md.openGraph = {
      ...(md.openGraph ?? {}),
      type: 'article',
      siteName: 'Chunora PET',
      locale: 'vi_VN',
      publishedTime: newsDateIso(article.created_at),
      modifiedTime: newsDateIso(article.updated_at),
    } as Metadata['openGraph'];
    md.twitter = { card: ogImg !== '' ? 'summary_large_image' : 'summary' };
    return md;
  }
  const p = listParams(sp, newsCategories(), all);
  const md = await pageMetadata({ title: LIST_TITLE, description: LIST_DESC, path: p.canonPath });
  md.openGraph = { ...(md.openGraph ?? {}), type: 'website', siteName: 'Chunora PET', locale: 'vi_VN' } as Metadata['openGraph'];
  md.twitter = { card: 'summary' };
  if (p.q !== '' || p.pg > 1) md.robots = { index: false, follow: true };
  return md;
}

/** nw_thumb() */
function Thumb({ a }: { a: NewsArticle }) {
  const s = imgUrl(a.thumbnail);
  if (s !== '') return <img src={s} alt={a.title} loading="lazy" />;
  return (
    <span className="nw-ph" aria-hidden="true">
      {(Array.from(a.title)[0] ?? '').toUpperCase()}
    </span>
  );
}

/** http_build_query cho link phân trang */
function qs(base: Record<string, string>, over: Record<string, string>): string {
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) if (v !== '') p[k] = v;
  for (const [k, v] of Object.entries(over)) {
    if (v === '') delete p[k];
    else p[k] = v;
  }
  const s = new URLSearchParams(p).toString();
  return s ? '?' + s : '';
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await syncContent();
  const sp = await searchParams;
  const site = await getSiteData();
  const hotline = String(site.contact.hotline ?? '');
  const hotlineTel = String(site.contact.hotline_tel ?? '');
  const siteUrl = 'https://' + String(site.content.contact?.domain ?? 'chunorapet.com');
  const cats = newsCategories();
  const all = loadPublished();

  const slug = qp(sp, 'slug');
  let article: NewsArticle | null = null;
  if (slug !== '') {
    article = all.find((a) => a.slug === slug) ?? null;
    if (!article) redirect('/tin-tuc');
  }

  if (article) {
    const { title: seoTitle, desc: seoDesc } = seoOf(article);
    const canonical = siteUrl + articleUrl(article.slug);
    const ogImg0 = imgUrl(article.thumbnail);
    const ogImg = ogImg0 !== '' && !/^https?:\/\//i.test(ogImg0) ? siteUrl + ogImg0 : ogImg0;
    newsBumpViews(article.id);

    /* mục lục: gắn id cho h2/h3 (+ đổi link .php cũ trong bài sang URL mới) */
    const { html: bodyHtml, toc } = newsBuildToc(article.content, cleanHref);

    const art: Record<string, unknown> = {
      '@type': 'Article',
      headline: Array.from(article.title).slice(0, 110).join(''),
      description: seoDesc,
      image: ogImg || null,
      author: { '@type': 'Person', name: article.author },
      publisher: { '@type': 'Organization', name: 'Chunora PET', url: siteUrl },
      datePublished: newsDateIso(article.created_at),
      dateModified: newsDateIso(article.updated_at),
      mainEntityOfPage: canonical,
      keywords: article.focus_keyword || null,
    };
    for (const k of Object.keys(art)) if (!art[k]) delete art[k]; // array_filter
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        art,
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: siteUrl + '/' },
            { '@type': 'ListItem', position: 2, name: 'Tin tức', item: siteUrl + '/tin-tuc' },
            { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
          ],
        },
      ],
    };
    const ldJson = JSON.stringify(ld).replace(/</g, '\\u003C').replace(/>/g, '\\u003E');

    const cur = article;
    const related = [
      ...all.filter((a) => a.id !== cur.id && a.category === cur.category),
      ...all.filter((a) => a.id !== cur.id && a.category !== cur.category),
    ].slice(0, 3);
    const latest = all.filter((a) => a.id !== cur.id).slice(0, 4);

    return (
      <PageShell active="tin-tuc" extraKeys={[seoTitle, seoDesc]}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson }} />
        <main className="main nw" id="main">
          <div className="nw-wrap">
            <nav className="nw-crumb" aria-label="Breadcrumb"><a href="/">Trang chủ</a><span>›</span><a href="/tin-tuc">Tin tức</a><span>›</span>{cur.title}</nav>
            <div className="nw-art">
              <article className="nw-main">
                <a className="nw-tag" href={'/tin-tuc?cat=' + cur.category} style={{ textDecoration: 'none' }}>{cats[cur.category] ?? ''}</a>
                <h1>{cur.title}</h1>
                <div className="nw-meta"><span>{`Bởi ${cur.author}`}</span><span><time dateTime={newsDateIso(cur.created_at)}>{newsDateDmy(cur.created_at)}</time></span><span>{`${newsReadingMinutes(cur.content)} phút đọc`}</span></div>
                {imgUrl(cur.thumbnail) !== '' && (
                  <div className="nw-cover"><img src={imgUrl(cur.thumbnail)} alt={cur.title} /></div>
                )}
                {toc.length >= 2 && (
                  <nav className="nw-toc" aria-label="Mục lục"><strong>Nội dung bài viết</strong><ol>
                    {toc.map((t) => (
                      <li key={t.id} className={'l' + t.lv}><a href={'#' + t.id}>{t.text}</a></li>
                    ))}
                  </ol></nav>
                )}
                <div className="nw-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                <div className="nw-cta">
                  <div><h3>Cần tư vấn cho bé nhà bạn?</h3><p>Đội ngũ Chunora PET sẵn sàng hỗ trợ hồ sơ, vận chuyển và chăm sóc.</p></div>
                  <a className="nw-btn" href={'tel:' + (hotlineTel || '+84396241612')}>{`Hotline: ${hotline || '(+84) 396 24 1612'}`}</a>
                </div>
              </article>
              <aside className="nw-side">
                <div className="nw-box"><h3>Bài viết mới nhất</h3>
                  {latest.map((a) => (
                    <a key={a.id} className="nw-late" href={articleUrl(a.slug)}><span className="nw-img"><Thumb a={a} /></span><span><b>{a.title}</b><small>{newsDateDmy(a.created_at)}</small></span></a>
                  ))}
                </div>
                <div className="nw-box nw-banner"><h3>Dịch vụ vận chuyển thú cưng quốc tế</h3><p>Trọn gói hồ sơ, kiểm dịch, lồng chuẩn IATA và cập nhật hành trình từng chặng.</p><a className="nw-btn" href="/van-chuyen-quoc-te">Xem dịch vụ</a></div>
              </aside>
            </div>
            {related.length > 0 && (
              <section className="nw-rel"><h2>Bài viết liên quan</h2>
                <div className="nw-grid">
                  {related.map((a) => (
                    <a key={a.id} className="nw-card" href={articleUrl(a.slug)}><span className="nw-img"><Thumb a={a} /></span><span className="nw-txt"><span className="nw-tag">{cats[a.category] ?? ''}</span><h3>{a.title}</h3><p>{a.excerpt}</p></span></a>
                  ))}
                </div>
              </section>
            )}
            <div style={{ height: '80px' }}></div>
          </div>
        </main>
      </PageShell>
    );
  }

  /* ---------- Danh sách ---------- */
  const { q, cat, featured, pages, pg, pageItems } = listParams(sp, cats, all);
  const pageLinks: number[] = [];
  for (let i = 1; i <= pages; i++) pageLinks.push(i);

  return (
    <PageShell active="tin-tuc" extraKeys={[LIST_TITLE, LIST_DESC]}>
      <main className="main nw" id="main">
        <section className="nw-hero"><div className="nw-wrap">
          <h1>Cẩm nang &amp; Nhật ký Chunora PET</h1>
          <p>Kiến thức thủ tục bay, kiểm dịch, chăm sóc và chọn giống chó mèo từ đội ngũ Chunora PET.</p>
          <form className="nw-search" method="get" action="/tin-tuc" role="search">
            {cat !== '' && <input type="hidden" name="cat" defaultValue={cat} />}
            <input type="search" name="q" defaultValue={q} placeholder="Tìm bài viết…" aria-label="Tìm bài viết" /><button type="submit">Tìm</button>
          </form>
        </div></section>
        <div className="nw-wrap nw-body">
          <div className="nw-chips">
            <a className={'nw-chip' + (cat === '' ? ' on' : '')} href="/tin-tuc">Tất cả</a>
            {Object.entries(cats).map(([k, label]) => (
              <a key={k} className={'nw-chip' + (cat === k ? ' on' : '')} href={'/tin-tuc?cat=' + k}>{label}</a>
            ))}
          </div>
          {featured && (
            <a className="nw-feat" href={articleUrl(featured.slug)}>
              <span className="nw-img"><Thumb a={featured} /></span>
              <span className="nw-txt"><span className="nw-tag">{`Nổi bật · ${cats[featured.category] ?? ''}`}</span><h2>{featured.title}</h2><span style={{ color: 'var(--muted)' }}>{featured.excerpt}</span><span className="nw-meta"><span>{newsDateDmy(featured.created_at)}</span><span>{`${newsReadingMinutes(featured.content)} phút đọc`}</span></span></span>
            </a>
          )}
          {pageItems.length === 0 && !featured ? (
            <p className="nw-empty">Chưa có bài viết phù hợp.</p>
          ) : (
            <div className="nw-grid">
              {pageItems.map((a) => (
                <a key={a.id} className="nw-card" href={articleUrl(a.slug)}><span className="nw-img"><Thumb a={a} /></span><span className="nw-txt"><span className="nw-tag">{cats[a.category] ?? ''}</span><h3>{a.title}</h3><p>{a.excerpt}</p><span className="nw-meta"><span>{newsDateDmy(a.created_at)}</span><span>{`${newsReadingMinutes(a.content)} phút đọc`}</span></span></span></a>
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="nw-pager" aria-label="Phân trang">
              {pageLinks.map((i) =>
                i === pg ? (
                  <span key={i} className="on">{i}</span>
                ) : (
                  <a key={i} href={'/tin-tuc' + qs({ q, cat }, { page: i > 1 ? String(i) : '' })}>{i}</a>
                ),
              )}
            </nav>
          )}
        </div>
      </main>
    </PageShell>
  );
}
