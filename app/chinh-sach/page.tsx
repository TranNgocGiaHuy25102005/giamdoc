import type { Metadata } from 'next';
import { syncContent } from '@/lib/json-file';
import fs from 'node:fs';
import path from 'node:path';
import { Fragment, type ReactNode } from 'react';
import { PageShell } from '@/components/site/PageShell';
import { getSiteData } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { readContentJson } from '@/lib/json-file';
import { ROOT } from '@/lib/config';
import { telOf } from '@/lib/text';
import '../styles/policy.css';

/**
 * Port chinh-sach.php → /chinh-sach?trang=bao-hanh-suc-khoe | doi-tra | bao-mat | dieu-khoan
 * 4 trang chính sách ở chân trang. Nội dung mặc định nằm ngay trong file này —
 * có thể ghi đè bằng content/policies_data.json: {"doi-tra": {"title": "...", "intro": "...", "sections": [["Tiêu đề", "Nội dung\n\nĐoạn 2"], ...]}}
 */
export const dynamic = 'force-dynamic';

interface PolicyPage { title: string; intro: string; sections: [string, string][] }
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DEFAULT_PAGES: Record<string, PolicyPage> = {
  'bao-hanh-suc-khoe': {
    title: 'Chính sách bảo hành sức khỏe',
    intro: 'CHUNORA PET cam kết đồng hành cùng bạn sau khi bé về nhà. Chính sách này nêu rõ phạm vi hỗ trợ sức khỏe đối với thú cưng mua tại Chunora.',
    sections: [
      ['1. Phạm vi áp dụng', "Áp dụng cho chó, mèo mua trực tiếp tại CHUNORA PET và có phiếu mua bán / sổ sức khỏe do Chunora cấp.\n\nThời hạn bảo hành và các bệnh được bảo hành cụ thể được ghi trong phiếu mua bán của từng bé."],
      ['2. Cam kết khi bàn giao', "Bé được khám sức khỏe tổng quát, tiêm phòng và tẩy giun theo lịch phù hợp với độ tuổi trước khi bàn giao.\n\nChunora cung cấp sổ theo dõi sức khỏe, thông tin giống, ngày sinh và hướng dẫn chăm sóc ban đầu."],
      ['3. Điều kiện được bảo hành', "• Bạn giữ phiếu mua bán và sổ sức khỏe của bé.\n• Bé được chăm sóc theo hướng dẫn (chế độ ăn, vệ sinh, lịch tiêm phòng).\n• Thông báo cho Chunora sớm khi bé có dấu hiệu bất thường (bỏ ăn, nôn, tiêu chảy, lờ đờ…) và đưa bé đi khám tại cơ sở thú y uy tín.\n• Có xác nhận chẩn đoán của bác sĩ thú y."],
      ['4. Trường hợp không áp dụng', "• Bé bị tai nạn, chấn thương, ngộ độc hoặc bệnh phát sinh do chăm sóc không đúng cách.\n• Bé không được tiêm phòng, tẩy giun đúng lịch sau khi nhận.\n• Bệnh không thuộc danh mục được ghi trong phiếu bảo hành."],
      ['5. Hướng xử lý', "Chunora ưu tiên hỗ trợ tư vấn điều trị. Trong trường hợp được bảo hành, hình thức hỗ trợ (hỗ trợ chi phí điều trị, đổi bé khác tương đương…) được hai bên thống nhất theo phiếu mua bán."],
      ['6. Liên hệ', "Vui lòng gọi hotline hoặc nhắn tin Zalo / WhatsApp của Chunora để được hỗ trợ nhanh nhất."],
    ],
  },
  'doi-tra': {
    title: 'Chính sách đổi trả',
    intro: 'Chúng tôi hiểu thú cưng là một thành viên trong gia đình. Chính sách đổi trả dưới đây nhằm bảo vệ quyền lợi của bạn và sức khỏe của bé.',
    sections: [
      ['1. Phạm vi áp dụng', "Áp dụng cho thú cưng và sản phẩm mua tại CHUNORA PET (cửa hàng hoặc đặt qua kênh trực tuyến)."],
      ['2. Đối với thú cưng', "Việc đổi hoặc hỗ trợ được xem xét khi bé có bệnh được ghi trong phiếu bảo hành, có xác nhận của bác sĩ thú y, và trong thời hạn bảo hành đã ghi trên phiếu.\n\nChunora không nhận trả lại khi bé khỏe mạnh vì lý do thay đổi ý định, trừ khi hai bên có thỏa thuận khác bằng văn bản."],
      ['3. Đối với sản phẩm, phụ kiện', "Sản phẩm còn nguyên bao bì, chưa qua sử dụng, còn hóa đơn mua hàng có thể được đổi trong thời gian Chunora thông báo tại thời điểm mua.\n\nThực phẩm, đồ vệ sinh đã mở bao bì không áp dụng đổi trả (trừ khi lỗi do nhà sản xuất)."],
      ['4. Quy trình', "• Liên hệ Chunora qua hotline / Zalo / WhatsApp, cung cấp phiếu mua bán và hình ảnh, video tình trạng.\n• Chunora xác nhận và hẹn lịch kiểm tra.\n• Hai bên thống nhất phương án xử lý và hoàn tất."],
      ['5. Chi phí', "Chi phí vận chuyển, khám chữa phát sinh được hai bên thỏa thuận rõ trước khi thực hiện, tùy từng trường hợp."],
    ],
  },
  'bao-mat': {
    title: 'Chính sách bảo mật thông tin',
    intro: 'CHUNORA PET tôn trọng và bảo vệ thông tin cá nhân của khách hàng. Chính sách này giải thích chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn như thế nào.',
    sections: [
      ['1. Thông tin chúng tôi thu thập', "Khi bạn gửi biểu mẫu tư vấn hoặc liên hệ, chúng tôi có thể thu thập: họ tên, số điện thoại, kênh liên hệ ưa thích (Zalo, WhatsApp, Telegram…), dịch vụ quan tâm và nội dung bạn nhập.\n\nChúng tôi không thu thập thông tin thanh toán qua website này."],
      ['2. Mục đích sử dụng', "• Liên hệ tư vấn dịch vụ bạn đã yêu cầu.\n• Hỗ trợ trước và sau bán hàng, vận chuyển thú cưng.\n• Cải thiện chất lượng dịch vụ và nội dung website."],
      ['3. Chia sẻ thông tin', "Chunora không bán hoặc trao đổi thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ với đối tác thực hiện dịch vụ (hãng vận chuyển, cơ sở thú y) trong phạm vi cần thiết, hoặc khi pháp luật yêu cầu."],
      ['4. Bảo mật', "Dữ liệu được lưu trên máy chủ có kiểm soát truy cập. Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để hạn chế truy cập trái phép, tuy nhiên không có hệ thống nào an toàn tuyệt đối."],
      ['5. Cookie', "Website dùng cookie để ghi nhớ lựa chọn quốc gia / ngôn ngữ và duy trì phiên làm việc. Bạn có thể tắt cookie trong trình duyệt, một số chức năng có thể bị ảnh hưởng."],
      ['6. Quyền của bạn', "Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân mà bạn đã cung cấp bằng cách liên hệ hotline hoặc kênh chat chính thức của Chunora."],
    ],
  },
  'dieu-khoan': {
    title: 'Điều khoản dịch vụ',
    intro: 'Khi sử dụng website và dịch vụ của CHUNORA PET, bạn đồng ý với các điều khoản dưới đây.',
    sections: [
      ['1. Dịch vụ cung cấp', "CHUNORA PET cung cấp dịch vụ mua bán chó mèo, chăm sóc tại store (spa, lưu trú) và vận chuyển thú cưng quốc tế. Nội dung chi tiết, giá và điều kiện cụ thể của từng dịch vụ được thông báo khi tư vấn và xác nhận bằng phiếu / hợp đồng."],
      ['2. Thông tin và giá', "Thông tin trên website mang tính tham khảo và có thể thay đổi theo thời điểm. Báo giá cuối cùng là báo giá được Chunora xác nhận với bạn."],
      ['3. Trách nhiệm của khách hàng', "• Cung cấp thông tin chính xác về thú cưng và thông tin liên hệ.\n• Chuẩn bị giấy tờ, tiêm phòng theo yêu cầu của dịch vụ và quy định của nước đến (đối với vận chuyển quốc tế).\n• Tuân thủ hướng dẫn của Chunora trong quá trình chăm sóc và vận chuyển."],
      ['4. Vận chuyển quốc tế', "Việc nhập cảnh, kiểm dịch phụ thuộc quy định của cơ quan chức năng và hãng bay tại từng thời điểm. Chunora hỗ trợ thủ tục nhưng không chịu trách nhiệm đối với quyết định của cơ quan nhà nước hoặc hãng bay nằm ngoài khả năng kiểm soát."],
      ['5. Giới hạn trách nhiệm', "Chunora chịu trách nhiệm trong phạm vi dịch vụ đã cam kết bằng văn bản. Chúng tôi không chịu trách nhiệm đối với thiệt hại gián tiếp hoặc do sự kiện bất khả kháng."],
      ['6. Sở hữu trí tuệ', "Hình ảnh, nội dung và nhận diện thương hiệu trên website thuộc CHUNORA PET. Vui lòng không sao chép khi chưa được đồng ý."],
      ['7. Thay đổi điều khoản', "Chunora có thể cập nhật điều khoản và sẽ đăng phiên bản mới trên trang này. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận nội dung cập nhật."],
    ],
  },
};

