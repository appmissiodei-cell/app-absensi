import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FilterBar } from '@/components/filter/FilterBar';
import { KebabMenu, type KebabItem } from '@/components/ui/KebabMenu';
import { PicCard } from '@/components/events/PicCard';
import { AttendanceEditor, type Attendee } from '@/components/events/AttendanceEditor';
import { deleteEvent } from '../actions';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { fmtDate, isDone, avatarColor, initialsOf } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type Ev = { id: string; jenis: string; tanggal: string; jam: string; keterangan: string | null; kolekte: number | null; pic: Record<string, string> | null };
type M = { id: string; nama_baptis: string; nama_lengkap: string; status: string; cell_group_id: string | null; cell_groups: { nama: string } | null };
type A = { member_id: string; hadir: boolean };

export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: ev }, { data: att }, { data: members }, { data: cgs }, { data: profile }] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).maybeSingle<Ev>(),
    supabase.from('attendance').select('member_id, hadir').eq('event_id', params.id).returns<A[]>(),
    supabase.from('members').select('id, nama_baptis, nama_lengkap, status, cell_group_id, cell_groups(nama)').returns<M[]>(),
    supabase.from('cell_groups').select('id, nama').order('nama').returns<{ id: string; nama: string }[]>(),
    supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle(),
  ]);
  if (!ev) notFound();

  const superadmin = isSuperadmin(profile as unknown as Profile | null);
  const done = isDone(ev.tanggal);
  const editMode = !done || searchParams.edit === '1';
  const activeCg = searchParams.cg || 'Semua';

  const hadirMap = new Map((att || []).map((a) => [a.member_id, a.hadir]));
  // Peserta: anggota aktif (atau yang sudah punya baris absensi); khusus Cell Group hanya yang punya CG.
  const attendees: Attendee[] = (members || [])
    .filter((m) => (m.status === 'Aktif' || hadirMap.has(m.id)) && (ev.jenis !== 'Cell Group' || !!m.cell_group_id))
    .map((m) => ({
      id: m.id,
      nama: `${m.nama_baptis} ${m.nama_lengkap}`.trim(),
      initials: initialsOf(m.nama_baptis, m.nama_lengkap),
      cgId: m.cell_group_id,
      cgNama: m.cell_groups?.nama ?? null,
      hadir: hadirMap.get(m.id) ?? false,
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const kebab: KebabItem[] = done
    ? [
        { label: 'Edit Detail Event', href: `/kegiatan/${ev.id}/edit` },
        { label: 'Edit Detail Kehadiran', href: `/kegiatan/${ev.id}?edit=1` },
        ...(superadmin ? [{ label: 'Hapus Event', danger: true, confirm: { title: 'Hapus kegiatan ini?', body: 'Data absensi kegiatan ini juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.', confirmLabel: 'Ya, Hapus' }, action: deleteEvent.bind(null, ev.id) } as KebabItem] : []),
      ]
    : [
        { label: 'Edit Kegiatan', href: `/kegiatan/${ev.id}/edit` },
        ...(superadmin ? [{ label: 'Hapus Kegiatan', danger: true, confirm: { title: 'Hapus kegiatan ini?', body: 'Kegiatan yang belum berlangsung ini akan dihapus dari jadwal.', confirmLabel: 'Ya, Hapus' }, action: deleteEvent.bind(null, ev.id) } as KebabItem] : []),
      ];

  const header = (
    <div className="bg-dark text-white rounded-2xl px-5 py-4 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/kegiatan" className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0" aria-label="Kembali"><ArrowLeft size={16} /></Link>
          <div className="text-xl font-extrabold truncate">{ev.jenis}</div>
        </div>
        <KebabMenu items={kebab} />
      </div>
      <div className="text-[12.5px] text-white/75 mt-2">
        {fmtDate(ev.tanggal)} · {ev.jam.slice(0, 5)}{editMode && <> · <b className="text-white">Mode Edit</b></>}
      </div>
      {ev.keterangan && <span className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15">Keterangan: {ev.keterangan}</span>}
    </div>
  );

  const pic = ev.jenis === 'Worship Night' ? <PicCard pic={ev.pic} kolekte={ev.kolekte} /> : null;

  if (editMode) {
    return (
      <div className="max-w-2xl">
        {header}
        {pic}
        <AttendanceEditor eventId={ev.id} done={done} attendees={attendees} cgOptions={cgs || []} />
      </div>
    );
  }

  const visible = attendees.filter((a) => activeCg === 'Semua' || (activeCg === 'none' ? !a.cgId : a.cgId === activeCg));
  const hadir = visible.filter((a) => a.hadir);
  const absen = visible.filter((a) => !a.hadir);
  const pct = visible.length ? Math.round((hadir.length / visible.length) * 100) : 0;
  const cgOpts = [{ value: 'Semua', label: 'Semua Cell Group' }, ...(cgs || []).map((c) => ({ value: c.id, label: c.nama })), { value: 'none', label: 'Belum Masuk CG' }];

  const row = (a: Attendee, ok: boolean) => (
    <Link key={a.id} href={`/anggota/${a.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-[11px]" style={{ opacity: ok ? 1 : 0.6 }}>
      <span className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: ok ? avatarColor(a.id) : '#C7CCC7' }}>{a.initials}</span>
      <span className="flex-1 min-w-0 text-sm">
        {a.nama}
        {a.cgNama && <div className="text-[11px] text-muted mt-px">{a.cgNama}</div>}
      </span>
      {ok ? <Check size={18} color="var(--accent)" /> : <X size={18} color="var(--muted2)" />}
    </Link>
  );

  return (
    <div className="max-w-2xl">
      {header}
      <FilterBar selects={[{ name: 'cg', value: activeCg, options: cgOpts }]} />
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-muted uppercase">Jumlah Hadir</div>
          <div className="text-[28px] font-extrabold mt-1">{hadir.length} <span className="text-sm font-semibold text-muted">dari {visible.length}</span></div>
        </div>
        <div className="w-[52px] h-[52px] rounded-full bg-accent-light text-accent flex items-center justify-center font-extrabold text-[13px]">{pct}%</div>
      </div>
      {pic}
      <div className="text-xs text-muted2 text-center mt-2.5">Ketuk nama untuk lihat data anggota · gunakan menu ⋮ untuk ubah kehadiran</div>
      <div className="mt-4 text-xs font-bold text-muted uppercase">Hadir ({hadir.length})</div>
      <div className="flex flex-col gap-2 mt-2">{hadir.map((a) => row(a, true))}</div>
      <div className="mt-4 text-xs font-bold text-muted uppercase">Tidak Hadir ({absen.length})</div>
      <div className="flex flex-col gap-2 mt-2">{absen.map((a) => row(a, false))}</div>
    </div>
  );
}
