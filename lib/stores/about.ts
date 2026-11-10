import 'server-only';
import { readContentJson, writeContentJson } from '../json-file';
import { cleanSrc, cleanText } from '../text';

/**
 * Port about-store.php — dữ liệu trang "Về Chunora" (/ve-chunora).
 * Lưu tại content/about_chunora_data.json. Chưa có file thì dùng nội dung mặc định bên dưới.
 * Admin: "Nội dung navbar" → "Quản lý Về Chunora".
 * Trong tiêu đề, bọc cụm cần nhấn bằng dấu * … * để hiện chữ nghiêng màu cam (VD: người bạn *bốn chân*).
 */
export const ABOUT_FILE = 'about_chunora_data.json';

export interface AboutCard { title: string; desc: string }
export interface AboutMember { name: string; role: string; desc: string; image: string }
export interface AboutChannel { key: string; enabled: boolean; name: string; subtext: string; url: string; bg: string; color: string }
export interface AboutStat { value: string; label: string }
export interface AboutData {
  story: { eyebrow: string; title: string; positioning: string; intro: string; video: string; thumbnail: string; cta: string };
  why: { eyebrow: string; title: string; desc: string; image: string; cards: AboutCard[]; cta: string; cta_link: string };
  team: { eyebrow: string; title: string; desc: string; members: AboutMember[]; cta: string; cta_link: string };
  social_section: { eyebrow: string; title: string; subtitle: string; channels: AboutChannel[] };
  stats: { items: AboutStat[] };
  cta: { title: string; desc: string; button: string; button_link: string; hotline: string };
}

/** Nội dung mặc định (luôn trả bản mới — an toàn khi chỉnh sửa). */
export function aboutDefaults(): AboutData {
  return {
    story: {
      eyebrow: 'Câu chuyện thương hiệu',
      title: 'Chăm sóc trọn vẹn cho người bạn *bốn chân*',
      positioning: 'Chunora PET – Chuỗi dịch vụ mua bán, chăm sóc và vận chuyển chó mèo đa quốc gia.',
      intro: 'Từ một cửa hàng nhỏ ở Quận 11, chúng tôi lớn lên cùng niềm tin rằng mỗi bé thú cưng đều xứng đáng được yêu thương, chăm sóc đúng cách và đi đến bất cứ nơi đâu cùng gia đình.',
      video: '',
      thumbnail: '',
      cta: 'Xem video giới thiệu',
    },
    why: {
      eyebrow: 'Vì sao chọn Chunora PET',
      title: 'Tận tâm với từng bé, *rõ ràng với từng chủ nuôi*',
      desc: 'Chúng tôi tin một dịch vụ thú cưng tốt bắt đầu từ sự minh bạch và trách nhiệm trong từng chi tiết nhỏ.',
      image: '',
      cards: [
        { title: 'Minh bạch thông tin', desc: 'Nguồn gốc, sức khỏe và hồ sơ của bé được trao đổi rõ ràng trước khi bạn quyết định.' },
        { title: 'Thủ tục quốc tế', desc: 'Hướng dẫn chi tiết giấy tờ, tiêm phòng và kiểm dịch theo quy định của nước đến.' },
        { title: 'Không gian chăm sóc riêng', desc: 'Store tại Quận 11 được bố trí sạch sẽ, yên tĩnh để các bé thoải mái.' },
        { title: 'Đồng hành sau dịch vụ', desc: 'Luôn sẵn sàng giải đáp qua hotline và Zalo khi bạn cần.' },
      ],
      cta: 'Tìm hiểu thêm',
      cta_link: '#doi-ngu',
    },
    team: {
      eyebrow: 'Đội ngũ Chunora PET',
      title: 'Những người đứng sau *hành trình an toàn* của bé',
      desc: 'Đội ngũ chuyên gia giàu kinh nghiệm, tận tâm và yêu thương động vật.',
      members: [
        { name: '', role: 'Bác sĩ thú y', desc: 'Khám sức khỏe, tiêm phòng và tư vấn dinh dưỡng cho từng bé.', image: '' },
        { name: '', role: 'Chuyên viên thủ tục bay', desc: 'Hoàn thiện hồ sơ, kiểm dịch và thông quan quốc tế.', image: '' },
        { name: '', role: 'Chuyên viên chăm sóc', desc: 'Spa, tắm sấy và chăm sóc bé hằng ngày tại store.', image: '' },
        { name: '', role: 'Chuyên viên tư vấn', desc: 'Đồng hành cùng bạn chọn bé và giải đáp mọi thắc mắc.', image: '' },
      ],
      cta: 'Gặp gỡ đội ngũ',
      cta_link: '#lien-he-cta',
    },
    social_section: {
      eyebrow: 'KÊNH TRUYỀN THÔNG',
      title: 'Kết nối cùng *CHUNORA PET*',
      subtitle: 'Cập nhật các bé mới, mẹo chăm sóc và những hành trình vận chuyển trên các nền tảng.',
      channels: [
        { key: 'instagram', enabled: true, name: 'Instagram', subtext: 'Video & Ảnh', url: '', bg: '#FFF0EB', color: '#E1306C' },
        { key: 'tiktok', enabled: true, name: 'TikTok', subtext: 'Video ngắn', url: '', bg: '#FCE8EF', color: '#111827' },
        { key: 'facebook', enabled: true, name: 'Facebook', subtext: 'Fanpage', url: '', bg: '#EBF3FE', color: '#1877F2' },
        { key: 'whatsapp', enabled: true, name: 'WhatsApp', subtext: 'Liên hệ', url: 'https://wa.me/84396241612', bg: '#E6F4EA', color: '#25D366' },
        { key: 'telegram', enabled: true, name: 'Telegram', subtext: 'Kênh thông báo', url: '', bg: '#E8F4FD', color: '#0088CC' },
        { key: 'zalo', enabled: true, name: 'Zalo', subtext: '(+84) 396 24 1612', url: 'https://zalo.me/0396241612', bg: '#E6F7FF', color: '#0068FF' },
      ],
    },
    stats: {
      items: [
        { value: '2.500+', label: 'Bé cưng đã được phục vụ' },
        { value: '45+', label: 'Đối tác & quốc gia vận chuyển' },
        { value: '5+', label: 'Năm kinh nghiệm' },
        { value: '100%', label: 'Khách hàng hài lòng' },
      ],
    },
    cta: {
      title: 'Sẵn sàng đồng hành cùng thú cưng của bạn',
      desc: 'Liên hệ để được tư vấn mua bán, chăm sóc hoặc vận chuyển phù hợp nhất cho bé.',
      button: 'Liên hệ ngay',
      button_link: '',
      hotline: '',
    },
  };
}

