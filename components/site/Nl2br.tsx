import { Fragment } from 'react';

/** Tương đương nl2br(h($text)) của PHP */
export function Nl2br({ text }: { text: string }) {
  const lines = String(text ?? '').split(/\r?\n/);
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {i > 0 ? '\n' + l : l}
        </Fragment>
      ))}
    </>
  );
}
