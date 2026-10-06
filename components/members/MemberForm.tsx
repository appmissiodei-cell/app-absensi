'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { saveMember, deleteMember } from '@/app/(app)/anggota/actions';
import { PELAYANAN_LIST } from '@/lib/constants';

export type MemberFormValues = {
  id?: string;
  nama_baptis: string;
  nama_lengkap: string;
  nik: string;
  no_hp: string;
  email: string;
  cell_group_id: string;
  pelayanan: string[];
  tanggal_lahir: string;
  wedding_anniversary: string;
  status: 'Aktif' | 'Tidak Aktif';
};

export const EMPTY_MEMBER: MemberFormValues = {
  nama_baptis: '',
  nama_lengkap: '',
  nik: '',
  no_hp: '',
  email: '',
  cell_group_id: '',
  pelayanan: [],
  tanggal_lahir: '',
  wedding_anniversary: '',
  status: 'Aktif',
};

const input =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent';
const label = 'block text-xs font-bold text-muted mb-1';

export function MemberForm({
  initial,
  cellGroups,
  cancelHref,
  canDelete = false,
}: {
  initial: MemberFormValues;
  cellGroups: { id: string; nama: string }[];
  cancelHref: string;
  canDelete?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<'save' | 'delete' | null>(null);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const isNew = !initial.id;

  // Submit form (validasi HTML lolos) -> tampilkan dialog konfirmasi dulu
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPendingData(new FormData(e.currentTarget));
    setConfirm('save');
  }

  function runConfirmed() {
    const action = confirm;
    startTransition(async () => {
      const res =
        action === 'delete' ? await deleteMember(initial.id!) : pendingData ? await saveMember(pendingData) : undefined;
      // sukses -> redirect dari server; kalau sampai sini berarti gagal
      if (res?.error) {
        setError(res.error);
        setConfirm(null);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-2xl">
      <p className="text-xs text-muted2">Setiap anggota hanya bisa tergabung di 1 cell group.</p>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nama_baptis">Nama Baptis</label>
          <input id="nama_baptis" name="nama_baptis" defaultValue={initial.nama_baptis} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="nama_lengkap">Nama Lengkap *</label>
          <input id="nama_lengkap" name="nama_lengkap" required defaultValue={initial.nama_lengkap} className={input} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="nik">NIK</label>
          <input id="nik" name="nik" inputMode="numeric" defaultValue={initial.nik} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="no_hp">No. HP</label>
          <input id="no_hp" name="no_hp" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" defaultValue={initial.no_hp} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={initial.email} className={input} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="cell_group_id">Cell Group</label>
          <select id="cell_group_id" name="cell_group_id" defaultValue={initial.cell_group_id} className={input}>
            <option value="">Belum Masuk CG</option>
            {cellGroups.map((c) => (
              <option key={c.id} value={c.id}>{c.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial.status} className={input}>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="tanggal_lahir">Tanggal Lahir</label>
          <input id="tanggal_lahir" name="tanggal_lahir" type="date" defaultValue={initial.tanggal_lahir} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="wedding_anniversary">Wedding Anniversary</label>
          <input id="wedding_anniversary" name="wedding_anniversary" type="date" defaultValue={initial.wedding_anniversary} className={input} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <label className={label} htmlFor={`pelayanan-${i}`}>
              Pelayanan {i + 1}{i > 0 ? ' (opsional)' : ''}
            </label>
            <select id={`pelayanan-${i}`} name="pelayanan" defaultValue={initial.pelayanan[i] ?? ''} className={input}>
              <option value="">— Tidak ada —</option>
              {PELAYANAN_LIST.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-danger font-semibold">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-60"
        >
          {isNew ? 'Simpan Anggota' : 'Simpan Perubahan'}
        </button>
        <Link href={cancelHref} className="px-4 py-2 rounded-lg border border-border bg-bg text-sm font-semibold">
          Batal
        </Link>
      </div>

      {canDelete && !isNew && (
        <div className="pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => { setError(null); setConfirm('delete'); }}
            className="px-4 py-2 rounded-lg border border-danger text-danger text-sm font-bold"
          >
            Hapus Anggota
          </button>
        </div>
      )}

      {confirm === 'save' && (
        <ConfirmDialog
          title={isNew ? 'Simpan anggota baru?' : 'Simpan perubahan?'}
          body="Data akan langsung tersimpan."
          confirmLabel="Ya, Simpan"
          busy={pending}
          onConfirm={runConfirmed}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="Hapus anggota ini?"
          body="Anggota akan dihapus permanen dan tidak bisa dibatalkan. Anggota yang masih tercatat hadir di absensi tidak bisa dihapus."
          confirmLabel="Ya, Hapus"
          danger
          busy={pending}
          onConfirm={runConfirmed}
          onCancel={() => setConfirm(null)}
        />
      )}
    </form>
  );
}
