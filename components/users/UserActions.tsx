'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toggleUserActive, signOut } from '@/app/(app)/pengaturan/actions';

export function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const color = active ? 'var(--red)' : 'var(--accent)';
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full mt-4 rounded-xl border bg-card font-bold py-2.5 text-sm" style={{ color, borderColor: color }}>
        {active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
      </button>
      {error && <p className="text-sm text-danger font-semibold mt-2">{error}</p>}
      {open && (
        <ConfirmDialog
          title={`${active ? 'Nonaktifkan' : 'Aktifkan'} akun ini?`}
          body={active ? 'User ini tidak akan bisa login sampai diaktifkan kembali.' : 'User ini akan bisa login kembali.'}
          confirmLabel={`Ya, ${active ? 'Nonaktifkan' : 'Aktifkan'}`} danger={active} busy={pending}
          onCancel={() => setOpen(false)}
          onConfirm={() => startTransition(async () => { const r = await toggleUserActive(id); if (r?.error) setError(r.error); setOpen(false); })}
        />
      )}
    </>
  );
}

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => startTransition(() => signOut())}
      className="w-full mt-2.5 rounded-xl border bg-card font-bold py-2.5 text-sm disabled:opacity-60" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
      Keluar / Ganti Akun
    </button>
  );
}
