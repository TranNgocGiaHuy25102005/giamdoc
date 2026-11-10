import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { ROOT } from '../config';
import { BLOB_UPLOADS } from '../json-file';

/**
 * Port media-convert.php: lưu tệp tải lên với tên ngẫu nhiên, tự chuyển đổi
 *  - Ảnh bất kỳ → .webp (dùng sharp, dự phòng ffmpeg)   - Video → .webm (cần ffmpeg)
 * Nếu không chuyển được, giữ tệp gốc khi là định dạng web phổ biến.
 * Biến môi trường: FFMPEG_PATH, MEDIA_WEBP_QUALITY (82), MEDIA_VIDEO_CRF (33), MEDIA_VIDEO_MAX_HEIGHT (1080), MEDIA_VIDEO_TIMEOUT (600)
 */

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;
export const UPLOAD_DIR = path.join(ROOT, 'public', 'images', 'uploads');

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/avif', 'image/tiff', 'image/x-icon', 'image/heic', 'image/heif'];
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/x-ms-wmv', 'video/3gpp', 'video/x-flv', 'video/ogg', 'video/mp2t'];

const num = (v: string | undefined, d: number, lo: number, hi: number) => {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
};

/** Nhận dạng MIME theo "magic bytes" (thay finfo của PHP) */
export function detectMime(b: Buffer): string {
  const hex = b.subarray(0, 16).toString('hex');
  const ascii = b.subarray(0, 16).toString('latin1');
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('89504e470d0a1a0a')) return 'image/png';
  if (ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')) return 'image/gif';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'AVI ') return 'video/x-msvideo';
  if (ascii.startsWith('BM')) return 'image/bmp';
  if (hex.startsWith('49492a00') || hex.startsWith('4d4d002a')) return 'image/tiff';
  if (hex.startsWith('00000100')) return 'image/x-icon';
  if (hex.startsWith('1a45dfa3')) return b.includes(Buffer.from('webm')) ? 'video/webm' : 'video/x-matroska';
  if (hex.startsWith('3026b2758e66cf11')) return 'video/x-ms-wmv';
  if (ascii.startsWith('FLV')) return 'video/x-flv';
  if (ascii.startsWith('OggS')) return 'video/ogg';
  if (hex.startsWith('000001ba') || hex.startsWith('000001b3')) return 'video/mpeg';
  if (b[0] === 0x47 && b[188] === 0x47) return 'video/mp2t';
  if (ascii.slice(4, 8) === 'ftyp') {
    const brand = ascii.slice(8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'image/heic';
    if (brand === 'qt  ') return 'video/quicktime';
    if (brand.startsWith('3g')) return 'video/3gpp';
    return 'video/mp4';
  }
  return 'application/octet-stream';
}

function isAnimatedGif(b: Buffer): boolean {
  const re = /\x00\x21\xF9\x04[\s\S]{4}\x00[\x2C\x21]/g;
  return (b.toString('latin1').match(re) ?? []).length > 1;
}

function ffmpegBin(): string | null {
  const c = process.env.FFMPEG_PATH;
  if (c && fs.existsSync(c)) return c;
  for (const rel of ['tools/ffmpeg.exe', 'tools/ffmpeg']) {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p)) return p;
  }
  return 'ffmpeg';
}

function run(cmd: string, args: string[], timeoutSec: number): Promise<{ code: number; timeout: boolean }> {
  return new Promise((resolve) => {
    let done = false;
    let child;
    try {
      child = spawn(cmd, args, { stdio: 'ignore', windowsHide: true });
    } catch {
      return resolve({ code: -1, timeout: false });
    }
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      child.kill('SIGKILL');
      resolve({ code: -1, timeout: true });
    }, timeoutSec * 1000);
    child.on('error', () => { if (!done) { done = true; clearTimeout(t); resolve({ code: -1, timeout: false }); } });
    child.on('close', (code: number | null) => { if (!done) { done = true; clearTimeout(t); resolve({ code: code ?? -1, timeout: false }); } });
  });
}

const okFile = (p: string) => { try { return fs.statSync(p).size > 0; } catch { return false; } };

async function imageSharp(buf: Buffer, animated: boolean): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const q = num(process.env.MEDIA_WEBP_QUALITY, 82, 1, 100);
    const out: Buffer = await sharp(buf, { animated, limitInputPixels: 268402689 }).rotate().webp({ quality: q }).toBuffer();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

async function imageFfmpeg(src: string, dest: string, animated: boolean): Promise<boolean> {
  const ff = ffmpegBin();
  if (!ff) return false;
  const q = String(num(process.env.MEDIA_WEBP_QUALITY, 82, 1, 100));
  const args = ['-y', '-v', 'error', '-i', src, ...(animated ? ['-loop', '0'] : ['-frames:v', '1']), '-c:v', 'libwebp', '-quality', q, dest];
  const r = await run(ff, args, 60);
  return r.code === 0 && okFile(dest);
}

