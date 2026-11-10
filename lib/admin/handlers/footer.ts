import 'server-only';
import { footerDefaults, footerNormalize, footerSave, FOOTER_NETWORKS } from '../../stores/footer';
import { pick, str, values } from '../form';
import type { AdminHandler } from '../types';

/** Lưu "Cấu hình Footer" vào content/footer_settings.json */
export const footerHandler: AdminHandler = {
  match: (post) => 'footer_save' in post,
  async handle({ post }) {
    const pairs = (labels: unknown, urls: unknown) => {
      const u = values(urls);
      return values(labels).map((label, i) => ({ label: str(label), url: str(u[i]) }));
    };
    const social: Record<string, { url: string; enabled: boolean }> = {};
    for (const k of Object.keys(FOOTER_NETWORKS)) {
      social[k] = { url: str(pick(post, 'fs_soc_url', k)), enabled: pick(post, 'fs_soc_on', k) !== undefined };
    }
    const data = footerNormalize(
      {
        brand: {
          name: str(post.fs_brand_name),
          slogan: str(post.fs_brand_slogan),
          show_iata: 'fs_iata' in post,
          show_microchip: 'fs_chip' in post,
        },
        services: { title: str(post.fs_sv_title), links: pairs(post.fs_sv_label, post.fs_sv_url) },
        policies: { title: str(post.fs_po_title), links: pairs(post.fs_po_label, post.fs_po_url) },
        contact: { address: str(post.fs_address), maps_url: str(post.fs_maps), hotline: str(post.fs_hotline), website: str(post.fs_website) },
        social,
        copyright: str(post.fs_copy),
      },
      await footerDefaults(),
    );
    if (footerSave(data)) return { redirect: '/admin?footer_saved=1' };
    return {
      error: { key: 'footerError', msg: 'Không ghi được file content/footer_settings.json. Hãy kiểm tra quyền ghi của thư mục content.' },
      redirect: '/admin?tab=footer',
    };
  },
};
