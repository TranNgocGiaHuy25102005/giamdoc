import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR } from '../config';
import { DB_MODE, readContentJsonShared, writeContentJson } from '../json-file';
import { LANGS } from './countries';

/** Bản dịch đã lưu: content/lang/{lang}/phrases.json — cặp "câu tiếng Việt" → "bản dịch" */
const cache = new Map<string, { mtime: number; data: Record<string, string> }>();

export const phrasesFile = (lang: string) => `lang/${lang}/phrases.json`;
export function phrasesPath(lang: string) {
  return path.join(CONTENT_DIR, 'lang', lang, 'phrases.json');
}

export function loadPhrases(lang: string): Record<string, string> {
  if (!(lang in LANGS) || lang === 'vi') return {};
  if (DB_MODE) {
    const j = readContentJsonShared(phrasesFile(lang));
    return j && typeof j === 'object' && !Array.isArray(j) ? j : {};
  }
  const p = phrasesPath(lang);
  try {
    const mtime = fs.statSync(p).mtimeMs;
    const hit = cache.get(lang);
    if (hit && hit.mtime === mtime) return hit.data;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const data = j && typeof j === 'object' && !Array.isArray(j) ? j : {};
    cache.set(lang, { mtime, data });
    return data;
  } catch {
    return {};
  }
}

export function savePhrases(lang: string, phrases: Record<string, string>): boolean {
  if (!(lang in LANGS) || lang === 'vi') return false;
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(phrases).sort()) sorted[k] = phrases[k];
  cache.delete(lang);
  return writeContentJson(phrasesFile(lang), sorted);
}
