import { getSiteData } from '@/lib/site';
import { CountryPop, CountrySwitchDesktop, CountrySwitchMobile, ChatFab, Greeting } from './I18nWidgets';
import { Logo } from './Logo';

/**
 * Header + menu chính + menu điện thoại (port từ template.html / site-chrome.php).
 * - home: đang ở trang chủ → link neo "#..." giữ nguyên; trang con → "/#..."
 * - active: mục menu đang xem (home | mua-ban | van-chuyen | cham-soc | ve-chunora | tin-tuc)
 */
export async function SiteHeader({ home = false, active = 'home' }: { home?: boolean; active?: string }) {
  const site = await getSiteData();
  const contact = site.contact;
  const a = (hash: string) => (home ? hash : hash === '#top' ? '/' : '/' + hash);
  const nav = (cls: string, key: string) =>
    key === active
      ? { className: cls + ' is-active', 'data-nav': key, 'aria-current': 'page' as const }
      : { className: cls, 'data-nav': key };
  return (
    <header className="site-hd">
      <Greeting />
<div className="hd-top" style={{ borderBottom: "1px solid #E3EAF5" }}>
<div className="hd-in" style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", padding: "18px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px 32px" }}>
<CountryPop />
<button type="button" className="sn-burger sn-top-burger" id="sn-open" aria-label="Mở menu" aria-controls="sn-drawer" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
<CountrySwitchMobile />
<a href={a("#top")} style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", minWidth: "0" }}>
<Logo />
<span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 22px", minWidth: "0" }}>
<span style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
<span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "34px", color: "#0A2B63" }}>Chunora</span>
<span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: "600", fontSize: "15px", letterSpacing: "8px", color: "#2A5DAA", marginTop: "4px" }}>PET</span>
</span>
<span style={{ width: "1px", height: "48px", background: "#D6E1F0" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
<span style={{ fontSize: "12.5px", fontWeight: "700", letterSpacing: "2px", color: "#E2711D" }}>CHUỖI DỊCH VỤ THÚ CƯNG ĐA QUỐC GIA</span>
<span style={{ fontSize: "14.5px", lineHeight: "1.5", color: "#3A4D66" }}>Mua bán · Chăm sóc tại store · Vận chuyển chó mèo quốc tế</span>
</span>
</span>
</a>
<div className="hd-right" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 28px" }}>
<a href={`tel:${contact.hotline_tel}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
<span style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#FFF0E2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C25E0A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path></svg></span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "12.5px", color: "#5A6E88", fontWeight: "600" }}>Hotline tư vấn</span><span style={{ fontSize: "18px", fontWeight: "700", color: "#0A2B63" }}>{contact.hotline}</span></span>
</a>
<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
<span style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#E8F1FD", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E4E9C" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"></path><circle cx="12" cy="10" r="2.5"></circle></svg></span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "12.5px", color: "#5A6E88", fontWeight: "600" }}>Trụ sở chính</span><span style={{ fontSize: "15px", fontWeight: "600", color: "#0A2B63" }}>{contact.address_short}</span></span>
</div>
<a href={a("#tu-van")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "50px", padding: "0 26px", borderRadius: "999px", background: "#FF9F43", color: "#0A2B63", textDecoration: "none", fontSize: "15px", fontWeight: "700" }}>Đăng ký tư vấn</a>
</div>
</div>
</div>
<nav id="site-nav" className="sn" aria-label="Điều hướng chính">
<div className="sn-in">
<div className="sn-links">
<a {...nav("sn-link", "home")} href={a("#top")}>Trang chủ</a>
<a {...nav("sn-link", "mua-ban")} href={"/mua-ban"}>Mua bán chó mèo</a>
<a {...nav("sn-link", "van-chuyen")} href={"/van-chuyen-quoc-te"}>Vận chuyển quốc tế</a>
<a {...nav("sn-link", "cham-soc")} href={"/cham-soc-tai-store"}>Chăm sóc tại store</a>
<a {...nav("sn-link", "ve-chunora")} href={"/ve-chunora"}>Về Chunora</a>
<a {...nav("sn-link", "tin-tuc")} href={"/tin-tuc"}>Tin tức</a>
</div>
<div className="sn-right">
<CountrySwitchDesktop />
<a className="sn-tel" href={`tel:${contact.hotline_tel}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg><span>{contact.hotline}</span></a>
<a className="sn-btn" href={a("#lien-he")}>Liên hệ</a>
</div>
</div>
</nav>
<div className="sn-backdrop" id="sn-backdrop" aria-hidden="true"></div>
<aside className="sn-drawer" id="sn-drawer" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true" tabIndex={-1}>
<div className="sn-dh"><a className="sn-logo sm" href={a("#top")}>Chunora PET</a><button type="button" className="sn-burger" id="sn-close" aria-label="Đóng menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button></div>
<div className="sn-db">
<div className="sn-grp">
<a {...nav("sn-di", "home")} href={a("#top")}>Trang chủ</a>
<a {...nav("sn-di", "ve-chunora")} href={"/ve-chunora"}>Về Chunora</a>
</div>
<p className="sn-gt">Dịch vụ cốt lõi</p>
<div className="sn-grp">
<a {...nav("sn-di", "mua-ban")} href={"/mua-ban"}>🐾 Mua bán chó mèo</a>
<a {...nav("sn-di", "van-chuyen")} href={"/van-chuyen-quoc-te"}>✈️ Vận chuyển quốc tế</a>
<a {...nav("sn-di", "cham-soc")} href={"/cham-soc-tai-store"}>✂️ Chăm sóc tại store</a>
</div>
<p className="sn-gt">Nội dung &amp; Thông tin</p>
<div className="sn-grp">
<a {...nav("sn-di", "tin-tuc")} href={"/tin-tuc"}>📰 Tin tức &amp; Cẩm nang</a>
<a className="sn-di sn-addr" href={contact.maps_url} target="_blank" rel="noopener">📍 {contact.address}</a>
</div>
</div>
<div className="sn-df">
<a className="sn-dcall" href={`tel:${contact.hotline_tel}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg><span>{contact.hotline}</span></a>
<a className="sn-dcta" href={a("#tu-van")}>Đăng ký tư vấn ngay</a>
</div>
</aside>

      <ChatFab />
      <button type="button" className="sn-totop" id="sn-totop" aria-label="Lên đầu trang"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg></button>
    </header>
  );
}
