import { Fragment, type ReactNode } from 'react';

/**
 * Port about_em(): tiêu đề có "*cụm*" → chữ + <em>cụm</em> (React nodes, không dùng HTML thô)
 * để bộ dịch tách câu giống PHP (em là thẻ inline → cùng một đơn vị dịch).
 */
export function AboutEm({ text }: { text: string }) {
  const s = String(text ?? '');
  const nodes: ReactNode[] = [];
  const re = /\*([^*]+)\*/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={i++}>{s.slice(last, m.index)}</Fragment>);
    nodes.push(<em key={i++}>{m[1]}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) nodes.push(<Fragment key={i++}>{s.slice(last)}</Fragment>);
  return <>{nodes}</>;
}
