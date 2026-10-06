'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export type KebabItem =
  | { label: string; href: string; danger?: boolean }
  | { label: string; danger?: boolean; confirm: { title: string; body: string; confirmLabel: string }; action: () => Promise<{ error: string } | undefined | void> };

// Menu titik tiga di header gelap (port dari kebab-menu di mockup).
export function KebabMenu({ items }: { items: KebabItem[] }) {
  const [open, setOpen] = useState(false);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const current = confirmIdx !== null ? items[confirmIdx] : null;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center" aria-label="Menu">
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-40 min-w-[200px] bg-card text-text border border-border rounded-xl shadow-xl overflow-hidden">
            {items.map((it, i) =>
              'href' in it ? (
                <Link key={i} href={it.href} onClick={() => setOpen(false)} className={`block px-4 py-2.5 text-sm font-semibold hover:bg-bg ${it.danger ? 'text-danger' : ''}`}>
                  {it.label}
                </Link>
              ) : (
                <button key={i} type="button" onClick={() => { setOpen(false); setError(null); setConfirmIdx(i); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-bg ${it.danger ? 'text-danger' : ''}`}>
                  {it.label}
                </button>
              )
            )}
          </div>
        </>
      )}
      {current && 'confirm' in current && (
        <ConfirmDialog
          title={current.confirm.title}
          body={error ?? current.confirm.body}
          confirmLabel={current.confirm.confirmLabel}
          danger={current.danger}
          busy={pending}
          onCancel={() => setConfirmIdx(null)}
          onConfirm={() =>
            startTransition(async () => {
              const r = await current.action();
              if (r && 'error' in r && r.error) setError(r.error);
            })
          }
        />
      )}
    </div>
  );
}
