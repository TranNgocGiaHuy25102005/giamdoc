import 'server-only';
import { readContentJson, readContentJsonShared, writeContentJson } from '../json-file';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR } from '../config';
import { decodeEntities, escapeHtml } from '../text';
import { COUNTRIES, EXTRA_PHRASES, LANGS, hasVi, norm } from './countries';
import { loadPhrases, savePhrases } from './phrases';
import { loadSettings, normalizeSettings, saveSettings } from './settings';
import { extractHtml } from './walk-html';
import { petsLoadSafe } from '../stores/pets';
import { newsLoad } from '../stores/news';

/**
 * Quản trị Đa Quốc Gia & Dịch Thuật — port i18n-admin.php (chỉ dùng phía server, từ trang /admin).
 *  - mlCollect: nhận HTML tiếng Việt của từng trang (trình duyệt admin tải ?lang_src=1) → gom các câu chữ cần dịch
 *    (trang React nhúng sẵn danh sách khoá trong <script id="cp-i18n-keys">; không có thì quét HTML như PHP)
 *  - mlTranslateBatch: dịch từng lô câu còn thiếu cho 1 ngôn ngữ (GTX miễn phí / Claude / OpenAI / Gemini)
 *  - lưu / sửa tay bản dịch: content/lang/{ngôn ngữ}/phrases.json
 */

/* ---------------------------------------------------------------- khoá API */

export function mlSecretsPath(): string {
  return path.join(CONTENT_DIR, 'multilang_secrets.json');
}

const SECRETS_FILE = 'multilang_secrets.json';
const UNITS_FILE = 'lang/_source_units.json';

function readJsonObj(_p: string): Record<string, unknown> {
  const j = readContentJson(SECRETS_FILE);
  return j && typeof j === 'object' && !Array.isArray(j) ? j : {};
}

/** Khoá API: ưu tiên biến môi trường (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY — thay cho config.php), sau đó file bí mật do admin nhập. */
export function mlSecret(name: 'anthropic' | 'openai' | 'gemini'): string {
  const env = process.env[name.toUpperCase() + '_API_KEY'];
  if (env && env.trim() !== '') return env.trim();
  const j = readJsonObj(mlSecretsPath());
  const v = j[name + '_api_key'];
  if (typeof v === 'string' && v !== '') return v.trim();
  return '';
}

export function mlSaveSecret(name: string, value: string): boolean {
  const p = mlSecretsPath();
  const j = readJsonObj(p);
  if (value === '') delete j[name + '_api_key'];
  else j[name + '_api_key'] = value;
  return writeContentJson(SECRETS_FILE, j);
}

/* ---------------------------------------------------------------- trang cần quét */

/** Các trang cố định (giống ml_pages() của PHP, theo URL mới) */
export function mlPages(): Record<string, string> {
  return {
    '/': 'Trang chủ',
    '/ve-chunora': 'Về Chunora',
    '/van-chuyen-quoc-te': 'Vận chuyển quốc tế',
    '/cham-soc-tai-store': 'Chăm sóc tại Store',
    '/mua-ban': 'Mua bán chó mèo',
    '/tin-tuc': 'Tin tức',
    '/chinh-sach?trang=bao-hanh-suc-khoe': 'Chính sách bảo hành sức khỏe',
    '/chinh-sach?trang=doi-tra': 'Chính sách đổi trả',
    '/chinh-sach?trang=bao-mat': 'Chính sách bảo mật',
    '/chinh-sach?trang=dieu-khoan': 'Điều khoản dịch vụ',
    '/cam-on': 'Cảm ơn',
  };
}

/** Trang cố định + trang chi tiết từng bé (/mua-ban/chi-tiet?p=…) + từng bài viết đã đăng (/tin-tuc?slug=…) */
export async function mlPagesAll(): Promise<Record<string, string>> {
  const out = mlPages();
  try {
    for (const p of await petsLoadSafe()) {
      if (p.slug) out['/mua-ban/chi-tiet?p=' + encodeURIComponent(p.slug)] = p.name || p.breed || p.slug;
    }
  } catch {}
  try {
    for (const a of newsLoad()) {
      if (a.status === 'published' && a.slug) out['/tin-tuc?slug=' + encodeURIComponent(a.slug)] = a.title;
    }
  } catch {}
  return out;
}

/* ---------------------------------------------------------------- kho câu gốc */

export function mlUnitsPath(): string {
  return path.join(CONTENT_DIR, 'lang', '_source_units.json');
}

