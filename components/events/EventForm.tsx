'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { saveEvent, deleteEvent } from '@/app/(app)/kegiatan/actions';
import { JENIS_KEGIATAN_TYPES, WN_ROLE_DEFS } from '@/lib/constants';

export type EventFormValues = {
  id?: string;
  jenis: string;
  tanggal: string;
  jam: string;
  keterangan: string;
  kolekte: string;
  pic: Record<string, string>;
};

const input = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent';
const label = 'block text-xs font-bold text-muted mb-1';

// Port dari viewEditEventMeta() di mockup (tambah & edit kegiatan).
export function EventForm({
  initial,
  cancelHref,
  isDone,
  canDelete,
}: {
  initial: EventFormValues;
  cancelHref: string;
  isDone: boolean;
  canDelete: boolean;
}) {
  const [jenis, setJenis] = useState(initial.jenis);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'save' | 'delete' | null>(null);
  const [data, setData] = useState<FormData | null>(null);
  const [pending, startTransition] = useTransition();
  const isNew = !initial.id;
  let lastGroup: string | null = null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setData(new FormData(e.currentTarget));
    setConfirm('save');
  }
  function run() {
    const action = confirm;
    startTransition(async () => {
      const res = action === 'delete' ? await deleteEvent(initial.id!) : data ? await saveEvent(data) : undefined;
      if (res?.error) { setError(res.error); setConfirm(null); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-2xl">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {!isNew && isDone && (
        <div className="rounded-xl border border-[#F3D9A8] bg-amber-light p-3 text-xs text-amber">
          Kegiatan ini sudah selesai dan sudah punya data absensi. Mengubah detail tidak mengubah data yang sudah masuk di Log Absensi.
        </div>
      )}

      <div>
        <label className={label} htmlFor="jenis">Jenis Kegiatan</label>
        <select id="jenis" name="jenis" value={jenis} onChange={(e) => setJenis(e.target.value)} className={input}>
          {JENIS_KEGIATAN_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="tanggal">Tanggal</label>
          <input id="tanggal" name="tanggal" type="date" required defaultValue={initial.tanggal} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="jam">Jam</label>
          <input id="jam" name="jam" type="time" required defaultValue={initial.jam} className={input} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="keterangan">Keterangan (opsional)</label>
        <textarea id="keterangan" name="keterangan" rows={3} defaultValue={initial.keterangan} placeholder="cth. tema, lokasi, catatan lain" className={input} />
      </div>

      {jenis === 'Worship Night' ? (
        <div>
          <div className="text-xs font-bold text-muted uppercase mb-2.5">PIC Bertugas (Worship Night)</div>
          <div className="border border-border rounded-xl p-3">
            {WN_ROLE_DEFS.map((r) => {
              const group = 'group' in r ? r.group : undefined;
              let header: React.ReactNode = null;
              if (group && group !== lastGroup) {
                header = <div className="text-[11px] font-bold text-accent uppercase mt-2.5 mb-1.5">{group}</div>;
                lastGroup = group;
              } else if (!group) lastGroup = null;
              const lbl = group ? r.label.split('— ')[1] : r.label;
              return (
                <div key={r.key}>
                  {header}
                  <div className="mb-2.5">
                    <label className={label} htmlFor={`pic_${r.key}`}>{lbl}</label>
                    <input id={`pic_${r.key}`} name={`pic_${r.key}`} defaultValue={initial.pic[r.key] || ''} placeholder="Nama petugas" className={input} />
                  </div>
                </div>
              );
            })}
            <div className="mt-1.5">
              <label className={label} htmlFor="kolekte">Jumlah Kolekte Terkumpul (opsional)</label>
              <input id="kolekte" name="kolekte" inputMode="numeric" defaultValue={initial.kolekte} placeholder="cth. 2100000" className={input} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted2">PIC bertugas hanya berlaku untuk kegiatan Worship Night.</p>
      )}

      {error && <p className="text-sm text-danger font-semibold">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold disabled:opacity-60">
          {isNew ? 'Simpan Kegiatan' : 'Simpan Perubahan'}
        </button>
        <Link href={cancelHref} className="px-4 py-2 rounded-lg border border-border bg-bg text-sm font-semibold">Batal</Link>
      </div>

      {canDelete && !isNew && (
        <div className="pt-3 border-t border-border">
          <button type="button" onClick={() => { setError(null); setConfirm('delete'); }} className="px-4 py-2 rounded-lg border border-danger text-danger text-sm font-bold">
            Hapus Kegiatan
          </button>
        </div>
      )}

      {confirm === 'save' && (
        <ConfirmDialog
          title={isNew ? 'Simpan kegiatan baru?' : 'Simpan perubahan?'}
          body="Kegiatan akan langsung muncul di daftar kegiatan."
          confirmLabel="Ya, Simpan" busy={pending} onConfirm={run} onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="Hapus kegiatan ini?"
          body="Data absensi kegiatan ini juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan."
          confirmLabel="Ya, Hapus" danger busy={pending} onConfirm={run} onCancel={() => setConfirm(null)}
        />
      )}
    </form>
  );
}
