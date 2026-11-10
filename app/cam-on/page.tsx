import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import { getTranslator, translateTree } from '@/lib/i18n/translate';
import { pageMetadata } from '@/lib/seo';
import '../styles/thanks.css';

/**
 * Port cam-on.php — trang cảm ơn sau khi gửi form tư vấn (noindex).
 * Trang đứng riêng, không có header/footer chung (giống PHP); vẫn dịch theo quốc gia (i18n_boot).
 */
export const dynamic = 'force-dynamic';

const TITLE = 'Cảm ơn bạn – CHUNORA PET';

export async function generateMetadata(): Promise<Metadata> {
  await syncContent();
  return pageMetadata({ title: TITLE, description: '', path: '/cam-on', noindex: true });
}

export default async function ThanksPage() {
  await syncContent();
  const ctx = await getTranslator();
  return translateTree(
    ctx,
    <div className="ty-page">
      <div className="card">
        <h1>Cảm ơn bạn!</h1>
        <p>CHUNORA PET đã nhận được yêu cầu tư vấn và sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>
        <a href="/">Quay về trang chủ</a>
      </div>
    </div>,
  );
}
