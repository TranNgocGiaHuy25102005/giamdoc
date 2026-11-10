import 'server-only';
import type { Metadata } from 'next';
import { getTranslator, tText } from './i18n/translate';
import { getSiteData } from './site';

/** Metadata SEO cho trang (tiêu đề / mô tả được dịch theo quốc gia, giống PHP dịch thẻ <meta>). */
export async function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}): Promise<Metadata> {
  const ctx = await getTranslator();
  const site = await getSiteData();
  const domain = String(site.content.contact?.domain ?? 'chunorapet.com');
  const base = 'https://' + domain;
  const title = tText(ctx, opts.title);
  const description = tText(ctx, opts.description);
  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description,
    alternates: { canonical: base + opts.path },
    openGraph: {
      type: 'website',
      title: tText(ctx, opts.ogTitle ?? opts.title),
      description: tText(ctx, opts.ogDescription ?? opts.description),
      url: base + opts.path,
      ...(opts.ogImage ? { images: [opts.ogImage] } : {}),
    },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}