export function mlUnits(): string[] {
  const j = readContentJsonShared(UNITS_FILE);
  if (Array.isArray(j)) return j.filter((x): x is string => typeof x === 'string');
  if (j && typeof j === 'object') return Object.values(j).filter((x): x is string => typeof x === 'string');
  return [];
}

export function mlUnitsSave(units: string[]): boolean {
  return writeContentJson(UNITS_FILE, [...units].sort());
}

/** Khoá câu chữ trong HTML trang: ưu tiên JSON nhúng ở <script id="cp-i18n-keys"> (trang React, ?lang_src=1), không có → quét HTML */
export function mlKeysFromHtml(html: string): string[] {
  const set = new Set<string>();
  let found = false;
  for (const m of html.matchAll(/<script\b[^>]*\bid\s*=\s*["']?cp-i18n-keys["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const arr: unknown = JSON.parse(m[1].trim());
      if (!Array.isArray(arr)) continue;
      found = true;
      for (const k of arr) if (typeof k === 'string' && k !== '' && Array.from(k).length <= 1500) set.add(k);
    } catch {}
  }
  return found ? [...set] : extractHtml(html);
}

/** Gom câu từ HTML 1 trang (+ câu cố định). Trả [tổng số câu, số câu mới] */
export function mlCollect(html: string, reset = false): [number, number] {
  const have = new Set<string>(reset ? [] : mlUnits());
  let added = 0;
  const add = (k: string) => {
    if (!have.has(k)) {
      have.add(k);
      added++;
    }
  };
  for (const k of mlKeysFromHtml(html)) add(k);
  for (const p of EXTRA_PHRASES) add(norm(escapeHtml(p)));
  // chữ trong lời chào / tên quốc gia
  for (const info of Object.values(COUNTRIES)) {
    const k = norm(escapeHtml(info[0]));
    if (hasVi(k)) add(k);
  }
  mlUnitsSave([...have]);
  return [have.size, added];
}

/** Các câu chưa có bản dịch cho ngôn ngữ lang */
export function mlMissing(lang: string): string[] {
  const dict = loadPhrases(lang);
  return mlUnits().filter((u) => !(u in dict) || String(dict[u] ?? '').trim() === '');
}

/* ---------------------------------------------------------------- bảo vệ thẻ HTML / thương hiệu */

export type TokenMap = Map<string, string>;

/** Tách thẻ & thương hiệu thành token để máy dịch không làm hỏng. Trả [chuỗi văn bản, bảng token] */
export function mlProtect(html: string): [string, TokenMap] {
  const map: TokenMap = new Map();
  let i = 0;
  let text = html.replace(/<[^>]+>/g, (m) => {
    const t = 'QZT' + i++ + 'QZ';
    map.set(t, m);
    return t;
  });
  text = decodeEntities(text);
  text = text.replace(/CHUNORA\s+PET|Chunora\s+PET|Chunora|CHUNORA|Zalo|WhatsApp|Telegram|\(\+84\)\s*396\s*24\s*1612|0569\s*551\s*512/gu, (m) => {
    const t = 'QZB' + i++ + 'QZ';
    map.set(t, m);
    return t;
  });
  return [text, map];
}

/** Khôi phục token; thoát ký tự HTML ở phần chữ. Trả null nếu mất token (bản dịch hỏng). */
export function mlRestore(translated: string, map: TokenMap): string | null {
  translated = translated.replace(/Q\s*Z\s*([TB])\s*(\d+)\s*Q\s*Z/gi, (_m, a: string, d: string) => 'QZ' + a.toUpperCase() + d + 'QZ');
  for (const t of map.keys()) if (!translated.includes(t)) return null;
  // thoát phần chữ (ngoài token) rồi mới thay token bằng thẻ gốc
  let out = '';
  for (const p of translated.split(/(QZ[TB]\d+QZ)/).filter((x) => x !== '')) {
    out += map.has(p) ? (map.get(p) as string) : escapeHtml(p);
  }
  return norm(out);
}

/* ---------------------------------------------------------------- động cơ dịch */

interface ErrBox { err: string }
type Texts = Map<string, string>;
type Results = Map<string, string | null>;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const short = (s: string, n: number) => Array.from(s).slice(0, n).join('');

/** GTX miễn phí — dịch song song (tối đa 2 yêu cầu cùng lúc). Trả [khoá => bản dịch|null] */
async function engineFree(texts: Texts, lang: string, eb: ErrBox): Promise<Results> {
  const res: Results = new Map();
  for (const k of texts.keys()) res.set(k, null);
  const queue = [...texts.keys()];
  const worker = async () => {
    while (queue.length) {
      const k = queue.shift() as string;
      await sleep(120);
      let body = '';
      try {
        const r = await fetch('https://translate.googleapis.com/translate_a/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (ChunoraPET translator)' },
          body: new URLSearchParams({ client: 'gtx', sl: 'vi', tl: lang, dt: 't', q: texts.get(k) as string }).toString(),
          signal: AbortSignal.timeout(20000),
          cache: 'no-store',
        });
        body = await r.text();
        if (body === '') eb.err = 'fetch: phản hồi rỗng';
        else if (r.status >= 400) eb.err = 'HTTP ' + r.status + ' từ dịch vụ dịch (có thể bị giới hạn tốc độ)';
      } catch (e) {
        eb.err = 'fetch: ' + ((e as Error).message || 'lỗi kết nối');
        continue;
      }
      let j: unknown = null;
      try {
        j = JSON.parse(body);
      } catch {
        j = null;
      }
      if ((j === null || typeof j !== 'object') && body !== '' && !eb.err) {
        eb.err =
          'Google trả về trang không phải dữ liệu dịch (thường là bị giới hạn tốc độ / chặn IP tạm thời): ' +
          short(body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(), 90);
      }
      if (Array.isArray(j) && Array.isArray(j[0])) {
        let s = '';
        for (const seg of j[0] as unknown[]) s += Array.isArray(seg) && seg[0] != null ? String(seg[0]) : '';
        res.set(k, s !== '' ? s : null);
      }
    }
  };
  await Promise.all([worker(), worker()]);
  return res;
}

