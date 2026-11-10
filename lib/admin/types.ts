import type { PhpObject } from './form';

/** Trạng thái dựng trang admin (thay cho $_GET / biến lỗi của PHP) */
export interface AdminState {
  /** tham số URL (?saved=1, ?pets_saved=1, ?edit=12 …) */
  q: Record<string, string>;
  /** lỗi từ lần lưu trước: key = tên biến lỗi PHP (vd. 'petsError', 'careError', 'error'), msg = nội dung */
  flash: { key: string; msg: string } | null;
  csrf: string;
}

export type AdminResult =
  | { redirect: string }
  | { json: unknown }
  | { error: { key: string; msg: string }; redirect: string };

export interface AdminCtx {
  post: PhpObject;
  files: PhpObject;
}

/** Bộ xử lý POST của 1 tab: match() nhận diện form (vd. post.pets_save), handle() xử lý */
export interface AdminHandler {
  match: (post: PhpObject) => boolean;
  handle: (ctx: AdminCtx) => Promise<AdminResult>;
}

/** Lỗi của tab hiện tại (nếu flash đúng key) */
export const flashFor = (st: AdminState, key: string): string => (st.flash && st.flash.key === key ? st.flash.msg : '');
