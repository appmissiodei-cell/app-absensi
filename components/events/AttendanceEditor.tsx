'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { saveAttendance } from '@/app/(app)/kegiatan/actions';
import { avatarColor } from '@/lib/dates';

export type Attendee = { id: string; nama: string; initials: string; cgId: string | null; cgNama: string | null; hadir: boolean };

// Mode edit detail kegiatan — port dari bagian editMode di viewEventDetail().
export function AttendanceEditor({
  eventId,
  done,
  attendees,
  cgOptions,
}: {
  eventId: string;
  done: boolean;
  attendees: Attendee[];
  cgOptions: { id: string; nama: string }[];
}) {
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(attendees.map((a) => [a.id, a.hadir])));
  const [q, setQ] = useState('');
  const [cg, setCg] = useState('Semua');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byCg = useMemo(
    () => attendees.filter((a) => cg === 'Semua' || (cg === 'none' ? !a.cgId : a.cgId === cg)),
    [attendees, cg]
  );
  const visible = byCg.filter((a) => !q || a.nama.toLowerCase().includes(q.toLowerCase()));
  const selCount = byCg.filter((a) => state[a.id]).length;
  const totalSel = attendees.filter((a) => state[a.id]).length;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveAttendance(eventId, attendees.map((a) => ({ member_id: a.id, hadir: !!state[a.id] })), done);
      if (res?.error) setError(res.error);
    });
  }

  const sel = 'flex-1 min-w-[140px] rounded-lg border border-border bg-card px-3 py-2.5 text-sm';
  return (
    <div>
      <div className="flex flex-col gap-2 mt-3">
        <input className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm" placeholder="Cari nama anggota" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={sel} value={cg} onChange={(e) => setCg(e.target.value)}>
          <option value="Semua">Semua Cell Group</option>
          {cgOptions.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          <option value="none">Belum Masuk CG</option>
        </select>
      </div>
      <div className="text-[13px] text-muted text-center my-2.5">{selCount} dari {byCg.length} dipilih hadir</div>

      <div className="flex flex-col gap-2 pb-4">
        {visible.length === 0 && <div className="text-[13px] text-muted2 text-center py-4">Tidak ada nama yang cocok.</div>}
        {visible.map((a) => {
          const checked = !!state[a.id];
          return (
            <button key={a.id} type="button" onClick={() => setState((s) => ({ ...s, [a.id]: !s[a.id] }))}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-[11px] text-left w-full">
              <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 border-2"
                style={{ borderColor: checked ? 'var(--accent)' : '#C9D6EA', background: checked ? 'var(--accent)' : '#fff' }}>
                {checked && <Check size={14} color="#fff" />}
              </span>
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: avatarColor(a.id) }}>{a.initials}</span>
              <span className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{a.nama}</div>
                {a.cgNama && <div className="text-[11px] text-muted">{a.cgNama}</div>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-[68px] lg:bottom-0 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 bg-card border-t border-border">
        {error && <p className="text-sm text-danger font-semibold mb-2">{error}</p>}
        <button type="button" onClick={save} disabled={pending} className="w-full rounded-xl bg-accent text-white font-bold py-3 text-sm disabled:opacity-60">
          {pending ? 'Menyimpan…' : done ? 'Simpan Perubahan Kehadiran' : `Simpan Absensi (${totalSel})`}
        </button>
      </div>
    </div>
  );
}
