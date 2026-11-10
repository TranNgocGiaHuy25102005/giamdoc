import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { COUNTRIES, VN_PLACEHOLDER } from './countries';
import { loadSettings, type MlSettings } from './settings';
import { syncContent } from '../json-file';

export type ChatKey = 'zalo' | 'whatsapp' | 'telegram';

export interface I18nCurrent {
  code: string;
  lang: string;
  src: boolean; // ?lang_src=1 — admin quét nội dung gốc
  intl: boolean;
  channel: ChatKey;
  dial: string;
  placeholder: string;
  name: string;
  /** đường dẫn + query hiện tại (để tạo link đổi quốc gia) */
  path: string;
  settings: MlSettings;
}

/** Port i18n_boot() + i18n_current(): xác định quốc gia / ngôn ngữ cho request hiện tại. */
export const getI18n = cache(async (): Promise<I18nCurrent> => {
  await syncContent();
  const settings = loadSettings();
  let code = 'VN';
  let src = false;
  let path = '/';
  try {
    const h = await headers();
    const c = await cookies();
    src = h.get('x-cp-src') === '1';
    path = h.get('x-cp-path') ?? '/';
    const enabled = (x: string) => !!COUNTRIES[x] && !!settings.countries[x]?.enabled;
    if (!src) {
      const req = (h.get('x-cp-country') ?? '').toUpperCase();
      const ck = (c.get('cp_country')?.value ?? '').slice(0, 2).toUpperCase();
      if (req && enabled(req)) code = req;
      else if (ck && enabled(ck)) code = ck;
    }
  } catch {
    code = 'VN';
  }
  const info = COUNTRIES[code];
  const intl = code !== 'VN';
  const pref = settings.countries[code]?.channel ?? 'auto';
  let chan: ChatKey = pref === 'auto' ? (intl ? 'whatsapp' : 'zalo') : pref;
  if (chan === 'telegram' && !settings.telegram_url) chan = intl ? 'whatsapp' : 'zalo';
  return {
    code,
    lang: info[1],
    src,
    intl,
    channel: chan,
    dial: info[2],
    placeholder: intl ? info[4] : VN_PLACEHOLDER,
    name: info[0],
    path,
    settings,
  };
});

/** URL chuyển quốc gia: giữ nguyên đường dẫn + tham số, chỉ đổi ?country=XX */
export function switchUrl(path: string, code: string): string {
  const u = new URL(path, 'http://x');
  u.searchParams.delete('lang_src');
  u.searchParams.set('country', code);
  return u.pathname + '?' + u.searchParams.toString();
}