const DEFAULT_SLUG = 'bao-hanh-suc-khoe';

/** Nội dung mặc định + ghi đè từ content/policies_data.json (nếu có) */
function loadPages(): Record<string, PolicyPage> {
  const pages: Record<string, PolicyPage> = {};
  for (const [k, p] of Object.entries(DEFAULT_PAGES)) pages[k] = { title: p.title, intro: p.intro, sections: [...p.sections] };
  const j = readContentJson('policies_data.json');
  if (j && typeof j === 'object') {
    for (const [k, v] of Object.entries(j as Record<string, any>)) {
      if (!(k in pages) || !v || typeof v !== 'object') continue;
      for (const f of ['title', 'intro'] as const) {
        if (typeof v[f] === 'string' && v[f].trim() !== '') pages[k][f] = v[f].trim();
      }
      if (v.sections && typeof v.sections === 'object') {
        const secs: [string, string][] = [];
        for (const s of Object.values(v.sections as Record<string, unknown>)) {
          if (s && typeof s === 'object') {
            const a = (s as any)[0];
            const b = (s as any)[1];
            if (typeof a === 'string' && typeof b === 'string') secs.push([a, b]);
          }
        }
        if (secs.length) pages[k].sections = secs;
      }
    }
  }
  return pages;
}

/** $_GET['trang'] → slug hợp lệ (sai → trang mặc định) */
async function resolve(searchParams: SearchParams) {
  const sp = await searchParams;
  const pages = loadPages();
  const raw = sp.trang;
  let slug = typeof raw === 'string' ? raw : raw === undefined ? DEFAULT_SLUG : '';
  if (!Object.prototype.hasOwnProperty.call(pages, slug)) slug = DEFAULT_SLUG;
  return { pages, slug, page: pages[slug] };
}

