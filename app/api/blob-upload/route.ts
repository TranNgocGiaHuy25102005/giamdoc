import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ADMIN_COOKIE, decodeSession } from '@/lib/admin/session';

/**
 * Cấp quyền cho trình duyệt (trang admin) tải ảnh/video THẲNG lên Vercel Blob,
 * tránh giới hạn ~4,5 MB dữ liệu gửi lên mỗi request của Vercel. Chỉ admin đã đăng nhập mới dùng được.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const cookie = request.headers.get('cookie') ?? '';
        const m = cookie.match(new RegExp('(?:^|;\\s*)' + ADMIN_COOKIE + '=([^;]+)'));
        const s = decodeSession(m ? decodeURIComponent(m[1]) : undefined);
        if (!s?.ok || Date.now() / 1000 - s.last > 7200) throw new Error('Phiên đăng nhập đã hết hạn.');
        if (!pathname.startsWith('tmp/')) throw new Error('Đường dẫn không hợp lệ.');
        return {
          allowedContentTypes: ['image/*', 'video/*'],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