type Obj = Record<string, any>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object';
const has = (o: Obj, k: string) => Object.prototype.hasOwnProperty.call(o, k);
/** PHP `$a ?: $b` cho chuỗi: '' và '0' là "rỗng". */
const or = (a: string, b: string) => (a === '' || a === '0' ? b : a);
/** PHP empty() */
const phpEmpty = (v: unknown) =>
  v === undefined || v === null || v === false || v === 0 || v === '' || v === '0' || (Array.isArray(v) && v.length === 0);
/** PHP: mảng JSON (list hoặc object) → danh sách giá trị */
const listOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : isObj(v) ? Object.values(v) : []);
/** PHP: $arr[$i] với mảng JSON (list hoặc object có khoá số) */
const at = (v: unknown, i: number): unknown => (Array.isArray(v) ? v[i] : isObj(v) ? v[String(i)] : undefined);

/** Liên kết nút: #neo, /đường-dẫn, hoặc http(s). Sai → ''. (about_link) */
export function aboutLink(v: unknown): string {
  const s = cleanText(v, 300);
  if (s === '' || /[\s"'<>]/.test(s)) return '';
  if (/^(https?:\/\/|\/|#|[A-Za-z0-9_\-./]+\.php)/.test(s) && !/^(javascript|data):/i.test(s)) return s;
  return '';
}

/** Video: link YouTube, hoặc tệp mp4/webm (images/... hoặc http(s)). (about_video) */
export function aboutVideo(v: unknown): string {
  const s = cleanText(v, 400);
  if (s === '' || /[\s"'<>]/.test(s)) return '';
  return /^https?:\/\//i.test(s) || (/^images\/[A-Za-z0-9_\-./]+$/.test(s) && !s.includes('..')) ? s : '';
}

/** about_youtube_id */
export function aboutYoutubeId(url: string): string {
  const m = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : '';
}

/**
 * about_em() dạng dữ liệu: tách "*cụm*" thành các đoạn { text, em }.
 * Trang hiển thị bằng component <AboutEm> (components/about/AboutEm.tsx, cùng quy tắc) → chữ + <em>, không dùng HTML thô.
 */
export function aboutEmParts(text: string): { text: string; em: boolean }[] {
  const out: { text: string; em: boolean }[] = [];
  const re = /\*([^*]+)\*/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), em: false });
    out.push({ text: m[1], em: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), em: false });
  return out;
}

export function aboutNormalize(input: unknown): AboutData {
  const d = aboutDefaults();
  const inp: Obj = isObj(input) && !Array.isArray(input) ? input : {};
  const sec = (k: string): Obj => (isObj(inp[k]) ? inp[k] : {});
  const t = (s: Obj, k: string, max: number, def: string, multi = false) => (has(s, k) ? cleanText(s[k], max, multi) : def);
  const out = aboutDefaults();

  const s = sec('story');
  out.story.eyebrow = t(s, 'eyebrow', 60, d.story.eyebrow);
  out.story.title = t(s, 'title', 200, d.story.title);
  out.story.positioning = t(s, 'positioning', 400, d.story.positioning, true);
  out.story.intro = t(s, 'intro', 1200, d.story.intro, true);
  out.story.video = aboutVideo(s.video ?? '');
  out.story.thumbnail = cleanSrc(s.thumbnail ?? '');
  out.story.cta = t(s, 'cta', 60, d.story.cta);

  const w = sec('why');
  out.why.eyebrow = t(w, 'eyebrow', 60, d.why.eyebrow);
  out.why.title = t(w, 'title', 200, d.why.title);
  out.why.desc = t(w, 'desc', 600, d.why.desc, true);
  out.why.image = cleanSrc(w.image ?? '');
  out.why.cta = t(w, 'cta', 60, d.why.cta);
  out.why.cta_link = has(w, 'cta_link') ? aboutLink(w.cta_link) : d.why.cta_link;
  const cards = isObj(w.cards) ? w.cards : [];
  for (const i of [0, 1, 2, 3]) {
    const c = at(cards, i);
    if (isObj(c)) {
      out.why.cards[i] = {
        title: or(cleanText(c.title ?? '', 100), d.why.cards[i].title),
        desc: cleanText(c.desc ?? '', 400, true),
      };
    }
  }

  const m = sec('team');
  out.team.eyebrow = t(m, 'eyebrow', 60, d.team.eyebrow);
  out.team.title = t(m, 'title', 200, d.team.title);
  out.team.desc = t(m, 'desc', 600, d.team.desc, true);
  out.team.cta = t(m, 'cta', 60, d.team.cta);
  out.team.cta_link = has(m, 'cta_link') ? aboutLink(m.cta_link) : d.team.cta_link;
  if (has(m, 'members')) {
    const mem: AboutMember[] = [];
    for (const r of listOf(m.members)) {
      if (!isObj(r)) continue;
      const row: AboutMember = {
        name: cleanText(r.name ?? '', 100),
        role: cleanText(r.role ?? '', 100),
        desc: cleanText(r.desc ?? '', 400, true),
        image: cleanSrc(r.image ?? ''),
      };
      if (row.name !== '' || row.role !== '') mem.push(row);
      if (mem.length >= 24) break;
    }
    out.team.members = mem;
  }

  const so = sec('social_section');
  out.social_section.eyebrow = t(so, 'eyebrow', 60, d.social_section.eyebrow);
  out.social_section.title = t(so, 'title', 200, d.social_section.title);
  out.social_section.subtitle = t(so, 'subtitle', 300, d.social_section.subtitle, true);
  const chIn = isObj(so.channels) ? listOf(so.channels) : [];
  d.social_section.channels.forEach((def, i) => {
    const r = chIn[i];
    if (!isObj(r)) return;
    let url = String(r.url ?? '').trim();
    if (url !== '' && !/^https?:\/\/[^\s"<>]+$/i.test(url)) {
      url = /^[A-Za-z0-9][A-Za-z0-9.\-]*\.[A-Za-z]{2,}(\/[^\s"<>]*)?$/.test(url) ? 'https://' + url : '';
    }
    const ch = out.social_section.channels[i];
    ch.enabled = !phpEmpty(r.enabled) && String(r.enabled) !== '0';
    ch.name = or(cleanText(r.name ?? '', 40), def.name);
    ch.subtext = cleanText(r.subtext ?? '', 60);
    ch.url = url;
  });

  const st = sec('stats');
  const items = isObj(st.items) ? st.items : [];
  for (const i of [0, 1, 2, 3]) {
    const it = at(items, i);
    if (isObj(it)) {
      out.stats.items[i] = {
        value: or(cleanText(it.value ?? '', 20), d.stats.items[i].value),
        label: cleanText(it.label ?? '', 100),
      };
    }
  }

  const c = sec('cta');
  out.cta.title = t(c, 'title', 200, d.cta.title);
  out.cta.desc = t(c, 'desc', 400, d.cta.desc, true);
  out.cta.button = t(c, 'button', 60, d.cta.button);
  out.cta.button_link = aboutLink(c.button_link ?? '');
  out.cta.hotline = cleanText(c.hotline ?? '', 30).replace(/[^0-9+()\s.\-]/g, '');
  return out;
}

/** about_load(&$fromFile): kèm cờ cho biết dữ liệu đọc từ file hay mặc định (trang admin dùng). */
export function aboutLoadWithSource(): { data: AboutData; fromFile: boolean } {
  const raw = readContentJson(ABOUT_FILE);
  if (isObj(raw)) return { data: aboutNormalize(raw), fromFile: true };
  return { data: aboutDefaults(), fromFile: false };
}

export function aboutLoad(): AboutData {
  return aboutLoadWithSource().data;
}

export function aboutSave(data: unknown): boolean {
  return writeContentJson(ABOUT_FILE, aboutNormalize(data));
}
