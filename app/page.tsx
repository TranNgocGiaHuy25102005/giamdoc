import { Fragment } from 'react';
import { syncContent } from '@/lib/json-file';
import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { ConsultationForm } from '@/components/forms/ConsultationForm';
import { getSiteData } from '@/lib/site';
import { getCsrfToken } from '@/lib/csrf';
import { pageMetadata } from '@/lib/seo';

/** Trang chủ — port index.php + template.html (nội dung chỉnh trong Admin, lưu MySQL site_content). */
export const dynamic = 'force-dynamic';

const img = (p?: string) => (!p ? '' : /^https?:\/\//i.test(p) ? p : '/' + String(p).replace(/^\/+/, ''));

export async function generateMetadata(): Promise<Metadata> {
  await syncContent();
  const site = await getSiteData();
  const d = site.content;
  return pageMetadata({
    title: String(d.seo?.title ?? 'CHUNORA PET'),
    description: String(d.seo?.description ?? ''),
    path: '/',
    ogTitle: 'CHUNORA PET – Chuỗi dịch vụ thú cưng đa quốc gia',
    ogDescription: `Mua bán · Chăm sóc tại store · Vận chuyển chó mèo quốc tế. Hotline ${site.contact.hotline}.`,
    ogImage: '/images/og-image.png',
  });
}

export default async function HomePage() {
  await syncContent();
  const site = await getSiteData();
  const d: any = site.content;
  const c = site.contact;
  const social = site.social;
  const csrf = await getCsrfToken();
  return (
    <PageShell home active="home" extraKeys={[String(d.seo?.title ?? ''), String(d.seo?.description ?? ''), 'CHUNORA PET – Chuỗi dịch vụ thú cưng đa quốc gia']}>
<section id="top" style={{ background: "#FFF7EF" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "72px 24px 88px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "56px" }}>
<div style={{ flex: "1 1 480px", minWidth: "0", display: "flex", flexDirection: "column", gap: "24px" }}>
<span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid #FFD9B3", fontSize: "13.5px", fontWeight: "600", color: "#B45309" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF9F43" }}></span>{d.hero.badge}</span>
<h1 style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(40px, 5vw, 62px)", lineHeight: "1.1", letterSpacing: "-0.8px", color: "#0A2B63" }}>{d.hero.title_line1}<br />{d.hero.title_line2} <span style={{ fontStyle: "normal", fontWeight: "400", color: "#E2711D" }}>{d.hero.highlight}</span></h1>
<p style={{ margin: "0", fontSize: "18px", lineHeight: "1.75", color: "#3A4D66", maxWidth: "560px" }}>{d.hero.description}</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "4px" }}>
<a href={`tel:${c.hotline_tel}`} style={{ display: "inline-flex", alignItems: "center", gap: "10px", minHeight: "56px", padding: "0 28px", borderRadius: "999px", background: "#0A2B63", color: "#FFFFFF", textDecoration: "none", fontSize: "16px", fontWeight: "600" }}>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path></svg>
Gọi {c.hotline}</a>
<a href={site.cta.chat_url} style={{ display: "inline-flex", alignItems: "center", minHeight: "56px", padding: "0 28px", borderRadius: "999px", background: "#FF9F43", color: "#0A2B63", textDecoration: "none", fontSize: "16px", fontWeight: "700" }}>Nhắn tin {site.cta.chat_name}</a>
</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
<span style={{ padding: "9px 16px", borderRadius: "999px", background: "#E3F5EE", color: "#0B6B52", fontSize: "14px", fontWeight: "600" }}>Mua bán chó mèo</span>
<span style={{ padding: "9px 16px", borderRadius: "999px", background: "#E8F1FD", color: "#1E4E9C", fontSize: "14px", fontWeight: "600" }}>Vận chuyển quốc tế</span>
<span style={{ padding: "9px 16px", borderRadius: "999px", background: "#FDE8EF", color: "#A3264F", fontSize: "14px", fontWeight: "600" }}>Chăm sóc tại store</span>
</div>
</div>
<div style={{ flex: "1 1 460px", minWidth: "0", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
<div style={{ gridRow: "span 2", minHeight: "440px", borderRadius: "28px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(d.hero.image_main)} alt="Xe đẩy chở các lồng thú cưng tại sân bay" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
<div style={{ minHeight: "212px", borderRadius: "24px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(d.hero.image_small)} alt="Hai lồng vận chuyển thú cưng gắn thẻ hành lý" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
<div style={{ minHeight: "212px", borderRadius: "24px", background: "#0A2B63", color: "#FFFFFF", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}>
<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FFB86B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
<span style={{ fontSize: "18px", fontWeight: "600" }}>Vận chuyển quốc tế</span>
<span style={{ fontSize: "14px", lineHeight: "1.6", color: "#C5D5EC" }}>Hỗ trợ giấy tờ và kiểm dịch cho bé.</span>
</div>
</div>
</div>
</div>
</section>

<section id="dich-vu" aria-labelledby="dv-title" style={{ background: "#FFFFFF" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "104px 24px", display: "flex", flexDirection: "column", gap: "52px" }}>
<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "20px 40px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "640px" }}>
<span style={{ fontSize: "13px", letterSpacing: "3px", fontWeight: "700", color: "#E2711D" }}>DỊCH VỤ CỦA CHÚNG TÔI</span>
<h2 id="dv-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(32px, 3.6vw, 46px)", lineHeight: "1.18", color: "#0A2B63" }}>Ba dịch vụ cốt lõi, <span style={{ fontStyle: "normal", fontWeight: "400" }}>một chuẩn mực</span></h2>
</div>
<p style={{ margin: "0", maxWidth: "420px", fontSize: "16px", lineHeight: "1.75", color: "#3A4D66" }}>Mỗi dịch vụ được xây dựng quanh sức khỏe và sự an toàn của thú cưng, với thông tin minh bạch cho chủ nuôi.</p>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
<article id="mua-ban" style={{ background: "#FFFFFF", border: "1px solid #E3EAF5", borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 14px 34px -22px rgba(10,43,99,0.3)" }}>
<div style={{ height: "200px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(d.services.mua_ban.image)} alt="Mèo con tai cụp lông xám bạc" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }} /></div>
<div style={{ padding: "30px 30px 26px", display: "flex", flexDirection: "column", gap: "16px", flex: "1" }}>
<span style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: "999px", background: "#E3F5EE", color: "#0B6B52", fontSize: "12.5px", fontWeight: "700", letterSpacing: "1px" }}>01 · MUA BÁN</span>
<h3 style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontSize: "23px", fontWeight: "400", color: "#0A2B63" }}>{d.services.mua_ban.title}</h3>
<p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.75", color: "#3A4D66" }}>{d.services.mua_ban.description}</p>
<ul style={{ margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", fontSize: "15px", color: "#10233F" }}>
{(d.services?.mua_ban?.bullets ?? []).map((it: any, i: number) => (<Fragment key={i}><li style={{ display: "flex", gap: "10px", alignItems: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F8A6A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{it}</li></Fragment>))}
</ul>
<a href="#tu-van" style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", fontSize: "15px", fontWeight: "700", color: "#0B6B52", textDecoration: "none" }}>Nhận tư vấn chọn bé<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a>
</div>
</article>
<article id="van-chuyen" style={{ background: "#FFFFFF", border: "1px solid #E3EAF5", borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 14px 34px -22px rgba(10,43,99,0.3)" }}>
<div style={{ height: "200px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(d.services.van_chuyen.image)} alt="Các lồng thú cưng chờ làm thủ tục tại quầy sân bay" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
<div style={{ padding: "30px 30px 26px", display: "flex", flexDirection: "column", gap: "16px", flex: "1" }}>
<span style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: "999px", background: "#E8F1FD", color: "#1E4E9C", fontSize: "12.5px", fontWeight: "700", letterSpacing: "1px" }}>02 · VẬN CHUYỂN</span>
<h3 style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontSize: "23px", fontWeight: "400", color: "#0A2B63" }}>{d.services.van_chuyen.title}</h3>
<p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.75", color: "#3A4D66" }}>{d.services.van_chuyen.description}</p>
<ul style={{ margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", fontSize: "15px", color: "#10233F" }}>
{(d.services?.van_chuyen?.bullets ?? []).map((it: any, i: number) => (<Fragment key={i}><li style={{ display: "flex", gap: "10px", alignItems: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A5DAA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{it}</li></Fragment>))}
</ul>
<a href="#tu-van" style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", fontSize: "15px", fontWeight: "700", color: "#1E4E9C", textDecoration: "none" }}>Nhận báo giá vận chuyển<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a>
</div>
</article>
<article id="cham-soc" style={{ background: "#FFFFFF", border: "1px solid #E3EAF5", borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 14px 34px -22px rgba(10,43,99,0.3)" }}>
<div style={{ height: "200px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(d.services.cham_soc.image)} alt="Mèo con bên trụ cào móng tại store" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }} /></div>
<div style={{ padding: "30px 30px 26px", display: "flex", flexDirection: "column", gap: "16px", flex: "1" }}>
<span style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: "999px", background: "#FDE8EF", color: "#A3264F", fontSize: "12.5px", fontWeight: "700", letterSpacing: "1px" }}>03 · CHĂM SÓC</span>
<h3 style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontSize: "23px", fontWeight: "400", color: "#0A2B63" }}>{d.services.cham_soc.title}</h3>
<p style={{ margin: "0", fontSize: "15.5px", lineHeight: "1.75", color: "#3A4D66" }}>{d.services.cham_soc.description}</p>
<ul style={{ margin: "0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "9px", fontSize: "15px", color: "#10233F" }}>
{(d.services?.cham_soc?.bullets ?? []).map((it: any, i: number) => (<Fragment key={i}><li style={{ display: "flex", gap: "10px", alignItems: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2366A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{it}</li></Fragment>))}
</ul>
<a href="#tu-van" style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", fontSize: "15px", fontWeight: "700", color: "#A3264F", textDecoration: "none" }}>Đặt lịch chăm sóc<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a>
</div>
</article>
</div>
</div>
</section>

<section id="ve-chunora" aria-labelledby="vs-title" style={{ background: "#0A2B63", color: "#FFFFFF" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "100px 24px", display: "flex", flexWrap: "wrap", gap: "56px" }}>
<div style={{ flex: "1 1 360px", minWidth: "0", display: "flex", flexDirection: "column", gap: "18px" }}>
<span style={{ fontSize: "13px", letterSpacing: "3px", fontWeight: "700", color: "#FFB86B" }}>VÌ SAO CHỌN CHUNORA PET</span>
<h2 id="vs-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(32px, 3.6vw, 44px)", lineHeight: "1.2" }}>Tận tâm với từng bé, <span style={{ fontStyle: "normal", fontWeight: "400", color: "#BCD4F4" }}>rõ ràng với từng chủ nuôi</span></h2>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.75", color: "#D6E4F7" }}>Chúng tôi tin một dịch vụ thú cưng tốt bắt đầu từ sự minh bạch và trách nhiệm trong từng chi tiết nhỏ.</p>
<div style={{ marginTop: "10px", minHeight: "220px", borderRadius: "22px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(d.team_image)} alt="Mèo con được bế trên tay người chăm sóc" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }} /></div>
</div>
<div style={{ flex: "2 1 560px", minWidth: "0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
<div style={{ background: "#FFFFFF", color: "#10233F", borderRadius: "20px", padding: "30px 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#FFF0E2", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C25E0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h5"></path></svg></span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Minh bạch thông tin</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Nguồn gốc, sức khỏe và hồ sơ của bé được trao đổi rõ ràng trước khi bạn quyết định.</span>
</div>
<div style={{ background: "#FFFFFF", color: "#10233F", borderRadius: "20px", padding: "30px 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#E8F1FD", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E4E9C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path></svg></span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Thủ tục quốc tế</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Hướng dẫn chi tiết giấy tờ, tiêm phòng và kiểm dịch theo quy định của nước đến.</span>
</div>
<div style={{ background: "#FFFFFF", color: "#10233F", borderRadius: "20px", padding: "30px 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#E3F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path></svg></span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Không gian chăm sóc riêng</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Store tại Quận 11 được bố trí sạch sẽ, yên tĩnh để các bé thoải mái.</span>
</div>
<div style={{ background: "#FFFFFF", color: "#10233F", borderRadius: "20px", padding: "30px 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#FDE8EF", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A3264F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2-5.3A8.5 8.5 0 1 1 21 11.5z"></path></svg></span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Đồng hành sau dịch vụ</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Luôn sẵn sàng giải đáp qua hotline và Zalo khi bạn cần.</span>
</div>
</div>
</div>
</section>

<section aria-labelledby="qt-title" style={{ background: "#FFFFFF" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "104px 24px", display: "flex", flexDirection: "column", gap: "48px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "680px" }}>
<span style={{ fontSize: "13px", letterSpacing: "3px", fontWeight: "700", color: "#E2711D" }}>QUY TRÌNH VẬN CHUYỂN QUỐC TẾ</span>
<h2 id="qt-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(30px, 3.4vw, 42px)", lineHeight: "1.2", color: "#0A2B63" }}>Hành trình của bé, <span style={{ fontStyle: "normal", fontWeight: "400" }}>từng bước rõ ràng</span></h2>
</div>
<ol style={{ margin: "0", padding: "0", listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
<li style={{ background: "#FFF7EF", borderRadius: "20px", padding: "28px 26px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#FF9F43", color: "#0A2B63", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "17px" }}>1</span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Tư vấn &amp; báo giá</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Tiếp nhận thông tin bé, điểm đi, điểm đến và thời gian mong muốn.</span>
</li>
<li style={{ background: "#E8F1FD", borderRadius: "20px", padding: "28px 26px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#2A5DAA", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "17px" }}>2</span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Chuẩn bị giấy tờ</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Hướng dẫn tiêm phòng, kiểm dịch và hồ sơ theo yêu cầu của nước đến.</span>
</li>
<li style={{ background: "#E3F5EE", borderRadius: "20px", padding: "28px 26px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#0F8A6A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "17px" }}>3</span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Vận chuyển an toàn</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Bé đi trong lồng đạt chuẩn, được theo dõi và cập nhật cho bạn.</span>
</li>
<li style={{ background: "#FDE8EF", borderRadius: "20px", padding: "28px 26px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#C2366A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "17px" }}>4</span>
<span style={{ fontSize: "18px", fontWeight: "600", color: "#0A2B63" }}>Bàn giao tận tay</span>
<span style={{ fontSize: "15px", lineHeight: "1.7", color: "#3A4D66" }}>Đón bé tại điểm đến và bàn giao cho gia đình.</span>
</li>
</ol>
</div>
</section>

<section aria-labelledby="gl-title" style={{ background: "#F7F9FD" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "flex", flexDirection: "column", gap: "40px" }}>
<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 40px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "13px", letterSpacing: "3px", fontWeight: "700", color: "#E2711D" }}>THƯ VIỆN ẢNH</span>
<h2 id="gl-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(30px, 3.4vw, 42px)", lineHeight: "1.2", color: "#0A2B63" }}>Các bé tại <span style={{ fontStyle: "normal", fontWeight: "400" }}>CHUNORA PET</span></h2>
</div>
<a href="/tin-tuc" style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", fontSize: "15px", fontWeight: "700", color: "#0A2B63", textDecoration: "none" }}>Xem thêm trên các kênh<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></a>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
{(d.gallery ?? []).map((it: any, i: number) => (<Fragment key={i}><div style={{ aspectRatio: "1 / 1", borderRadius: "20px", position: "relative", overflow: "hidden" }}><img loading="lazy" src={img(it.image)} alt={it.alt} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }} /></div></Fragment>))}
</div>
</div>
</section>

<section id="truyen-thong" aria-labelledby="tt-title" style={{ background: "#FFFFFF" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px 24px", display: "flex", flexWrap: "wrap", gap: "48px", alignItems: "center" }}>
<div style={{ flex: "1 1 340px", minWidth: "0", display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "13px", letterSpacing: "3px", fontWeight: "700", color: "#E2711D" }}>KÊNH TRUYỀN THÔNG</span>
<h2 id="tt-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(30px, 3.4vw, 42px)", lineHeight: "1.2", color: "#0A2B63" }}>Kết nối cùng <span style={{ fontStyle: "normal", fontWeight: "400" }}>CHUNORA PET</span></h2>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.75", color: "#3A4D66" }}>Cập nhật các bé mới, mẹo chăm sóc và những hành trình vận chuyển trên các nền tảng.</p>
</div>
<div style={{ flex: "2 1 560px", minWidth: "0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
<a href={social.youtube} style={{ background: "#FFFFFF", border: "1px solid #DCE5F2", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "#0A2B63" }}>
<span style={{ width: "46px", height: "46px", flex: "none", borderRadius: "12px", background: "#FFF0E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C25E0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "16px", fontWeight: "600" }}>Intagram</span><span style={{ fontSize: "13px", color: "#5A6E88" }}>Video &amp; Ảnh</span></span></a>
<a href={social.tiktok} style={{ background: "#FFFFFF", border: "1px solid #DCE5F2", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "#0A2B63" }}>
<span style={{ width: "46px", height: "46px", flex: "none", borderRadius: "12px", background: "#FDE8EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A3264F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18V5l11-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="17" cy="16" r="3"></circle>
    </svg>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "16px", fontWeight: "600" }}>TikTok</span><span style={{ fontSize: "13px", color: "#5A6E88" }}>Video ngắn</span></span></a>
<a href={social.facebook} style={{ background: "#FFFFFF", border: "1px solid #DCE5F2", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "#0A2B63" }}>
<span style={{ width: "46px", height: "46px", flex: "none", borderRadius: "12px", background: "#E8F1FD", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E4E9C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "16px", fontWeight: "600" }}>Facebook</span><span style={{ fontSize: "13px", color: "#5A6E88" }}>Fanpage</span></span></a>
<a href={social.x} style={{ background: "#FFFFFF", border: "1px solid #DCE5F2", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "#0A2B63" }}>
<span style={{ width: "46px", height: "46px", flex: "none", borderRadius: "12px", background: "#EEF1F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E9E49" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        <path d="M9.5 9.5a1.2 1.2 0 0 0-.2.6c-.2 1.1.7 2.6 1.8 3.7 1.1 1.1 2.6 2 3.7 1.8.3 0 .5-.1.6-.2l1.1-1.1c.2-.2.2-.6 0-.8l-1.5-1.5c-.2-.2-.6-.2-.8 0l-.5.5c-.1.1-.3.1-.4 0-.6-.3-1.4-1.1-1.7-1.7 0-.1 0-.3.1-.4l.5-.5c.2-.2.2-.6 0-.8L11.2 8.4c-.2-.2-.6-.2-.8 0l-.9 1.1z"></path>
      </svg>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "16px", fontWeight: "600" }}>WhatsApp</span><span style={{ fontSize: "13px", color: "#5A6E88" }}>Liên hệ</span></span></a>
<a href={social.telegram} style={{ background: "#FFFFFF", border: "1px solid #DCE5F2", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "#0A2B63" }}>
<span style={{ width: "46px", height: "46px", flex: "none", borderRadius: "12px", background: "#E0F3FB", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B6E99" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4 20-7z"></path></svg></span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "16px", fontWeight: "600" }}>Telegram</span><span style={{ fontSize: "13px", color: "#5A6E88" }}>Kênh thông báo</span></span></a>
<a href={social.zalo} style={{ background: "#FFFFFF", border: "1px solid #DCE5F2", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", color: "#0A2B63" }}>
<span style={{ width: "46px", height: "46px", flex: "none", borderRadius: "12px", background: "#E3F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2-5.3A8.5 8.5 0 1 1 21 11.5z"></path>
    </svg>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "16px", fontWeight: "600" }}>Zalo</span><span style={{ fontSize: "13px", color: "#5A6E88" }}>{c.hotline}</span></span></a>
</div>
</div>
</section>

<section id="lien-he" aria-labelledby="lh-title" style={{ background: "#FFF7EF" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "104px 24px", display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "stretch" }}>
<div style={{ flex: "1 1 400px", minWidth: "0", display: "flex", flexDirection: "column", gap: "22px" }}>
<span style={{ fontSize: "13px", letterSpacing: "3px", fontWeight: "700", color: "#E2711D" }}>LIÊN HỆ</span>
<h2 id="lh-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "clamp(30px, 3.4vw, 42px)", lineHeight: "1.2", color: "#0A2B63" }}>Ghé thăm store hoặc <span style={{ fontStyle: "normal", fontWeight: "400" }}>gọi cho chúng tôi</span></h2>
<div style={{ display: "flex", flexDirection: "column", background: "#FFFFFF", border: "1px solid #F3E2D0", borderRadius: "20px", overflow: "hidden" }}>
<div style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "22px 24px", borderBottom: "1px solid #F3E2D0" }}>
<span style={{ width: "44px", height: "44px", flex: "none", borderRadius: "12px", background: "#FFF0E2", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C25E0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"></path><circle cx="12" cy="10" r="2.5"></circle></svg></span>
<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span style={{ fontSize: "12.5px", letterSpacing: "1.5px", color: "#B45309", fontWeight: "700" }}>TRỤ SỞ CHÍNH</span><span style={{ fontSize: "16px", lineHeight: "1.6", color: "#10233F" }}>{c.address}</span>
<a href={c.maps_url} style={{ fontSize: "14px", fontWeight: "600", color: "#0A2B63", padding: "6px 0" }}>Xem chỉ đường trên Google Maps</a></div>
</div>
<div style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "22px 24px", borderBottom: "1px solid #F3E2D0" }}>
<span style={{ width: "44px", height: "44px", flex: "none", borderRadius: "12px", background: "#E3F5EE", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B6B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path></svg></span>
<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span style={{ fontSize: "12.5px", letterSpacing: "1.5px", color: "#0B6B52", fontWeight: "700" }}>HOTLINE</span><a href={`tel:${c.hotline_tel}`} style={{ fontSize: "22px", fontWeight: "700", color: "#0A2B63", textDecoration: "none" }}>{c.hotline}</a></div>
</div>
<div style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "22px 24px" }}>
<span style={{ width: "44px", height: "44px", flex: "none", borderRadius: "12px", background: "#E8F1FD", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E4E9C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path></svg></span>
<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span style={{ fontSize: "12.5px", letterSpacing: "1.5px", color: "#1E4E9C", fontWeight: "700" }}>WEBSITE</span><span style={{ fontSize: "16px", color: "#10233F" }}>{c.domain}</span></div>
</div>
</div>
</div>
<form id="tu-van" name="tu-van" method="POST" action="/contact.php" data-api="/api/send-consultation" aria-labelledby="form-title" style={{ flex: "1 1 420px", minWidth: "0", background: "#0A2B63", color: "#FFFFFF", borderRadius: "24px", padding: "40px 36px", display: "flex", flexDirection: "column", gap: "18px", boxShadow: "0 30px 60px -30px rgba(10,43,99,0.55)" }}>
<input type="hidden" name="csrf_token" value={csrf} />
<input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: "0" }} />
<h3 id="form-title" style={{ margin: "0", fontFamily: "'Pattaya', 'Playfair Display', serif", fontWeight: "400", fontSize: "30px" }}>Đăng ký tư vấn</h3>
<p style={{ margin: "0 0 6px", fontSize: "15px", lineHeight: "1.7", color: "#D6E4F7" }}>Để lại thông tin, CHUNORA PET sẽ liên hệ lại với bạn.</p>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#D6E4F7" }}>Họ và tên
<input type="text" name="ho_ten" required placeholder="Nguyễn Văn A" style={{ minHeight: "50px", padding: "0 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#FFFFFF", fontFamily: "inherit", fontSize: "15px" }} />
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#D6E4F7" }}>Số điện thoại
<input type="tel" name="so_dien_thoai" required placeholder={site.cta.phone_placeholder} style={{ minHeight: "50px", padding: "0 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#FFFFFF", fontFamily: "inherit", fontSize: "15px" }} />
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#D6E4F7" }}>Dịch vụ quan tâm
<select name="dich_vu" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.22)", background: "#123A7A", color: "#FFFFFF", fontFamily: "inherit", fontSize: "15px" }}>
<option value="Mua bán chó mèo">Mua bán chó mèo</option>
<option value="Vận chuyển đa quốc gia">Vận chuyển đa quốc gia</option>
<option value="Chăm sóc tại store">Chăm sóc tại store</option>
</select>
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#D6E4F7" }}>Bạn muốn nhận tư vấn qua đâu?
<select name="kenh_tu_van" id="kenh-tu-van" defaultValue={site.chat.name} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.22)", background: "#123A7A", color: "#FFFFFF", fontFamily: "inherit", fontSize: "15px" }}>
<option value="">Chọn kênh nhận tư vấn</option>
<option>Zalo</option>
<option>Telegram</option>
<option>WhatsApp</option>
<option>Facebook</option>
<option>Instagram</option>
</select>
</label>
<label id="kenh-lien-he-wrap" style={{ display: "none", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#D6E4F7" }}><span id="kenh-lien-he-label">Link hoặc số điện thoại</span>
<input type="text" name="kenh_lien_he" id="kenh-lien-he" maxLength={200} autoComplete="off" placeholder="" style={{ minHeight: "50px", padding: "0 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#FFFFFF", fontFamily: "inherit", fontSize: "15px" }} />
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#D6E4F7" }}>Lời nhắn
<textarea name="loi_nhan" rows={3} placeholder="Giống chó mèo, điểm đến, thời gian…" style={{ padding: "14px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#FFFFFF", fontFamily: "inherit", fontSize: "15px", resize: "vertical" }}></textarea>
</label>
<button type="submit" style={{ marginTop: "6px", minHeight: "54px", border: "none", borderRadius: "999px", background: "#FF9F43", color: "#0A2B63", fontFamily: "inherit", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>Gửi yêu cầu tư vấn</button>
</form>
</div>
</section>


      <ConsultationForm formId="tu-van" />
    </PageShell>
  );
}
