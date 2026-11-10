import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import { config, CONTENT_DIR } from './config';

/** Port của storage.php: kết nối MySQL, tự tạo bảng, tự nạp content/site.json lần đầu. */
let poolPromise: Promise<Pool> | null = null;

async function createPool(): Promise<Pool> {
  if (!/^[a-zA-Z0-9_]+$/.test(config.dbName)) {
    throw new Error('Tên database MySQL (DB_NAME) không hợp lệ.');
  }
  const pool = mysql.createPool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    charset: 'utf8mb4',
    connectTimeout: 10000,
    connectionLimit: process.env.VERCEL ? 2 : 5,
    // MySQL trên cloud (TiDB, Aiven, Railway…) thường bắt buộc SSL: đặt DB_SSL=1
    ...(process.env.DB_SSL === '1' ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
  });
  await pool.query(`CREATE TABLE IF NOT EXISTS site_content (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      content_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS consultation_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      service VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_consultation_requests_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [rows] = await pool.query<RowDataPacket[]>('SELECT 1 FROM site_content WHERE id = 1');
  if (rows.length === 0) {
    const initial = await fs.readFile(path.join(CONTENT_DIR, 'site.json'), 'utf8');
    JSON.parse(initial); // kiểm tra hợp lệ
    await pool.query('INSERT IGNORE INTO site_content (id, content_json) VALUES (1, ?)', [initial]);
  }
  return pool;
}

export function db(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = createPool().catch((e) => {
      poolPromise = null;
      throw e;
    });
  }
  return poolPromise;
}

export type SiteContent = Record<string, any>;

export async function loadSiteContent(): Promise<SiteContent> {
  const pool = await db();
  const [rows] = await pool.query<RowDataPacket[]>('SELECT content_json FROM site_content WHERE id = 1');
  if (!rows.length) throw new Error('Không tìm thấy nội dung website trong MySQL database.');
  const data = JSON.parse(String(rows[0].content_json));
  if (!data || typeof data !== 'object') throw new Error('Dữ liệu trong MySQL database không hợp lệ.');
  return data;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const pool = await db();
  const json = JSON.stringify(content, null, 4);
  await pool.query(
    'INSERT INTO site_content (id, content_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)',
    [json],
  );
}

export async function saveConsultationRequest(name: string, phone: string, service: string, message: string): Promise<void> {
  const pool = await db();
  await pool.query('INSERT INTO consultation_requests (name, phone, service, message) VALUES (?, ?, ?, ?)', [
    name,
    phone,
    service,
    message,
  ]);
}
