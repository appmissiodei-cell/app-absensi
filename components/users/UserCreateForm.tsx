'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PasswordBox } from '@/components/users/PasswordBox';
import { createUser } from '@/app/(app)/pengaturan/actions';

const input = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent';
const label = 'block text-xs font-bold text-muted mb-1';

export function UserCreateForm() {
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [data, setData] = useState<FormData | null>(null);
  const [created, setCreated] = useState<{ id: string; email: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (created) {
    return (
      <div className="max-w-2xl">
        <div className="bg-accent-light border border-border rounded-2xl p-4 mb-4 text-sm">
          User <b>{created.email}</b> berhasil dibuat. Berikan email dan password di bawah ini kepada yang bersangkutan.
        </div>
        <div className="text-xs font-bold text-muted uppercase mb-2">Kata Sandi</div>
        <PasswordBox initialPassword={created.password} confirmTitle="Buat password baru?" resetAction={async () => ({ error: 'Buka halaman detail user untuk membuat password baru.' })} />
        <Link href={`/pengaturan/users/${created.id}`} className="block text-center mt-4 rounded-xl bg-accent text-white font-bold py-3 text-sm">Lihat Detail User</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(null); setData(new FormData(e.currentTarget)); setConfirm(true); }}
      className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-2xl"
    >
      <div>
        <label className={label} htmlFor="nama">Nama</label>
        <input id="nama" name="nama" required placeholder="cth. Yohanes Adi" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="email">Email (untuk login)</label>
        <input id="email" name="email" type="email" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue="admin" className={input}>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>
      <p className="text-xs text-muted2">Password akan dibuat otomatis setelah disimpan.</p>
      {error && <p className="text-sm text-danger font-semibold">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-60">Simpan User</button>
        <Link href="/pengaturan/users" className="px-4 py-2 rounded-lg border border-border bg-bg text-sm font-semibold">Batal</Link>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Tambah user baru?" body="Password akan dibuat otomatis dan bisa dilihat/disalin setelah ini."
          confirmLabel="Ya, Tambah" busy={pending} onCancel={() => setConfirm(false)}
          onConfirm={() => startTransition(async () => {
            const r = data ? await createUser(data) : undefined;
            setConfirm(false);
            if (r && 'error' in r) setError(r.error);
            else if (r) setCreated({ id: r.id!, email: r.email!, password: r.password });
          })}
        />
      )}
    </form>
  );
}
