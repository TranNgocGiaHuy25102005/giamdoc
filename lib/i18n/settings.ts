import 'server-only';
import { readContentJson, writeContentJson } from '../json-file';
import { COUNTRIES } from './countries';

export type ChannelPref = 'auto' | 'zalo' | 'whatsapp' | 'telegram';
export interface MlSettings {
  intl_phone: string;
  intl_phone_tel: string;
  whatsapp_url: string;
  telegram_url: string;
  engine: 'free' | 'claude' | 'openai' | 'gemini';
  claude_model: string;
  openai_model: string;
  gemini_model: string;
  countries: Record<string, { enabled: boolean; greeting: string; channel: ChannelPref }>;
}

export const SETTINGS_FILE = 'multilang_settings.json';

export function settingsDefaults(): MlSettings {
  const c: MlSettings['countries'] = {};
  for (const [code, info] of Object.entries(COUNTRIES)) c[code] = { enabled: true, greeting: info[5], channel: 'auto' };
  return {
    intl_phone: '(+84) 396 24 1612',
    intl_phone_tel: '+84396241612',
    whatsapp_url: 'https://wa.me/84396241612',
    telegram_url: '',
    engine: 'free',
    claude_model: 'claude-sonnet-5-5',
    openai_model: 'gpt-4o-mini',
    gemini_model: 'gemini-2.5-flash',
    countries: c,
  };
}

export function cleanUrl(u: unknown): string {
  const s = String(u ?? '').trim();
  return /^https?:\/\/[^\s"<>]+$/i.test(s) ? s : '';
}

const txt = (v: unknown, max: number) => Array.from(String(v ?? '').replace(/<[^>]*>/g, '').trim()).slice(0, max).join('');

/** Ghép dữ liệu lưu với mặc định, làm sạch (port i18n_settings). */
export function normalizeSettings(input: any): MlSettings {
  const d = settingsDefaults();
  const inp = input && typeof input === 'object' ? input : {};
  const out: MlSettings = JSON.parse(JSON.stringify(d));
  if ('intl_phone' in inp) out.intl_phone = txt(inp.intl_phone, 40) || d.intl_phone;
  if ('intl_phone_tel' in inp) {
    const t = String(inp.intl_phone_tel ?? '').replace(/[^0-9+]/g, '');
    out.intl_phone_tel = t || d.intl_phone_tel;
  }
  if ('whatsapp_url' in inp) out.whatsapp_url = cleanUrl(inp.whatsapp_url) || d.whatsapp_url;
  if ('telegram_url' in inp) out.telegram_url = cleanUrl(inp.telegram_url);
  if (['free', 'claude', 'openai', 'gemini'].includes(inp.engine)) out.engine = inp.engine;
  for (const k of ['claude_model', 'openai_model', 'gemini_model'] as const) {
    if (typeof inp[k] === 'string' && /^[A-Za-z0-9._\-:]{3,60}$/.test(inp[k])) out[k] = inp[k];
  }
  for (const [code, def] of Object.entries(d.countries)) {
    const c = inp.countries && typeof inp.countries[code] === 'object' ? inp.countries[code] : {};
    const row = { ...def };
    if ('enabled' in c) row.enabled = !!c.enabled;
    if ('greeting' in c) row.greeting = txt(c.greeting, 200);
    if (['auto', 'zalo', 'whatsapp', 'telegram'].includes(c.channel)) row.channel = c.channel;
    out.countries[code] = row;
  }
  out.countries.VN.enabled = true; // Việt Nam luôn bật
  return out;
}

export function loadSettings(): MlSettings {
  return normalizeSettings(readContentJson(SETTINGS_FILE));
}

export function saveSettings(s: MlSettings): boolean {
  return writeContentJson(SETTINGS_FILE, s);
}
