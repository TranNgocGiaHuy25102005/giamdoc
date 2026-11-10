import { NextResponse, type NextRequest } from 'next/server';
import { checkCsrf } from '@/lib/csrf';
import { saveConsultationRequest } from '@/lib/db';
import { escapeHtml } from '@/lib/text';
import { isValidPhone, LEAD_CHANNELS, LEAD_SERVICES, leadLog, leadNotify } from '@/lib/lead-notify';

/** Port contact.php — form tư vấn gửi kiểu thường (khi trình duyệt tắt JavaScript). */
export const dynamic = 'force-dynamic';

function showError(message: string, status = 400) {
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Không gửi được yêu cầu</title><body style="font-family:Arial,sans-serif;max-width:620px;margin:12vh auto;padding:24px;color:#10233F"><h1>Không gửi được yêu cầu</h1><p>${escapeHtml(message)}</p><p><a href="/#tu-van">Quay lại biểu mẫu tư vấn</a></p></body></html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// Location tương đối: đúng cả khi chạy sau IIS reverse proxy
const go = (_req: NextRequest, path: string) => new NextResponse(null, { status: 303, headers: { Location: path } });

export async function GET(req: NextRequest) {
  return go(req, '/#tu-van');
}

export async function POST(req: NextRequest) {
  const f = await req.formData();
  const s = (k: string) => (typeof f.get(k) === 'string' ? String(f.get(k)).trim() : '');
  if (!(await checkCsrf(s('csrf_token')))) return showError('Phiên gửi biểu mẫu đã hết hạn. Vui lòng tải lại trang và thử lại.');
  if (s('website')) return go(req, '/cam-on');
  const name = s('ho_ten');
  const phone = s('so_dien_thoai');
  const service = s('dich_vu');
  const message = s('loi_nhan');
  const channel = s('kenh_tu_van');
  const channelContact = Array.from(s('kenh_lien_he')).slice(0, 200).join('').trim();
  if (!name || name.length > 160 || !phone || phone.length > 60) return showError('Vui lòng nhập họ tên và số điện thoại hợp lệ.');
  if (!isValidPhone(phone)) return showError('Số điện thoại không hợp lệ. Số quốc tế cần bắt đầu bằng + và mã quốc gia (vd: +66912345678).');
  if (!LEAD_CHANNELS.includes(channel) || (channel && !channelContact)) return showError('Vui lòng nhập link hoặc số điện thoại cho kênh bạn muốn nhận tư vấn.');
  if (!LEAD_SERVICES.includes(service) || message.length > 4000) return showError('Thông tin gửi lên không hợp lệ. Vui lòng kiểm tra và thử lại.');
  try {
    const stored = channel ? (message + `\n\n[Nhận tư vấn qua: ${channel} — ${channelContact}]`).trimEnd() : message;
    await saveConsultationRequest(name, phone, service, stored);
  } catch (e) {
    leadLog('Could not save a consultation request: ' + (e as Error).message);
    return showError('Hệ thống chưa lưu được yêu cầu. Vui lòng thử lại sau hoặc gọi hotline.', 503);
  }
  await leadNotify(name, phone, service, message, channel, channelContact);
  return go(req, '/cam-on');
}
