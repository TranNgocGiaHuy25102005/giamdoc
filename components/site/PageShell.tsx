import type { ReactNode } from 'react';
import { getTranslator, jsDict, translateTree } from '@/lib/i18n/translate';
import { SiteHeader } from './SiteHeader';
import { escapeHtml } from '@/lib/text';
import { norm } from '@/lib/i18n/countries';
import { SiteFooter } from './SiteFooter';
import { SiteBehaviors } from './SiteBehaviors';

/**
 * Khung trang công khai: header + nội dung + footer, rồi DỊCH toàn bộ cây theo quốc gia khách chọn.
 * Mọi trang công khai đều trả về <PageShell>…</PageShell> (thay cho site_chrome + i18n_ob của PHP).
 * - extraKeys: câu chữ không nằm trong cây (vd. tiêu đề/mô tả SEO) — để admin quét dịch.
 */
export async function PageShell({
  children,
  active = 'home',
  home = false,
  mainClass,
  extraKeys = [],
}: {
  children: ReactNode;
  active?: string;
  home?: boolean;
  mainClass?: string;
  extraKeys?: string[];
}) {
  const ctx = await getTranslator();
  const tree = (
    <div className="page">
      <SiteHeader home={home} active={active} />
      {mainClass === undefined ? children : <main className={mainClass} id="main">{children}</main>}
      <SiteFooter />
    </div>
  );
  const translated = await translateTree(ctx, tree);
  const dict = jsDict(ctx);
  if (ctx.collect) for (const k of extraKeys) ctx.fn(norm(escapeHtml(k)), 'text');
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/&/g, '\\u0026');
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.CP_I18N=${json(dict)};window.CPT=function(s){return(window.CP_I18N&&window.CP_I18N[s])||s};` }} />
      {translated}
      <SiteBehaviors />
      {ctx.collect && <script type="application/json" id="cp-i18n-keys" dangerouslySetInnerHTML={{ __html: json([...ctx.collect]) }} />}
    </>
  );
}
