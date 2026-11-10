import type { ReactNode } from 'react';
import { COUNTRIES } from '@/lib/i18n/countries';
import { FLAGS } from '@/lib/i18n/flags';
import { getI18n, switchUrl } from '@/lib/i18n/current';
import { getSiteData } from '@/lib/site';

/** Cờ quốc gia (SVG 30x20) */
export function Flag({ code, w = 22 }: { code: string; w?: number }) {
  const h = Math.round((w * 2) / 3);
  return (
    <svg className="cp-flag" width={w} height={h} viewBox="0 0 30 20" aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: FLAGS[code] ?? '<rect width="30" height="20" fill="#cbd5e1"/>' }} />
  );
}

export function PhoneIcon({ s = 20 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function ChatIcon({ k, s = 22 }: { k: string; s?: number }) {
  const a = { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': true as const };
  if (k === 'whatsapp')
    return <svg {...a} fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.8-.4-1.7-.9-2.5-2.2-.2-.3.2-.3.6-1.1.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-.9 2.4.3 1.6 1.6 3.1 3 4 1.8 1.2 3.4 1.4 4.3 1.1.7-.2 1.4-.9 1.6-1.6.1-.4.1-.7 0-.8z" /></svg>;
  if (k === 'telegram')
    return <svg {...a} fill="currentColor"><path d="M21.5 3.6 2.8 10.8c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.8.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.5-1.8-1.4-1.4zM9 14.4l9.2-5.8c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.2-1.8-4.5z" /></svg>;
  return (
    <svg {...a}>
      <path fill="currentColor" d="M12 2.5C6.5 2.5 2 6.2 2 10.9c0 2.5 1.3 4.7 3.4 6.2l-.8 3.2c-.1.4.3.7.7.5l3.5-1.9c1 .3 2 .4 3.2.4 5.5 0 10-3.7 10-8.4S17.5 2.5 12 2.5z" />
      <text x="12" y="13.6" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="6.5" fontWeight="700" fill="#fff">Zalo</text>
    </svg>
  );
}

const Caret = () => (
  <svg className="cp-car" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export async function CountrySwitchDesktop() {
  const cur = await getI18n();
  return (
    <button type="button" className="cp-cbtn" id="cp-cbtn" aria-haspopup="true" aria-expanded="false" aria-controls="cp-cpop" aria-label="Chọn quốc gia & ngôn ngữ">
      <Flag code={cur.code} w={22} />
      <b>{cur.code}</b>
      <Caret />
    </button>
  );
}

export async function CountrySwitchMobile() {
  const cur = await getI18n();
  return (
    <button type="button" className="cp-mbtn cp-mflag" id="cp-cbtn-m" aria-haspopup="true" aria-expanded="false" aria-controls="cp-cpop" aria-label="Chọn quốc gia & ngôn ngữ">
      <Flag code={cur.code} w={24} />
    </button>
  );
}

/** Bảng chọn quốc gia (chia 2 cột theo khu vực) */
export async function CountryPop() {
  const cur = await getI18n();
  const cols: Record<'asia' | 'west', ReactNode[]> = { asia: [], west: [] };
  for (const [code, info] of Object.entries(COUNTRIES)) {
    if (!cur.settings.countries[code]?.enabled) continue;
    const on = code === cur.code;
    cols[info[3]].push(
      <a key={code} className={'cp-copt' + (on ? ' is-on' : '')} href={switchUrl(cur.path, code)} data-cc={code} rel="nofollow" aria-current={on ? 'true' : undefined}>
        <Flag code={code} w={24} />
        <span>{info[0]}</span>
      </a>,
    );
  }
  return (
    <div className="cp-cpop" id="cp-cpop" role="dialog" aria-label="Chọn quốc gia & ngôn ngữ" hidden>
      <div className="cp-cpop-t">Chọn quốc gia &amp; ngôn ngữ</div>
      <div className="cp-cpop-g">
        <div><div className="cp-cpop-h">Châu Á</div>{cols.asia}</div>
        <div><div className="cp-cpop-h">Châu Mỹ · Châu Âu · Úc</div>{cols.west}</div>
      </div>
    </div>
  );
}

/** Nút nổi: chat (Zalo / WhatsApp / Telegram) + gọi */
export async function ChatFab() {
  const cur = await getI18n();
  const site = await getSiteData();
  const chat = site.chat;
  const tel = cur.intl ? site.intlTel : site.vnTel;
  return (
    <div className="cp-fab" aria-label="Chat với chúng tôi">
      {chat.url && chat.url !== '#' && (
        <a className={'cp-fab-b cp-fab-' + chat.key} href={chat.url} target="_blank" rel="noopener" aria-label={'Chat với chúng tôi qua ' + chat.name}>
          <ChatIcon k={chat.key} s={26} />
        </a>
      )}
      {cur.intl && chat.key !== 'telegram' && site.tgUrl && (
        <a className="cp-fab-b cp-fab-telegram" href={site.tgUrl} target="_blank" rel="noopener" aria-label="Chat với chúng tôi qua Telegram">
          <ChatIcon k="telegram" s={24} />
        </a>
      )}
      {tel && (
        <a className="cp-fab-b cp-fab-tel" href={'tel:' + tel} aria-label="Gọi ngay">
          <PhoneIcon s={22} />
        </a>
      )}
    </div>
  );
}

/** Lời chào theo quốc gia (khách quốc tế) — bấm × để ẩn trong phiên */
export async function Greeting() {
  const cur = await getI18n();
  if (!cur.intl) return null;
  const g = (cur.settings.countries[cur.code]?.greeting ?? '').trim();
  if (!g) return null;
  return (
    <div className="cp-greet" id="cp-greet" role="status">
      <Flag code={cur.code} w={20} />
      <span>{g}</span>
      <button type="button" aria-label="Đóng" data-greet-close="">&times;</button>
    </div>
  );
}
