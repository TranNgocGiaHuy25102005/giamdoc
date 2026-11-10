import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { config } from '../config';

/** Phiên đăng nhập admin (thay $_SESSION['admin_logged_in'] của PHP): cookie ký HMAC, hết hạn sau 2 giờ không thao tác. */
export const ADMIN_COOKIE = 'cp_admin';
const IDLE = 7200;

export interface AdminSession { ok: boolean; csrf: string; last: number }

function secret(): string {
  // Không cấu hình SESSION_SECRET → dùng hash mật khẩu làm khoá (đổi mật khẩu = đăng xuất mọi phiên)
  return config.sessionSecret || 'cp:' + config.adminPasswordHash;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function encodeSession(s: AdminSession): string {
  const p = Buffer.from(JSON.stringify(s)).toString('base64url');
  return p + '.' + sign(p);
}

export function decodeSession(v: string | undefined): AdminSession | null {
  if (!v) return null;
  const [p, sig] = v.split('.');
  if (!p || !sig) return null;
  const good = sign(p);
  const sb = Buffer.from(sig);
  const gb = Buffer.from(good);
  if (sb.length !== gb.length || !crypto.timingSafeEqual(sb, gb)) return null;
  try {
    const s = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as AdminSession;
    return s && typeof s.csrf === 'string' ? s : null;
  } catch {
    return null;
  }
}

/** Phiên hiện tại (có thể chưa đăng nhập: ok=false nhưng vẫn có csrf cho form đăng nhập) */
export async function getAdminSession(): Promise<AdminSession | null> {
  const s = decodeSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!s) return null;
  if (s.ok && Date.now() / 1000 - s.last > IDLE) return { ...s, ok: false };
  return s;
}

export function newSession(ok: boolean): AdminSession {
  return { ok, csrf: crypto.randomBytes(32).toString('hex'), last: Math.floor(Date.now() / 1000) };
}

export const cookieOpts = (secure: boolean) => ({ httpOnly: true, sameSite: 'lax' as const, path: '/', secure });

/** password_verify() — hỗ trợ hash $2y$ của PHP */
export function verifyPassword(pw: string): boolean {
  const h = config.adminPasswordHash;
  if (!h) return false;
  try {
    return bcrypt.compareSync(pw, h.replace(/^\$2y\$/, '$2a$'));
  } catch {
    return false;
  }
}