async function videoFfmpeg(src: string, dest: string): Promise<[boolean, string]> {
  const ff = ffmpegBin();
  if (!ff) return [false, 'Máy chủ chưa cài ffmpeg'];
  const crf = String(num(process.env.MEDIA_VIDEO_CRF, 33, 0, 63));
  const maxH = num(process.env.MEDIA_VIDEO_MAX_HEIGHT, 1080, 144, 10000);
  const timeout = num(process.env.MEDIA_VIDEO_TIMEOUT, 600, 30, 7200);
  const r = await run(ff, ['-y', '-v', 'error', '-i', src, '-map_metadata', '-1', '-vf', `scale=-2:min(ih\\,${maxH})`,
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', crf, '-deadline', 'good', '-cpu-used', '5', '-row-mt', '1', '-pix_fmt', 'yuv420p',
    '-c:a', 'libopus', '-b:a', '96k', dest], timeout);
  if (r.timeout) { try { fs.unlinkSync(dest); } catch {} return [false, 'Video quá dài, chuyển đổi vượt thời gian cho phép']; }
  if (r.code !== 0 || !okFile(dest)) {
    try { fs.unlinkSync(dest); } catch {}
    return [false, r.code === -1 ? 'Máy chủ chưa cài ffmpeg' : 'ffmpeg không chuyển đổi được video này'];
  }
  return [true, ''];
}

/**
 * Lưu tệp (File từ formData) vào public/images/uploads, tự chuyển đổi.
 * @returns { path: tên tệp (không kèm thư mục), note }
 */
/** Lưu tệp đã xử lý: Vercel Blob (khi có BLOB_READ_WRITE_TOKEN) hoặc thư mục public/images/uploads */
async function saveUpload(dir: string, name: string, data: Buffer): Promise<string> {
  if (BLOB_UPLOADS) {
    const { put } = await import('@vercel/blob');
    const ext = name.split('.').pop() ?? '';
    const types: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', avif: 'image/avif', webm: 'video/webm', mp4: 'video/mp4' };
    await put('uploads/' + name, data, { access: 'public', addRandomSuffix: false, contentType: types[ext] ?? 'application/octet-stream' });
    return name;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), data);
  return name;
}

export async function storeConverted(file: File, allowVideo: boolean, maxImage = MAX_IMAGE_UPLOAD_BYTES, maxVideo = MAX_VIDEO_UPLOAD_BYTES, dir = UPLOAD_DIR): Promise<{ path: string; note: string }> {
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(buf);
  const isImage = IMAGE_MIMES.includes(mime);
  const isVideo = allowVideo && VIDEO_MIMES.includes(mime);
  if (!isImage && !isVideo) {
    throw new Error(allowVideo
      ? 'Định dạng chưa được hỗ trợ. Hãy chọn ảnh (JPG, PNG, GIF, BMP, WebP, AVIF...) hoặc video (MP4, MOV, AVI, MKV, WebM...).'
      : 'Định dạng chưa được hỗ trợ. Hãy chọn ảnh JPG, PNG, GIF, BMP, WebP hoặc AVIF.');
  }
  if (isImage && buf.length > maxImage) throw new Error(`Ảnh vượt quá giới hạn ${Math.floor(maxImage / 1048576)} MB. Hãy chọn ảnh nhẹ hơn.`);
  if (isVideo && buf.length > maxVideo) throw new Error(`Video vượt quá giới hạn ${Math.floor(maxVideo / 1048576)} MB. Hãy đăng lên YouTube rồi dán link.`);
  const base = crypto.randomBytes(16).toString('hex');
  const write = (name: string, data: Buffer = buf) => saveUpload(dir, name, data);
  const tmpDir = os.tmpdir();

  if (isImage) {
    if (mime === 'image/webp') return { path: await write(base + '.webp'), note: '' };
    const animated = mime === 'image/gif' && isAnimatedGif(buf);
    let out = await imageSharp(buf, animated);
    if (!out) {
      const tmp = path.join(tmpDir, 'cp-' + base);
      const dest = tmp + '.webp';
      fs.writeFileSync(tmp, buf);
      if (await imageFfmpeg(tmp, dest, animated)) out = fs.readFileSync(dest);
      try { fs.unlinkSync(tmp); fs.unlinkSync(dest); } catch {}
    }
    if (out) return { path: await write(base + '.webp', out), note: '' };
    const keep = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/avif': 'avif' } as Record<string, string>)[mime];
    if (!keep) throw new Error('Không chuyển được ảnh này sang WebP. Hãy xuất ảnh sang JPG/PNG rồi tải lại.');
    return { path: await write(base + '.' + keep), note: 'Giữ nguyên định dạng gốc (máy chủ chưa bật hỗ trợ WebP).' };
  }
  if (mime === 'video/webm') return { path: await write(base + '.webm'), note: '' };
  const tmp = path.join(tmpDir, 'cp-' + base);
  const dest = tmp + '.webm';
  fs.writeFileSync(tmp, buf);
  const [ok, why] = await videoFfmpeg(tmp, dest);
  let conv: Buffer | null = null;
  if (ok) conv = fs.readFileSync(dest);
  try { fs.unlinkSync(tmp); fs.unlinkSync(dest); } catch {}
  if (conv) return { path: await write(base + '.webm', conv), note: '' };
  if (mime === 'video/mp4') return { path: await write(base + '.mp4'), note: why + ' — đã giữ nguyên MP4.' };
  throw new Error(why + '. Hãy chọn video MP4/WebM hoặc nhờ quản trị VPS cài ffmpeg.');
}