async function httpJson(url: string, headers: Record<string, string>, payload: unknown): Promise<any | null> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
      cache: 'no-store',
    });
    const j = JSON.parse(await r.text());
    return j && typeof j === 'object' ? j : null;
  } catch {
    return null;
  }
}

export function mlLlmPrompt(lang: string): string {
  const name = LANGS[lang] ?? lang;
  return (
    'Bạn là biên dịch viên chuyên ngành vận chuyển thú cưng quốc tế và thú y (kiểm dịch, vaccine, microchip, giấy tờ xuất nhập cảnh). ' +
    `Dịch từng chuỗi trong mảng JSON từ tiếng Việt sang ${name} (${lang}), giọng văn tự nhiên, chuyên nghiệp, thân thiện. ` +
    'QUY TẮC: giữ nguyên các token dạng QZT0QZ, QZB1QZ (không dịch, không đổi chỗ vô nghĩa, không bỏ sót); giữ nguyên số, ký hiệu, URL; ' +
    "tên thương hiệu 'Chunora PET' giữ nguyên. Chỉ trả về MỘT mảng JSON các chuỗi đã dịch, cùng số phần tử và cùng thứ tự, không kèm giải thích."
  );
}

export function mlParseJsonArray(s: string): unknown[] | null {
  s = s.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  const tryParse = (x: string): unknown => {
    try {
      return JSON.parse(x);
    } catch {
      return null;
    }
  };
  let j = tryParse(s);
  if (!j || typeof j !== 'object') {
    const a = s.indexOf('[');
    const b = s.lastIndexOf(']');
    if (a !== -1 && b !== -1 && b > a) j = tryParse(s.slice(a, b + 1));
  }
  if (Array.isArray(j)) return j;
  if (j && typeof j === 'object') return Object.values(j);
  return null;
}

