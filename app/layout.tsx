import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { getI18n } from '@/lib/i18n/current';
import './styles/site.css';
import './styles/footer.css';

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0A2B63' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  let lang = 'vi';
  let code = 'VN';
  let chat = 'zalo';
  try {
    const cur = await getI18n();
    lang = cur.lang;
    code = cur.code;
    chat = cur.channel;
  } catch {}
  return (
    <html lang={lang} data-country={code} data-chat={chat}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Pattaya&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
