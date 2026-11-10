import 'server-only';
import { cache } from 'react';
import { loadSiteContent, type SiteContent } from './db';
import { readContentJson } from './json-file';
import { safeExternalUrl, telOf } from './text';
import { getI18n, type ChatKey } from './i18n/current';

export interface Chat { name: string; url: string; key: ChatKey }

export interface SiteData {
  content: SiteContent;
  contact: { hotline: string; hotline_tel: string; address: string; address_short: string; domain: string; maps_url: string };
  social: Record<string, string>;
  chat: Chat;
  cta: { chat_name: string; chat_url: string; phone_placeholder: string; channel: ChatKey };
  /** số / link gốc Việt Nam (dùng cho việc dịch số điện thoại & nút nổi) */
  vnHotline: string;
  vnTel: string;
  intlPhone: string;
  intlTel: string;
  tgUrl: string;
  zaloUrl: string;
  waUrl: string;
}

const defaults: SiteContent = {
  seo: { title: 'CHUNORA PET', description: '' },
  contact: { hotline: '0569 551 512', address: '', address_short: '', domain: 'chunorapet.com', maps_url: '#' },
  social: { youtube: '', tiktok: '', facebook: '', x: '', telegram: '', zalo: '' },
};

function deepMerge(a: any, b: any): any {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return b === undefined ? a : b;
  const out: any = Array.isArray(a) ? [...a] : { ...(a ?? {}) };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(out[k], v) : v;
  return out;
}

/**
 * Port site_chrome() phần dữ liệu + i18n_apply_data():
 * nội dung chung từ MySQL, hotline / kênh chat / placeholder SĐT theo quốc gia khách chọn.
 */
export const getSiteData = cache(async (): Promise<SiteData> => {
  let loaded: SiteContent = {};
  try {
    loaded = await loadSiteContent();
  } catch (e) {
    console.error('[site] Không đọc được nội dung MySQL:', (e as Error).message);
  }
  // Dữ liệu khởi tạo content/site.json làm nền: MySQL lỗi thì trang vẫn hiển thị được
  const content = deepMerge(deepMerge(defaults, readContentJson('site.json') ?? {}), loaded);
  const contact = { ...content.contact };
  contact.hotline = String(contact.hotline ?? '');
  contact.hotline_tel = telOf(contact.hotline);
  contact.maps_url = safeExternalUrl(String(contact.maps_url ?? ''));
  const social: Record<string, string> = {};
  for (const [k, v] of Object.entries(content.social ?? {})) social[k] = v ? safeExternalUrl(String(v)) : '#';

  const cur = await getI18n();
  const set = cur.settings;
  const vnHotline = contact.hotline;
  const vnTel = contact.hotline_tel;
  const zalo = social.zalo || '#';
  let tgUrl = set.telegram_url || String(content.social?.telegram ?? '');
  if (!/^https?:\/\//i.test(tgUrl)) tgUrl = '';
  if (cur.intl) {
    contact.hotline = set.intl_phone;
    contact.hotline_tel = set.intl_phone_tel;
  }
  let chat: Chat = { name: 'Zalo', url: zalo, key: 'zalo' };
  if (cur.channel === 'whatsapp') chat = { name: 'WhatsApp', url: set.whatsapp_url, key: 'whatsapp' };
  else if (cur.channel === 'telegram') chat = { name: 'Telegram', url: tgUrl, key: 'telegram' };

  return {
    content,
    contact,
    social,
    chat,
    cta: { chat_name: chat.name, chat_url: chat.url, phone_placeholder: cur.placeholder, channel: cur.channel },
    vnHotline,
    vnTel,
    intlPhone: set.intl_phone,
    intlTel: set.intl_phone_tel,
    tgUrl,
    zaloUrl: zalo,
    waUrl: set.whatsapp_url,
  };
});
