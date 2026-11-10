import 'server-only';
import path from 'node:path';

/** Thư mục gốc dự án (nơi có content/, public/) */
export const ROOT = process.cwd();
export const CONTENT_DIR = path.join(ROOT, 'content');
export const PUBLIC_DIR = path.join(ROOT, 'public');

const list = (v?: string) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** Tương đương config.php cũ — đọc từ biến môi trường (.env.local) */
export const config = {
  dbHost: process.env.DB_HOST ?? '127.0.0.1',
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbName: process.env.DB_NAME ?? 'chunorapet_cms',
  dbUser: process.env.DB_USER ?? 'root',
  dbPassword: process.env.DB_PASSWORD ?? '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? '',
  mailTo: process.env.MAIL_TO ?? '',
  mailFrom: process.env.MAIL_FROM ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatIds: list(process.env.TELEGRAM_CHAT_IDS),
  fbPageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN ?? '',
  fbAdminPsids: list(process.env.FB_ADMIN_PSIDS),
  fbGraphVersion: process.env.FB_GRAPH_VERSION ?? 'v21.0',
  fbMessagingType: process.env.FB_MESSAGING_TYPE ?? 'MESSAGE_TAG',
  fbMessageTag: process.env.FB_MESSAGE_TAG ?? 'CONFIRMED_EVENT_UPDATE',
  debug: process.env.APP_DEBUG === '1',
};
