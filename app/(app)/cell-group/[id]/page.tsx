import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FilterBar } from '@/components/filter/FilterBar';
import { computePct, resolveRange, pctColor } from '@/lib/attendance';
import { avatarColor, initialsOf, shortDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type Cg = { id: string; nama: string; koordinator_id: string | null };
type M = { id: string; nama_baptis: string; nama_lengkap: string };
type Att = { member_id: string; hadir: boolean; events: { id: string; tanggal: string; jenis: string } | null };

const RANGE_OPTIONS = [
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'two', label: '2 Bulan Terakhir' },
  { value: 'all', label: 'Semua' },
  { value: 'custom', label: 'Pilih Rentang Tanggal' },
];

// Port dari viewCgDetail() di mockup.
export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const { data: cg } = await supabase.from('cell_groups').select('id, nama, koordinator_id').eq('id', params.id).maybeSingle<Cg>();
  if (!cg) notFound();
  const { data: ms } = await supabase.from('members').select('id, nama_baptis, nama_lengkap').eq('cell_group_id', cg.id).order('nama_lengkap').returns<M[]>();
  const all = ms || [];
  const ids = all.map((m) => m.id);
  const { data: att } = ids.length
    ? await supabase.from('attendance').select('member_id, hadir, events(id, tanggal, jenis)').in('member_id', ids).returns<Att[]>()
    : { data: [] as Att[] };

  const rangeKey = (searchParams.range || 'month') as 'week' | 'month' | 'two' | 'all' | 'custom';
  const range = resolveRange(rangeKey, searchParams.start, searchParams.end);
  const q = (searchParams.q || '').toLowerCase();
  const rows = (att || []).filter((a) => a.events);
  const name = (m: M) => `${m.nama_baptis} ${m.nama_lengkap}`.trim();
  const koor = all.find((m) => m.id === cg.koordinator_id);
  let koorName = koor ? name(koor) : '—';
  if (!koor && cg.koordinator_id) {
    const { data: k } = await supabase.from('members').select('id, nama_baptis, nama_lengkap').eq('id', cg.koordinator_id).maybeSingle<M>();
    if (k) koorName = name(k);
  }

  const pctOf = (mid: string, jenis: string) =>
    computePct(rows.filter((a) => a.member_id === mid && a.events!.jenis === jenis).map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir })), range);

  const members = all.filter((m) => !q || name(m).toLowerCase().includes(q));

  // Riwayat pertemuan: kegiatan Cell Group dalam rentang, jumlah hadir dari anggota CG ini
  const meetMap = new Map<string, { id: string; tanggal: string; hadir: number }>();
  for (const a of rows) {
    const e = a.events!;
    if (e.jenis !== 'Cell Group' || e.tanggal < range.start || e.tanggal > range.end) continue;
    const cur = meetMap.get(e.id) || { id: e.id, tanggal: e.tanggal, hadir: 0 };
    if (a.hadir) cur.hadir++;
    meetMap.set(e.id, cur);
  }
  const meetings = Array.from(meetMap.values()).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

  return (
    <div className="max-w-2xl">
      <div className="bg-dark text-white rounded-2xl px-5 py-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/cell-group" className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0" aria-label="Kembali"><ArrowLeft size={16} /></Link>
            <div className="text-xl font-extrabold truncate">{cg.nama}</div>
          </div>
          <div className="flex gap-2">
            <Link href={`/cell-group/${cg.id}/edit`} className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center" aria-label="Edit"><Pencil size={16} /></Link>
            <Link href={`/anggota/baru?cg=${cg.id}`} className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center" aria-label="Tambah anggota"><Plus size={16} /></Link>
          </div>
        </div>
        <div className="text-[12.5px] text-white/75 mt-2">{all.length} anggota · koordinator {koorName}</div>
      </div>

      <FilterBar
        searchValue={searchParams.q || ''}
        searchPlaceholder="Cari anggota di cell group ini"
        selects={[{ name: 'range', value: rangeKey, options: RANGE_OPTIONS }]}
        customRange={{ rangeParamName: 'range', rangeValue: 'custom', startName: 'start', endName: 'end', startValue: searchParams.start || '', endValue: searchParams.end || '' }}
      />

      <div className="text-xs font-bold text-muted uppercase mb-2">Anggota</div>
      <div className="flex flex-col gap-2">
        {members.length === 0 && <div className="text-[13px] text-muted2">Tidak ada anggota yang cocok.</div>}
        {members.map((m) => {
          const cgp = pctOf(m.id, 'Cell Group');
          const wnp = pctOf(m.id, 'Worship Night');
          return (
            <Link key={m.id} href={`/anggota/${m.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-[11px]">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: avatarColor(m.id) }}>{initialsOf(m.nama_baptis, m.nama_lengkap)}</span>
              <span className="flex-1 min-w-0 text-sm">
                {name(m)}
                {m.id === cg.koordinator_id && <span className="ml-1 text-[11px] font-bold px-2 py-1 rounded-full bg-accent-light text-accent">Koordinator</span>}
              </span>
              <span className="text-right">
                <div className="text-[11px] font-bold" style={{ color: pctColor(cgp) }}>CG {cgp === null ? '—' : `${cgp}%`}</div>
                <div className="text-[11px] font-bold mt-0.5" style={{ color: pctColor(wnp) }}>WN {wnp === null ? '—' : `${wnp}%`}</div>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-4 mb-2">Riwayat Pertemuan</div>
      <div className="flex flex-col gap-1.5">
        {meetings.length === 0 && <div className="text-[13px] text-muted2">Tidak ada pertemuan pada periode ini.</div>}
        {meetings.map((x) => (
          <Link key={x.id} href={`/kegiatan/${x.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-[11px]">
            <span className="flex-1">
              <div className="text-[13px] font-semibold">Cell Group</div>
              <div className="text-[11px] text-muted2">{shortDate(x.tanggal)} {x.tanggal.slice(0, 4)}</div>
            </span>
            <span className="text-xs font-bold text-accent">{x.hadir} hadir</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