async function engineLlm(texts: Texts, lang: string, engine: string, eb: ErrBox): Promise<Results> {
  const res: Results = new Map();
  for (const k of texts.keys()) res.set(k, null);
  const keys = [...texts.keys()];
  const vals = [...texts.values()];
  const set = loadSettings();
  let out = '';
  if (engine === 'claude') {
    const key = mlSecret('anthropic');
    if (key === '') return res;
    const r = await httpJson('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, {
      model: set.claude_model,
      max_tokens: 8000,
      system: mlLlmPrompt(lang),
      messages: [{ role: 'user', content: JSON.stringify(vals) }],
    });
    out = String(r?.content?.[0]?.text ?? '');
  } else if (engine === 'gemini') {
    const key = mlSecret('gemini');
    if (key === '') return res;
    const r = await httpJson(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(set.gemini_model) + ':generateContent',
      { 'x-goog-api-key': key },
      {
        contents: [{ role: 'user', parts: [{ text: mlLlmPrompt(lang) + '\n\n' + JSON.stringify(vals) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      },
    );
    out = String(r?.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
    if (out === '' && r?.error?.message) eb.err = 'Gemini: ' + short(String(r.error.message), 140);
  } else {
    const key = mlSecret('openai');
    if (key === '') return res;
    const r = await httpJson('https://api.openai.com/v1/chat/completions', { Authorization: 'Bearer ' + key }, {
      model: set.openai_model,
      messages: [
        { role: 'system', content: mlLlmPrompt(lang) },
        { role: 'user', content: JSON.stringify(vals) },
      ],
    });
    out = String(r?.choices?.[0]?.message?.content ?? '');
  }
  const arr = mlParseJsonArray(out);
  if (arr && arr.length && arr.length === keys.length) {
    keys.forEach((k, i) => res.set(k, typeof arr[i] === 'string' ? (arr[i] as string) : null));
  }
  return res;
}

/**
 * Dịch 1 lô câu (khoá = câu gốc đã chuẩn hoá HTML). Trả [dịch được, thất bại, thông báo lỗi].
 * Lưu ngay vào content/lang/{lang}/phrases.json.
 */
export async function mlTranslateBatch(lang: string, batch: string[]): Promise<[number, number, string]> {
  if (!(lang in LANGS) || lang === 'vi') return [0, batch.length, 'Ngôn ngữ không hợp lệ'];
  const engine = loadSettings().engine;
  const eb: ErrBox = { err: '' };
  const prot: TokenMap[] = [];
  const input: Texts = new Map();
  batch.forEach((src, i) => {
    const [t, map] = mlProtect(src);
    prot[i] = map;
    input.set(String(i), t);
  });
  const mock = !!process.env.I18N_TEST_MOCK;
  let out: Results;
  if (mock) {
    out = new Map();
    for (const [i, t] of input) out.set(i, '[' + lang + '] ' + t);
  } else if (engine === 'free') {
    out = await engineFree(input, lang, eb);
  } else {
    out = await engineLlm(input, lang, engine, eb);
    // LLM lỗi cả lô → thử phương án miễn phí cho các câu thiếu
    const miss: Texts = new Map();
    for (const [i, v] of out) if (v === null) miss.set(i, input.get(i) as string);
    if (miss.size) {
      const sub = await engineFree(miss, lang, eb);
      for (const [i, v] of sub) out.set(i, v);
    }
  }
  // Câu bị máy dịch làm mất thẻ (<br>, <em>…) → dịch lại từng đoạn giữa các thẻ rồi ghép với thẻ gốc
  const retry: number[] = [];
  batch.forEach((_src, i) => {
    const v = out.get(String(i)) ?? null;
    if (v === null || mlRestore(v, prot[i]) === null) retry.push(i);
  });
  if (retry.length && !mock) {
    const segs: Texts = new Map();
    const segIdx = new Map<number, string[]>();
    for (const i of retry) {
      const parts = (input.get(String(i)) as string).split(/(QZT\d+QZ)/).filter((x) => x !== '');
      parts.forEach((part, pi) => {
        if (!/^QZT\d+QZ$/.test(part) && part.trim() !== '' && /\p{L}/u.test(part)) segs.set(i + ':' + pi, part);
      });
      segIdx.set(i, parts);
    }
    const segOut: Results = segs.size ? (engine === 'free' ? await engineFree(segs, lang, eb) : await engineLlm(segs, lang, engine, eb)) : new Map();
    for (const [i, parts] of segIdx) {
      let rebuilt = '';
      let good = true;
      for (let pi = 0; pi < parts.length; pi++) {
        const part = parts[pi];
        const sk = i + ':' + pi;
        if (segs.has(sk)) {
          const t = segOut.get(sk) ?? null;
          if (t === null) {
            good = false;
            break;
          }
          const lead = part.match(/^\s+/u)?.[0] ?? '';
          const trail = part.match(/\s+$/u)?.[0] ?? '';
          rebuilt += lead + t.trim() + trail;
        } else rebuilt += part;
      }
      if (good) out.set(String(i), rebuilt);
    }
  }
  const dict: Record<string, string> = { ...loadPhrases(lang) };
  let ok = 0;
  let bad = 0;
  batch.forEach((src, i) => {
    const v = out.get(String(i)) ?? null;
    const r = v === null ? null : mlRestore(v, prot[i]);
    if (r === null || r === '') {
      bad++;
      return;
    }
    dict[src] = r;
    ok++;
  });
  let err = '';
  if (ok > 0 && !savePhrases(lang, dict)) {
    return [0, batch.length, 'Không ghi được content/lang/' + lang + '/phrases.json — hãy cấp quyền Modify cho thư mục content.'];
  }
  if (ok === 0 && bad > 0) {
    err =
      (engine === 'free' && !mock ? 'Không kết nối được dịch vụ dịch miễn phí.' : 'Dịch vụ dịch không phản hồi — kiểm tra khoá API.') +
      (eb.err !== '' ? ' [' + eb.err + ']' : '');
  }
  return [ok, bad, err];
}

/** Thống kê cho giao diện: { lang: [có, tổng] } */
export function mlStats(): Record<string, [number, number]> {
  const units = mlUnits();
  const total = units.length;
  const out: Record<string, [number, number]> = {};
  for (const lang of Object.keys(LANGS)) {
    if (lang === 'vi') continue;
    const d = loadPhrases(lang);
    let have = 0;
    for (const u of units) if (u in d && d[u] != null && d[u] !== '') have++;
    out[lang] = [have, total];
  }
  return out;
}

/* ---------------------------------------------------------------- POST: form cấu hình */

/** empty() của PHP cho giá trị form */
const phpEmpty = (v: unknown) => v === undefined || v === null || v === '' || v === '0' || v === false;
const sv = (v: unknown, def = ''): string => (typeof v === 'string' ? v : v === undefined || v === null ? def : '');

/** Lưu cấu hình từ form ml_save. Trả null nếu ổn, hoặc thông báo lỗi. */
export function mlHandleSave(post: Record<string, any>): string | null {
  const cur = loadSettings();
  const countries: Record<string, { enabled: boolean; greeting: string; channel: string }> = {};
  const c = post.c && typeof post.c === 'object' ? post.c : {};
  for (const code of Object.keys(COUNTRIES)) {
    const row = c[code] && typeof c[code] === 'object' && !(c[code] instanceof File) ? c[code] : {};
    countries[code] = {
      enabled: code === 'VN' ? true : !phpEmpty(row.enabled),
      greeting: sv(row.greeting),
      channel: sv(row.channel, 'auto'),
    };
  }
  const input = {
    intl_phone: sv(post.intl_phone),
    intl_phone_tel: sv(post.intl_phone_tel),
    whatsapp_url: sv(post.whatsapp_url),
    telegram_url: sv(post.telegram_url),
    engine: sv(post.engine, 'free'),
    claude_model: sv(post.claude_model, cur.claude_model),
    openai_model: sv(post.openai_model, cur.openai_model),
    gemini_model: sv(post.gemini_model, cur.gemini_model),
    countries,
  };
  if (!saveSettings(normalizeSettings(input))) {
    return 'Không ghi được content/multilang_settings.json. Hãy cấp quyền Modify cho thư mục content.';
  }
  for (const [name, field] of [['anthropic', 'claude_key'], ['openai', 'openai_key'], ['gemini', 'gemini_key']] as const) {
    const v = sv(post[field]).trim();
    if (!phpEmpty(post[field + '_clear'])) {
      mlSaveSecret(name, '');
    } else if (v !== '') {
      if (!/^[A-Za-z0-9._\-]{10,300}$/.test(v) || !mlSaveSecret(name, v)) {
        return 'Khoá API không hợp lệ hoặc không ghi được content/multilang_secrets.json.';
      }
    }
  }
  return null;
}

const ALLOWED_TAGS = new Set(['em', 'strong', 'b', 'i', 'u', 'small', 'br', 'sub', 'sup', 'mark', 'abbr', 'wbr', 's', 'del', 'ins']);

/** strip_tags($v, '<em><strong>…') — giữ các thẻ inline cho phép, bỏ mọi thẻ / chú thích khác */
function stripTagsAllow(v: string): string {
  return v
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*(?:>|$)/g, (m, tag: string) => (ALLOWED_TAGS.has(tag.toLowerCase()) ? m : ''))
    .replace(/<[!?][^>]*(?:>|$)/g, '');
}

/** Lưu bản dịch sửa tay (1 ngôn ngữ). rows: [{k: câu gốc, v: bản dịch}] */
export function mlHandlePhrases(lang: string, rows: { k?: unknown; v?: unknown }[]): string | null {
  if (!(lang in LANGS) || lang === 'vi') return 'Ngôn ngữ không hợp lệ.';
  const units = new Set(mlUnits());
  const dict: Record<string, string> = { ...loadPhrases(lang) };
  for (const r of rows) {
    const k = sv(r.k);
    let v = sv(r.v).trim();
    if (!units.has(k)) continue;
    if (v === '') {
      delete dict[k];
      continue;
    }
    // chỉ cho phép thẻ inline đơn giản — chống chèn script
    v = stripTagsAllow(v);
    v = v.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    dict[k] = norm(v);
  }
  return savePhrases(lang, dict) ? null : 'Không ghi được file bản dịch. Hãy kiểm tra quyền thư mục content.';
}
