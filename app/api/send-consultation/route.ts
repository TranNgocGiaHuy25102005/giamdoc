import { NextResponse, type NextRequest } from 'next/server';
import { checkCsrf, markSent, tooFast } from '@/lib/csrf';
import { saveConsultationRequest } from '@/lib/db';
import { config } from '@/lib/config';
import { isValidPhone, LEAD_CHANNELS, LEAD_SERVICES, leadLog, leadNotify } from '@/lib/lead-notify';

/** Port api/send-consultation.php — form "Đăng ký tư vấn" (JSON). Luôn trả HTTP 200 + { success, message }. */
export const dynamic = 'force-dynamic';

const respond = (success: boolean, message: string, code = 200, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success, message, code, ...extra }, { status: 200, headers: { 'X-Content-Type-Options': 'nosniff' } });

/** bỏ ký tự điều khiển (giữ xuống dòng / tab), trim, cắt độ dài */
const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? Array.from(v.replace(/[^\P{C}\n\t]/gu, '').trim()).slice(0, max).join('') : '';

export async function GET() {
  return respond(false, 'Phương thức không được hỗ trợ.', 405);
}

export async function POST(req: NextRequest) {
  try {
    let input: any;
    try {
      input = await req.json();
    } catch {
      return respond(false, 'Dữ liệu gửi lên không hợp lệ.', 400);
    }
    if (!input || typeof input !== 'object') return respond(false, 'Dữ liệu gửi lên không hợp lệ.', 400);
    if (!(await checkCsrf(input.csrf_token))) return respond(false, 'Phiên gửi biểu mẫu đã hết hạn. Vui lòng tải lại trang và thử lại.', 403);
    if (input.website) return respond(true, 'Gửi yêu cầu thành công.');

    const fullName = clean(input.fullName, 120);
    const phone = clean(input.phone, 20);
    const service = clean(input.service, 100);
    const message = clean(input.message, 3000);
    const channel = clean(input.channel, 20);
    const channelContact = clean(input.channelContact, 200);

    if (!fullName) return respond(false, 'Vui lòng nhập họ và tên.', 422);
    if (!phone) return respond(false, 'Vui lòng nhập số điện thoại.', 422);
    if (!isValidPhone(phone)) return respond(false, 'Số điện thoại không hợp lệ. Số quốc tế cần bắt đầu bằng + và mã quốc gia (vd: +66912345678).', 422);
    if (!LEAD_CHANNELS.includes(channel)) return respond(false, 'Kênh nhận tư vấn không hợp lệ. Vui lòng chọn lại.', 422);
    if (channel && !channelContact) return respond(false, `Vui lòng nhập link hoặc số điện thoại ${channel} của bạn.`, 422);
    if (!LEAD_SERVICES.includes(service)) return respond(false, 'Dịch vụ không hợp lệ. Vui lòng chọn lại.', 422);

    const key = req.cookies.get('cp_csrf')?.value ?? req.headers.get('x-forwarded-for') ?? 'ip';
    if (tooFast(key)) return respond(false, 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.', 429);

    let saved = true;
    let saveError = '';
    try {
      const stored = channel ? (message + `\n\n[Nhận tư vấn qua: ${channel} — ${channelContact}]`).trimEnd() : message;
      await saveConsultationRequest(fullName, phone, service, stored);
    } catch (e) {
      saved = false;
      saveError = 'Lưu CSDL lỗi: ' + (e as Error).message;
      leadLog('[lead] Không lưu được yêu cầu tư vấn: ' + (e as Error).message);
    }
    const n = await leadNotify(fullName, phone, service, message, channel, channelContact);
    const extra = config.debug ? { debug: [saveError, ...n.errors].filter(Boolean).join(' | ') } : {};
    if (saved || n.telegram_sent > 0 || n.messenger_sent > 0 || n.mail) {
      markSent(key);
      return respond(true, 'Gửi yêu cầu thành công! CHUNORA PET sẽ liên hệ với bạn sớm nhất.', 200, extra);
    }
    return respond(false, 'Hệ thống chưa nhận được yêu cầu. Vui lòng thử lại sau hoặc gọi hotline.', 503, extra);
  } catch (e) {
    leadLog('[lead-api] ' + (e as Error).message);
    return respond(false, 'Hệ thống đang gặp sự cố, vui lòng thử lại sau hoặc gọi hotline.', 500, config.debug ? { debug: (e as Error).message } : {});
  }
}
