import 'server-only';
import type { AdminHandler, AdminState } from './types';
import { footerHandler } from './handlers/footer';
import { contentHandler } from './handlers/content';
import { renderFooterPane } from './panes/footer';
// Các tab "Nội dung navbar" — mỗi tab 1 file pane (HTML) + 1 handler (POST) + 1 script public/admin/<tab>.js
import { petsHandler } from './handlers/pets';
import { renderPetsPane } from './panes/pets';
import { careHandler } from './handlers/care';
import { renderCarePane } from './panes/care';
import { transportHandler } from './handlers/transport';
import { renderTransportPane } from './panes/transport';
import { aboutHandler } from './handlers/about';
import { renderAboutPane } from './panes/about';
import { newsHandlers } from './handlers/news';
import { renderNewsPane } from './panes/news';
import { multilangHandlers } from './handlers/multilang';
import { renderMultilangPane } from './panes/multilang';

/** Thứ tự kiểm tra giống chuỗi if/elseif của admin/index.php; contentHandler (form chính) luôn ở cuối */
export const HANDLERS: AdminHandler[] = [
  petsHandler,
  ...multilangHandlers,
  ...newsHandlers,
  aboutHandler,
  transportHandler,
  careHandler,
  footerHandler,
  contentHandler,
];

/** Các tab sau phần nội dung trang chủ, theo đúng thứ tự trong trang admin cũ */
export const PANES: ((st: AdminState) => Promise<string>)[] = [
  renderFooterPane,
  renderPetsPane,
  renderCarePane,
  renderTransportPane,
  renderAboutPane,
  renderNewsPane,
  renderMultilangPane,
];

/** Script riêng của từng tab (public/admin/*.js), nạp sau admin.js */
export const PANE_SCRIPTS = ['footer', 'pets', 'care', 'transport', 'about', 'news', 'multilang'];
