import 'server-only';
import { readContentJson, writeContentJson } from '../json-file';
import { loadSiteContent } from '../db';

/** Port footer.php (phần dữ liệu): content/footer_settings.json — Admin → "Cấu hình Footer" */
export const FOOTER_NETWORKS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', whatsapp: 'WhatsApp', telegram: 'Telegram', zalo: 'Zalo',
};
export const FOOTER_FILE = 'footer_settings.json';

export interface FooterLink { label: string; url: string }
export interface FooterSettings {
  brand: { name: string; slogan: string; show_iata: boolean; show_microchip: boolean };
  services: { title: string; links: FooterLink[] };
  policies: { title: string; links: FooterLink[] };
  contact: { address: string; maps_url: string; hotline: string; website: string };
  social: Record<string, { url: string; enabled: boolean }>;
  copyright: string;
}

export async function footerDefaults(): Promise<FooterSettings> {
  let site: any = {};
  try {
    site = await loadSiteContent();
  } catch {
    site = {};
  }
  const c = site.contact && typeof site.contact === 'object' ? site.contact : {};
  const s = site.social && typeof site.social === 'object' ? site.social : {};
  const soc = (k: string) => (typeof s[k] === 'string' && s[k] !== '#' ? s[k] : '');
  const urls: Record<string, string> = {
    facebook: soc('facebook'), instagram: soc('youtube'), tiktok: soc('tiktok'),
    whatsapp: soc('x'), telegram: soc('telegram'), zalo: soc('zalo'),
  };
  const social: FooterSettings['social'] = {};
  for (const k of Object.keys(FOOTER_NETWORKS)) social[k] = { url: urls[k], enabled: urls[k] !== '' };
  const domain = String(c.domain ?? 'chunorapet.com');
  return {
    brand: { name: 'Chunora PET', slogan: 'Chuỗi dịch vụ mua bán, chăm sóc và vận chuyển chó mèo đa quốc gia.', show_iata: true, show_microchip: true },
    services: {
      title: 'DỊCH VỤ',
      links: [
        { label: 'Mua bán chó mèo', url: '/mua-ban/' },
        { label: 'Vận chuyển đa quốc gia', url: '#van-chuyen' },
        { label: 'Chăm sóc tại store', url: '#cham-soc' },
      ],
    },
    policies: {
      title: 'CHÍNH SÁCH',
      links: [
        { label: 'Chính sách bảo hành sức khỏe', url: '/chinh-sach.php?trang=bao-hanh-suc-khoe' },
        { label: 'Chính sách đổi trả', url: '/chinh-sach.php?trang=doi-tra' },
        { label: 'Chính sách bảo mật thông tin', url: '/chinh-sach.php?trang=bao-mat' },
        { label: 'Điều khoản dịch vụ', url: '/chinh-sach.php?trang=dieu-khoan' },
      ],
    },
    contact: {
      address: String(c.address ?? '110/19 Ông Ích Khiêm, Phường Hoà Bình, Quận 11, TP. Hồ Chí Minh'),
      maps_url: String(c.maps_url ?? ''),
      hotline: String(c.hotline ?? '0569 551 512'),
      website: domain,
    },
    social,
    copyright: '© ' + new Date().getFullYear() + ' CHUNORA PET · ' + domain,
  };
}

/** Link hợp lệ: '' | #neo | /duong-dan | http(s):// | mailto: | tel: . Sai → ''. */
export function footerCleanUrl(v: unknown): string {
  let s = typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '';
  s = s.replace(/[\x00-\x1F\x7F\s]+/g, '');
  if (!s || s.length > 500) return '';
  return /^(#[\w-]*|\/(?!\/)[^"'<>]*|https?:\/\/[^"'<>]+|mailto:[^"'<>]+|tel:[+\d]+)$/i.test(s) ? s : '';
}

export function footerCleanText(v: unknown, max: number): string {
  let s = typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  s = s.replace(/\r/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return Array.from(s.trim()).slice(0, max).join('');
}

function cleanLinks(raw: unknown, fallback: FooterLink[]): FooterLink[] {
  if (!Array.isArray(raw)) return fallback;
  const out: FooterLink[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const label = footerCleanText((row as any).label ?? '', 80);
    if (!label) continue;
    out.push({ label, url: footerCleanUrl((row as any).url ?? '') });
  }
  return out.slice(0, 20);
}

export function footerNormalize(raw: any, d: FooterSettings): FooterSettings {
  raw = raw && typeof raw === 'object' ? raw : {};
  const obj = (x: any) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const b = obj(raw.brand), sv = obj(raw.services), po = obj(raw.policies), ct = obj(raw.contact), so = obj(raw.social);
  const social: FooterSettings['social'] = {};
  for (const k of Object.keys(FOOTER_NETWORKS)) {
    const row = obj(so[k]);
    social[k] = {
      url: 'url' in row ? footerCleanUrl(row.url) : d.social[k].url,
      enabled: 'enabled' in row ? !!row.enabled : d.social[k].enabled,
    };
  }
  const text = (src: any, k: string, fb: string, max: number) => (k in src ? footerCleanText(src[k], max) : fb);
  return {
    brand: {
      name: text(b, 'name', d.brand.name, 60),
      slogan: text(b, 'slogan', d.brand.slogan, 200),
      show_iata: 'show_iata' in b ? !!b.show_iata : d.brand.show_iata,
      show_microchip: 'show_microchip' in b ? !!b.show_microchip : d.brand.show_microchip,
    },
    services: { title: text(sv, 'title', d.services.title, 40), links: cleanLinks(sv.links, d.services.links) },
    policies: {
      title: text(po, 'title', d.policies.title, 40),
      // 4 chính sách mặc định: nếu admin chưa nhập link thì tự trỏ tới trang chính sách
      links: cleanLinks(po.links, d.policies.links).map((l) => {
        if (l.url === '') for (const dl of d.policies.links) if (dl.label === l.label) l.url = dl.url;
        return l;
      }),
    },
    contact: {
      address: text(ct, 'address', d.contact.address, 250),
      maps_url: 'maps_url' in ct ? footerCleanUrl(ct.maps_url) : d.contact.maps_url,
      hotline: text(ct, 'hotline', d.contact.hotline, 40),
      website: text(ct, 'website', d.contact.website, 100),
    },
    social,
    copyright: text(raw, 'copyright', d.copyright, 300),
  };
}

export async function footerLoad(): Promise<FooterSettings> {
  return footerNormalize(readContentJson(FOOTER_FILE), await footerDefaults());
}

export function footerSave(s: FooterSettings): boolean {
  return writeContentJson(FOOTER_FILE, s);
}