/** cs_body(): đoạn cách nhau bởi dòng trống; đoạn bắt đầu bằng "•" thành danh sách */
function CsBody({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const paras = text.trim().split(/\n{2,}/);
  paras.forEach((para, i) => {
    const lines = para.split('\n').map((l) => l.trim());
    if (lines.length && /^•/u.test(lines[0])) {
      out.push(
        <ul key={i}>
          {lines.map((l, j) => (
            <li key={j}>{l.replace(/^•\s*/u, '').replace(/^\s+/, '')}</li>
          ))}
        </ul>,
      );
    } else {
      out.push(<p key={i}>{lines.join(' ')}</p>);
    }
  });
  return <>{out}</>;
}

/** Ngày cập nhật: thời gian sửa file nguồn trang (giống filemtime(__FILE__)) */
function updatedDate(): string {
  let d = new Date();
  try {
    d = fs.statSync(path.join(ROOT, 'app', 'chinh-sach', 'page.tsx')).mtime;
  } catch {}
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  await syncContent();
  const { slug, page } = await resolve(searchParams);
  return pageMetadata({ title: page.title + ' | CHUNORA PET', description: page.intro, path: '/chinh-sach?trang=' + slug });
}

export default async function PolicyPageView({ searchParams }: { searchParams: SearchParams }) {
  await syncContent();
  const { pages, slug, page } = await resolve(searchParams);
  const site = await getSiteData();
  const hotline = String(site.contact.hotline ?? '');
  const hotlineTel = telOf(String(site.contact.hotline_tel ?? hotline));
  const updated = updatedDate();

  return (
    <PageShell active="chinh-sach" extraKeys={[page.title + ' | CHUNORA PET', page.intro]}>
      <main className="main cs" id="main">
        <section className="cs-hero">
          <div className="cs-wrap">
            <nav className="cs-crumb" aria-label="Breadcrumb"><a href="/">Trang chủ</a> › Chính sách</nav>
            <h1>{page.title}</h1>
            <p>{page.intro}</p>
          </div>
        </section>
        <div className="cs-wrap cs-grid">
          <nav className="cs-nav" aria-label="Chính sách">
            {Object.entries(pages).map(([k, p]) =>
              k === slug ? (
                <a key={k} href={`/chinh-sach?trang=${k}`} className="on" aria-current="page">{p.title}</a>
              ) : (
                <a key={k} href={`/chinh-sach?trang=${k}`}>{p.title}</a>
              ),
            )}
          </nav>
          <article className="cs-card">
            {page.sections.map(([st, sb], i) => (
              <Fragment key={i}>
                <h2>{st}</h2>
                <CsBody text={sb} />
              </Fragment>
            ))}
            <div className="cs-note">
              Cập nhật lần cuối: {updated}. Cần hỗ trợ thêm, vui lòng gọi hotline <a href={`tel:${hotlineTel}`}>{hotline}</a> hoặc nhắn tin cho Chunora.
            </div>
          </article>
        </div>
      </main>
    </PageShell>
  );
}
