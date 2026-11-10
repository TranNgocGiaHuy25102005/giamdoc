import 'server-only';
import React, { Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { decodeEntities, escapeHtml } from '../text';
import { EXTRA_PHRASES, hasVi, norm } from './countries';
import { getI18n } from './current';
import { loadPhrases } from './phrases';
import { INLINE_TAGS, walkHtml, type WalkFn } from './walk-html';
import { getSiteData } from '../site';

/**
 * Bộ dịch trên cây React (thay cho output-buffer i18n_ob của PHP).
 * Dịch ngay lúc render phía server → HTML và dữ liệu RSC giống nhau → không lỗi hydration,
 * và vẫn dùng chung kho bản dịch content/lang/{lang}/phrases.json với hệ thống cũ.
 * Cách tách câu giống hệt PHP: một "đơn vị" = chuỗi chữ liền nhau + các thẻ inline (em, strong, br...).
 */

export interface TCtx {
  fn: WalkFn;
  collect: Set<string> | null;
  telPlaceholder: string | null;
}

const CLIENT_REF = Symbol.for('react.client.reference');
const VOID = new Set(['br', 'wbr', 'img', 'hr', 'input', 'meta', 'link']);
const ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];

/** Tạo bộ dịch cho request hiện tại */
export async function getTranslator(): Promise<TCtx> {
  const cur = await getI18n();
  if (cur.src) {
    const collect = new Set<string>();
    return {
      collect,
      telPlaceholder: null,
      fn: (k) => {
        if (Array.from(k).length <= 1500) collect.add(k);
        return null;
      },
    };
  }
  const dict = cur.lang !== 'vi' ? loadPhrases(cur.lang) : {};
  const site = await getSiteData();
  const toVn: [string, string][] = [];
  const toIntl: [string, string][] = [];
  if (cur.intl && site.vnHotline) {
    toVn.push([site.intlPhone, site.vnHotline]);
    toIntl.push([site.vnHotline, site.intlPhone]);
  }
  if (site.chat.name !== 'Zalo') {
    toVn.push([site.chat.name, 'Zalo']);
    toIntl.push(['Zalo', site.chat.name]);
  }
  const strtr = (s: string, pairs: [string, string][]) => pairs.reduce((a, [f, t]) => a.split(f).join(t), s);
  const variants = (k: string) => [k, k.replace(/"/g, '&quot;').replace(/'/g, '&#039;'), k.replace(/<br>/g, '<br/>'), k.replace(/<br>/g, '<br />')];
  const has = Object.keys(dict).length > 0;
  return {
    collect: null,
    telPlaceholder: cur.intl ? cur.placeholder : null,
    fn: (key) => {
      if (!has) return null;
      for (const k of variants(key)) if (k in dict) return dict[k];
      if (toVn.length) {
        const ck = strtr(key, toVn);
        if (ck !== key) for (const k of variants(ck)) if (k in dict) return strtr(dict[k], toIntl);
      }
      return null;
    },
  };
}

/** Dịch một chuỗi chữ thường (không HTML) — dùng cho metadata, props của client component, thông báo JS. */
export function tText(ctx: TCtx, s: string): string {
  if (!s || !hasVi(s)) return s;
  const rep = ctx.fn(norm(escapeHtml(s).replace(/&#039;/g, "'").replace(/&quot;/g, '"')), 'text') ?? ctx.fn(norm(escapeHtml(s)), 'ld');
  return rep === null ? s : decodeEntities(rep.replace(/<[^>]*>/g, ''));
}

/** Từ điển thông báo JavaScript (window.CP_I18N) */
export function jsDict(ctx: TCtx): Record<string, string> {
  if (ctx.collect) {
    for (const p of EXTRA_PHRASES) ctx.collect.add(norm(escapeHtml(p)));
    return {};
  }
  const out: Record<string, string> = {};
  for (const p of EXTRA_PHRASES) {
    const t = tText(ctx, p);
    if (t !== p) out[p] = t;
  }
  return out;
}

/* ------------------------------------------------------------------ serialize / parse inline HTML */

function cssString(style: Record<string, unknown>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v}`)
    .join('; ');
}

function serializeAttrs(props: Record<string, any>): string {
  let s = '';
  for (const [k, v] of Object.entries(props)) {
    if (k === 'children' || k === 'key' || k === 'ref' || v === undefined || v === null || v === false) continue;
    const name = k === 'className' ? 'class' : k === 'htmlFor' ? 'for' : k;
    if (v === true) s += ' ' + name;
    else if (name === 'style' && typeof v === 'object') s += ` style="${escapeHtml(cssString(v))}"`;
    else if (typeof v === 'string' || typeof v === 'number') s += ` ${name}="${escapeHtml(String(v))}"`;
  }
  return s;
}

const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Phần tử inline thuần (chỉ chứa chữ / inline khác) → chuỗi HTML; không thuần → null */
function inlineHtml(el: ReactElement<any>): string | null {
  const tag = el.type as string;
  const p = el.props ?? {};
  if (p.dangerouslySetInnerHTML) return null;
  if (tag === 'br' || tag === 'wbr') return `<${tag}${serializeAttrs(p)}>`;
  let inner = '';
  for (const c of flatten(p.children)) {
    if (typeof c === 'string' || typeof c === 'number') inner += escText(String(c));
    else if (isValidElement(c) && typeof c.type === 'string' && INLINE_TAGS.has(c.type)) {
      const h = inlineHtml(c);
      if (h === null) return null;
      inner += h;
    } else if (c === null || c === undefined || typeof c === 'boolean') continue;
    else return null;
  }
  return `<${tag}${serializeAttrs(p)}>${inner}</${tag}>`;
}

function parseAttrs(s: string): Record<string, any> {
  const props: Record<string, any> = {};
  for (const m of s.matchAll(/([a-zA-Z_:][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    const name = m[1];
    const val = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
    if (/^on/i.test(name)) continue;
    if (name === 'class') props.className = val;
    else if (name === 'for') props.htmlFor = val;
    else if (name === 'style') {
      const st: Record<string, string> = {};
      for (const decl of val.split(';')) {
        const i = decl.indexOf(':');
        if (i > 0) st[decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = decl.slice(i + 1).trim();
      }
      props.style = st;
    } else props[name] = m[2] === undefined && m[3] === undefined && m[4] === undefined ? true : val;
  }
  return props;
}

/** Bản dịch (HTML inline đơn giản) → các node React */
export function parseInline(html: string): ReactNode[] {
  const root: { children: ReactNode[] } = { children: [] };
  const stack: { tag: string; props: any; children: ReactNode[] }[] = [];
  const top = () => (stack.length ? stack[stack.length - 1] : root);
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^<>]*?)(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(html))) {
    if (m.index > last) top().children.push(decodeEntities(html.slice(last, m.index)));
    last = re.lastIndex;
    const tag = m[2].toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'iframe') continue;
    if (m[1]) {
      const idx = stack.map((s) => s.tag).lastIndexOf(tag);
      if (idx === -1) continue;
      while (stack.length > idx) {
        const s = stack.pop()!;
        top().children.push(React.createElement(s.tag, { ...s.props, key: 'p' + n++ }, ...s.children));
      }
    } else if (VOID.has(tag) || m[4]) {
      top().children.push(React.createElement(tag, { ...parseAttrs(m[3]), key: 'p' + n++ }));
    } else stack.push({ tag, props: parseAttrs(m[3]), children: [] });
  }
  if (last < html.length) top().children.push(decodeEntities(html.slice(last)));
  while (stack.length) {
    const s = stack.pop()!;
    top().children.push(React.createElement(s.tag, { ...s.props, key: 'p' + n++ }, ...s.children));
  }
  return root.children;
}

/* ------------------------------------------------------------------ walk */

function flatten(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  const add = (c: ReactNode) => {
    if (Array.isArray(c)) c.forEach(add);
    else if (isValidElement(c) && c.type === Fragment) add((c.props as any).children);
    else out.push(c);
  };
  add(children);
  return out;
}

const isClientRef = (t: any) => t && (t.$$typeof === CLIENT_REF || typeof t === 'object');

/** Mở rộng component server (hàm) thành phần tử HTML để duyệt được chữ bên trong */
async function expand(node: ReactNode, depth = 0): Promise<ReactNode> {
  if (depth > 50) return node;
  if (Array.isArray(node)) return Promise.all(node.map((c) => expand(c, depth)));
  if (!isValidElement(node)) return node;
  if (node.type === Fragment) return expand((node.props as any).children, depth);
  if (typeof node.type === 'function' && !isClientRef(node.type) && !(node.type as any).prototype?.isReactComponent) {
    const res = await (node.type as any)(node.props);
    return expand(res, depth + 1);
  }
  return node;
}

async function expandList(children: ReactNode): Promise<ReactNode[]> {
  const out: ReactNode[] = [];
  for (const c of flatten(children)) {
    const e = await expand(c);
    out.push(...flatten(e));
  }
  return out;
}

function translateAttrs(ctx: TCtx, tag: string, props: Record<string, any>): Record<string, any> {
  let next = props;
  for (const a of ATTRS) {
    const v = props[a];
    if (typeof v === 'string' && hasVi(v)) {
      const rep = ctx.fn(norm(escapeHtml(v)), 'attr');
      if (rep !== null) {
        if (next === props) next = { ...props };
        next[a] = decodeEntities(rep);
      }
    }
  }
  if (ctx.telPlaceholder && tag === 'input' && props.type === 'tel' && 'placeholder' in props) {
    if (next === props) next = { ...props };
    next.placeholder = ctx.telPlaceholder;
  }
  return next;
}

async function walkChildren(ctx: TCtx, children: ReactNode, textOnly = false): Promise<ReactNode[]> {
  const list = await expandList(children);
  const out: ReactNode[] = [];
  let buf: ReactNode[] = [];
  let bufHtml = '';
  const flush = () => {
    if (!buf.length) return;
    const raw = bufHtml;
    const items = buf;
    buf = [];
    bufHtml = '';
    if (!hasVi(raw)) {
      out.push(...items);
      return;
    }
    const trim = raw.replace(/^\s+/, '');
    const lead = raw.slice(0, raw.length - trim.length);
    const core = trim.replace(/\s+$/, '');
    const tail = trim.slice(core.length);
    const key = norm(core);
    const rep = key ? ctx.fn(key, 'text') : null;
    if (rep === null) {
      out.push(...items);
      return;
    }
    if (lead) out.push(lead);
    if (textOnly) out.push(decodeEntities(rep.replace(/<[^>]*>/g, '')));
    else out.push(...parseInline(rep));
    if (tail) out.push(tail);
  };
  for (const c of list) {
    if (typeof c === 'string' || typeof c === 'number') {
      buf.push(c);
      bufHtml += escText(String(c));
      continue;
    }
    if (c === null || c === undefined || typeof c === 'boolean') continue;
    if (isValidElement(c) && typeof c.type === 'string' && INLINE_TAGS.has(c.type)) {
      const h = inlineHtml(c);
      if (h !== null) {
        buf.push(c);
        bufHtml += h;
        continue;
      }
    }
    flush();
    out.push(await walkNode(ctx, c));
  }
  flush();
  return out;
}

async function walkNode(ctx: TCtx, node: ReactNode): Promise<ReactNode> {
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<any>;
  const props = el.props ?? {};
  if (typeof el.type === 'string') {
    const tag = el.type;
    if (tag === 'style') return el;
    if (tag === 'script') {
      if (props.type === 'application/ld+json' && props.dangerouslySetInnerHTML?.__html) {
        const html = walkHtml(`<script type="application/ld+json">${props.dangerouslySetInnerHTML.__html}</script>`, ctx.fn);
        const inner = html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
        return React.cloneElement(el, { dangerouslySetInnerHTML: { __html: inner } });
      }
      return el;
    }
    const nextProps: Record<string, any> = { ...translateAttrs(ctx, tag, props) };
    delete nextProps.children;
    if (el.key !== null) nextProps.key = el.key;
    if (props.dangerouslySetInnerHTML?.__html) {
      nextProps.dangerouslySetInnerHTML = { __html: walkHtml(String(props.dangerouslySetInnerHTML.__html), ctx.fn) };
      return React.createElement(tag, nextProps);
    }
    if (props.children === undefined || tag === 'textarea') return React.createElement(tag, nextProps, props.children);
    const kids = await walkChildren(ctx, props.children, tag === 'option' || tag === 'title');
    // <title> chỉ nhận MỘT chuỗi (React 19 báo lỗi / không hoist khi children là mảng)
    if (tag === 'title' && kids.every((k) => typeof k === 'string' || typeof k === 'number')) {
      return React.createElement(tag, nextProps, kids.join(''));
    }
    return React.createElement(tag, nextProps, ...kids);
  }
  // client component / phần tử đặc biệt: chỉ duyệt phần children được truyền vào (slot)
  if (props.children !== undefined) {
    const kids = await walkChildren(ctx, props.children);
    const nextProps: Record<string, any> = { ...props };
    delete nextProps.children;
    if (el.key !== null) nextProps.key = el.key;
    return React.createElement(el.type as any, nextProps, ...kids);
  }
  return el;
}

/** Dịch toàn bộ cây React của một trang */
export async function translateTree(ctx: TCtx, tree: ReactNode): Promise<ReactNode> {
  const kids = await walkChildren(ctx, tree);
  return React.createElement(Fragment, null, ...kids);
}
