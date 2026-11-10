import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { config, CONTENT_DIR } from './config';

/** Port lead-notify.php: kiểm tra SĐT, báo lead qua Email + Telegram + Messenger. */

export function leadLog(msg: string) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    fs.appendFileSync(path.join(CONTENT_DIR, 'lead-errors.log'), `[${ts}] ${msg}\n`);
  } catch {
    console.error(msg);
  }
}

export function channelText(channel: string, contact: string) {
  if (!channel) return 'Không chọn';
  return contact ? `${channel} — ${contact}` : channel;
}

/** SĐT hợp lệ: Việt Nam (0xxxxxxxxx) hoặc quốc tế (+mã quốc gia / 00..., 8-15 chữ số). */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s.\-()]/g, '');
  return /^(?:0\d{9}|(?:\+|00)[1-9]\d{7,14})$/.test(digits);
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await r.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch {}
    return { status: r.status, data, text };
  } finally {
    clearTimeout(timer);
  }
}

async function sendTelegram(token: string, chatId: string, text: string) {
  try {
    const { data } = await postJson(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text, disable_web_page_preview: true });
    if (!data?.ok) return { ok: false, error: `Telegram #${data?.error_code ?? '?'}: ${data?.description ?? 'Phản hồi không hợp lệ'}` };
    return { ok: true, error: '' };
  } catch (e) {
    return { ok: false, error: String((e as Error).message).split(token).join('***') };
  }
}

async function sendMessenger(psid: string, text: string) {
  const payload: any = { recipient: { id: psid }, messaging_type: config.fbMessagingType, message: { text } };
  if (config.fbMessagingType === 'MESSAGE_TAG') payload.tag = config.fbMessageTag;
  try {
    const { status, data, text: raw } = await postJson(`https://graph.facebook.com/${config.fbGraphVersion}/me/messages`, payload, {
      Authorization: 'Bearer ' + config.fbPageAccessToken,
    });
    if (status !== 200 || data?.error) return { ok: false, error: `HTTP ${status} / FB #${data?.error?.code ?? '?'}: ${data?.error?.message ?? 'Phản hồi không hợp lệ'}` };
    if (!data?.message_id) return { ok: false, error: 'FB trả 200 nhưng không có message_id: ' + raw.slice(0, 200) };
    return { ok: true, error: '' };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface NotifyResult { mail: boolean; telegram_sent: number; messenger_sent: number; errors: string[] }

export async function leadNotify(name: string, phone: string, service: string, message: string, channel = '', channelContact = ''): Promise<NotifyResult> {
  const result: NotifyResult = { mail: false, telegram_sent: 0, messenger_sent: 0, errors: [] };
  try {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    /* 1. Email (SMTP) */
    if (email.test(config.mailTo) && email.test(config.mailFrom) && config.smtpHost) {
      try {
        const tr = nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpPort === 465,
          auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPassword } : undefined,
        });
        await tr.sendMail({
          from: `CHUNORA PET <${config.mailFrom}>`,
          to: config.mailTo,
          subject: 'Yêu cầu tư vấn từ website CHUNORA PET',
          text: `Họ và tên: ${name}\r\nSố điện thoại: ${phone}\r\nDịch vụ quan tâm: ${service}\r\nNhận tư vấn qua: ${channelText(channel, channelContact)}\r\nLời nhắn: ${message}\r\n`,
        });
        result.mail = true;
      } catch (e) {
        leadLog('[lead] Gửi email lỗi: ' + (e as Error).message);
        result.errors.push('mail lỗi');
      }
    } else leadLog('[lead] Email configuration is missing or invalid.');

    const time = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false,
    }).format(new Date()).replace(',', '');
    const text =
      '🔔 CÓ KHÁCH ĐĂNG KÝ TƯ VẤN MỚI!\n━━━━━━━━━━━━━━━\n' +
      `👤 Họ tên: ${name}\n📞 SĐT: ${phone}\n🐾 Dịch vụ: ${service || 'Chưa chọn'}\n` +
      `📲 Nhận tư vấn qua: ${channelText(channel, channelContact)}\n` +
      `💬 Lời nhắn: ${message ? Array.from(message).slice(0, 1000).join('') : 'Không có'}\n━━━━━━━━━━━━━━━\n🕒 Thời gian: ${time}`;

    /* 2. Telegram */
    const tgToken = config.telegramBotToken.trim();
    const chats = config.telegramChatIds.filter((c) => c && !c.startsWith('CHAT_ID'));
    let tgTotal = 0;
    if (tgToken && !tgToken.startsWith('YOUR_') && chats.length) {
      tgTotal = chats.length;
      for (const chat of chats) {
        const r = await sendTelegram(tgToken, chat, text);
        if (r.ok) result.telegram_sent++;
        else {
          result.errors.push(`Telegram ${chat}: ${r.error}`);
          leadLog(`[lead] Telegram lỗi chat ${chat}: ${r.error}`);
        }
      }
      if (!result.telegram_sent) leadLog(`[lead] LEAD CHƯA BÁO ĐƯỢC QUA TELEGRAM: ${name} - ${phone} - ${service} - ${message}`);
    }

    /* 3. Messenger */
    const psids = config.fbAdminPsids.filter((p) => p && !p.startsWith('PSID_ADMIN_'));
    if (!config.fbPageAccessToken || config.fbPageAccessToken === 'YOUR_PAGE_ACCESS_TOKEN' || !psids.length) {
      if (!tgTotal) {
        leadLog('[lead] Chưa cấu hình kênh báo lead nào (TELEGRAM_* / FB_* trong .env.local).');
        result.errors.push('Chưa cấu hình Telegram/Messenger');
      }
      return result;
    }
    const errs: string[] = [];
    for (const psid of psids) {
      const r = await sendMessenger(psid, text);
      if (r.ok) result.messenger_sent++;
      else errs.push(`PSID ${psid}: ${r.error}`);
    }
    if (errs.length) {
      result.errors.push(...errs);
      leadLog('[lead] Messenger lỗi: ' + errs.join(' | '));
      if (!result.messenger_sent) leadLog(`[lead] LEAD CHƯA BÁO ĐƯỢC QUA MESSENGER: ${name} - ${phone} - ${service} - ${message}`);
    }
  } catch (e) {
    leadLog('[lead] Lỗi khi báo lead: ' + (e as Error).message);
    result.errors.push((e as Error).message);
  }
  return result;
}

export const LEAD_SERVICES = ['Mua bán chó mèo', 'Vận chuyển đa quốc gia', 'Chăm sóc tại store'];
export const LEAD_CHANNELS = ['', 'Zalo', 'Telegram', 'WhatsApp', 'Facebook', 'Instagram'];
