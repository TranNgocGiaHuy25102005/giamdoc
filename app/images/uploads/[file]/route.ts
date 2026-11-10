import { NextResponse } from 'next/server';

/**
 * Ảnh/video tải lên trên Vercel nằm ở Vercel Blob (không ở public/images/uploads).
 * Đường dẫn cũ /images/uploads/<tên> vẫn dùng được: chuyển hướng tới file trên Blob.
 * (Khi chạy trên máy/VPS, file trong public/ được trả trực tiếp và route này không được gọi.)
 */
export const dynamic = 'force-dynamic';

const known = new Map<string, string>();

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[A-Za-z0-9_.-]+$/.test(file) || !process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse('Not found', { status: 404 });
  }
  let url = known.get(file);
  if (!url) {
    try {
      const { head } = await import('@vercel/blob');
      url = (await head('uploads/' + file)).url;
      known.set(file, url);
    } catch {
      return new NextResponse('Not found', { status: 404 });
    }
  }
  return new NextResponse(null, {
    status: 308,
    headers: { Location: url, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
