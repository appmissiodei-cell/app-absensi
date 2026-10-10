import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { dateLong, todayISO, initialsOf } from '@/lib/dates';
import { ScanClient, type Person } from '@/components/events/ScanClient';

export const dynamic = 'force-dynamic';

type Ev = { id: string; jenis: string; tanggal: string; jam: string };
type M = { id: string; nama_baptis: string; nama_lengkap: string; status: string; cell_group_id: string | null; cell_groups: { nama: string } | null };
type A = { member_id: string; hadir: boolean; checked_in_at: string | null };

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: ev } = await supabase.from('events').select('id, jenis, tanggal, jam').eq('id', params.id).maybeSingle<Ev>();
  if (!ev) notFound();

  if (ev.tanggal < todayISO()) {
    return (
      <div className="max-w-md mx-auto mt-6 bg-card border border-border rounded-3xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center mx-auto"><Lock size={20} /></div>
        <h1 className="text-lg font-extrabold mt-3">Scan sudah ditutup</h1>
        <p className="text-sm text-muted mt-1">Kegiatan {ev.jenis} tanggal {dateLong(ev.tanggal)} sudah lewat. Untuk mengubah kehadiran, gunakan edit manual.</p>
        <Link href={`/kegiatan/${ev.id}?edit=1`} className="inline-block mt-4 rounded-xl bg-accent text-white font-bold text-sm px-4 py-2.5">Edit Detail Kehadiran</Link>
        <div><Link href={`/kegiatan/${ev.id}`} className="inline-block mt-3 text-sm text-muted font-semibold">Kembali</Link></div>
      </div>
    );
  }

  const [{ data: members }, { data: att }] = await Promise.all([
    supabase.from('members').select('id, nama_baptis, nama_lengkap, status, cell_group_id, cell_groups!members_cell_group_id_fkey(nama)').returns<M[]>(),
    supabase.from('attendance').select('member_id, hadir, checked_in_at').eq('event_id', ev.id).returns<A[]>(),
  ]);
  const hadirMap = new Map((att || []).map((a) => [a.member_id, a]));
  const people: Person[] = (members || [])
    .filter((m) => hadirMap.get(m.id)?.hadir || (m.status === 'Aktif' && (ev.jenis !== 'Cell Group' || !!m.cell_group_id)))
    .map((m) => ({
      id: m.id,
      nama: `${m.nama_baptis} ${m.nama_lengkap}`.trim(),
      initials: initialsOf(m.nama_baptis, m.nama_lengkap),
      cg: m.cell_groups?.nama ?? null,
      hadir: !!hadirMap.get(m.id)?.hadir,
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="max-w-md mx-auto">
      <div className="hero rounded-3xl px-5 py-4 mb-3">
        <div className="flex items-center gap-2.5">
          <Link href={`/kegiatan/${ev.id}`} className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0" aria-label="Kembali"><ArrowLeft size={16} /></Link>
          <div className="min-w-0">
            <div className="text-lg font-extrabold truncate">Scan Kehadiran</div>
            <div className="text-[12.5px] text-white/75">{ev.jenis} · {dateLong(ev.tanggal)} · {ev.jam.slice(0, 5)}</div>
          </div>
        </div>
      </div>
      <ScanClient eventId={ev.id} people={people} />
    </div>
  );
}
