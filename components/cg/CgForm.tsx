'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { saveCellGroup, deleteCellGroup } from '@/app/(app)/cell-group/actions';

const input = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent';
const label = 'block text-xs font-bold text-muted mb-1';

// Port dari viewAddCG() & viewEditCG() di mockup.
export function CgForm({
  id,
  nama,
  koordinatorId,
  members,
  memberCount,
  cancelHref,
  canDelete,
}: {
  id?: string;
  nama: string;
  koordinatorId: string;
  members: { id: string; nama: string }[];
  memberCount: number;
  cancelHref: string;
  canDelete: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'save' | 'delete' | null>(null);
  const [data, setData] = useState<FormData | null>(null);
  const [pending, startTransition] = useTransition();
  const isNew = !id;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setData(new FormData(e.currentTarget));
    setConfirm('save');
  }
  function run() {
    const action = confirm;
    startTransition(async () => {
      const res = action === 'delete' ? await deleteCellGroup(id!) : data ? await saveCellGroup(data) : undefined;
      if (res?.error) { setError(res.error); setConfirm(null); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-2xl">
      {id && <input type="hidden" name="id" value={id} />}
      <div>
        <label className={label} htmlFor="nama">Nama Cell Group</label>
        <input id="nama" name="nama" required defaultValue={nama} placeholder="cth. Yohanes" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="koordinator_id">Koordinator</label>
        <select id="koordinator_id" name="koordinator_id" defaultValue={koordinatorId} className={input}>
          <option value="">— Pilih anggota —</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </select>
      </div>
      {isNew && (
        <p className="text-xs text-muted2 leading-relaxed">
          Anggota bisa ditambahkan ke cell group ini lewat halaman Edit Anggota, dengan memilih nama cell group ini.
        </p>
      )}
      {error && <p className="text-sm text-danger font-semibold">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-60">
          {isNew ? 'Simpan Cell Group' : 'Simpan Perubahan'}
        </button>
        <Link href={cancelHref} className="px-4 py-2 rounded-lg border border-border bg-bg text-sm font-semibold">Batal</Link>
      </div>
      {canDelete && !isNew && (
        <div className="pt-3 border-t border-border">
          <button type="button" onClick={() => { setError(null); setConfirm('delete'); }} className="px-4 py-2 rounded-lg border border-danger text-danger text-sm font-bold">
            Hapus Cell Group
          </button>
        </div>
      )}
      {confirm === 'save' && (
        <ConfirmDialog
          title={isNew ? 'Buat cell group baru?' : 'Simpan perubahan?'}
          body={isNew ? 'Cell group baru akan langsung muncul di daftar.' : 'Perubahan akan langsung berlaku.'}
          confirmLabel="Ya, Simpan" busy={pending} onConfirm={run} onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="Hapus cell group ini?"
          body={`${memberCount > 0 ? `${memberCount} anggota di cell group ini akan dipindahkan ke status Belum Masuk CG. ` : ''}Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Ya, Hapus" danger busy={pending} onConfirm={run} onCancel={() => setConfirm(null)}
        />
      )}
    </form>
  );
}
