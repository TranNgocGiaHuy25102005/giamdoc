import 'server-only';
import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';

/** Token CSRF của khách hiện tại (đặt bởi middleware) — nhúng vào form. */
export async function getCsrfToken(): Promise<string> {
  const h = await headers();
  return h.get('x-cp-csrf') ?? (await cookies()).get('cp_csrf')?.value ?? '';
}

/** So khớp token gửi lên với cookie (hash_equals) */
export async function checkCsrf(token: unknown): Promise<boolean> {
  const ck = (await cookies()).get('cp_csrf')?.value ?? '';
  if (typeof token !== 'string' || !ck) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(ck);
  // so sánh độ dài theo BYTE (token có ký tự nhiều byte → timingSafeEqual sẽ ném RangeError)
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Chống spam: mỗi khách (cookie) / IP gửi tối đa 1 lần / 10 giây */
const last = new Map<string, number>();
export function tooFast(key: string, seconds = 10): boolean {
  const now = Date.now();
  if (last.size > 5000) last.clear();
  return (last.get(key) ?? 0) > now - seconds * 1000;
}
export function markSent(key: string) {
  last.set(key, Date.now());
}
