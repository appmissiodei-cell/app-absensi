// components/ui/PageHeader.tsx
// Port dari header() di mockup (title/sub/right), versi non-dark (list pages).
import type { ReactNode } from 'react';

type Props = {
  title: string;
  sub?: string;
  right?: ReactNode;
};

export function PageHeader({ title, sub, right }: Props) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h1 className="text-lg font-extrabold text-text">{title}</h1>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </div>
  );
}
