import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/fetch-all';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/filter/FilterBar';
import { SortTh } from '@/components/ui/SortTh';
import { computePct, resolveRange, pctColor } from '@/lib/attendance';

export const dynamic = 'force-dynamic';

type CgRow = { id: string; nama: string; koordinator_id: string | null };
type MemberRow = { id: string; cell_group_id: string | null };
type AttendanceJoinRow = { member_id: string; hadir: boolean; events: { tanggal: string; jenis: string } | null };
type KoordinatorRow = { id: string; nama_baptis: string; nama_lengkap: string };

export default async function CellGroupPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = await createClient();

  const [{ data: cgs }, { data: members }, attendanceRows] = await Promise.all([
    supabase.from('cell_groups').select('id, nama, koordinator_id').returns<CgRow[]>(),
    supabase.from('members').select('id, cell_group_id').returns<MemberRow[]>(),
    fetchAllRows<AttendanceJoinRow>((from, to) =>
      supabase.from('attendance').select('member_id, hadir, events(tanggal, jenis)').order('id').range(from, to)
    ),
  ]);

  const allCgs = cgs || [];
  const allMembers = members || [];
  const allAttendance = attendanceRows || [];

  const koordinatorIds = allCgs.map((c) => c.koordinator_id).filter(Boolean) as string[];
  const { data: koordinators } = koordinatorIds.length
    ? await supabase.from('members').select('id, nama_baptis, nama_lengkap').in('id', koordinatorIds).returns<KoordinatorRow[]>()
    : { data: [] as KoordinatorRow[] };
  const koordinatorName = (id: string | null) => {
    const k = (koordinators || []).find((x) => x.id === id);
    return k ? `${k.nama_baptis} ${k.nama_lengkap}` : '—';
  };

  const q = (searchParams.q || '').toLowerCase();
  const sort = searchParams.sort || 'nama';
  const dir = (searchParams.dir as 'asc' | 'desc') || 'asc';
  const range = resolveRange('month');

  function aggregatePct(cgId: string, jenis: 'Cell Group' | 'Worship Night') {
    const memberIds = allMembers.filter((m) => m.cell_group_id === cgId).map((m) => m.id);
    const vals = memberIds
      .map((mid) => {
        const rows = allAttendance
          .filter((a) => a.member_id === mid && a.events?.jenis === jenis)
          .map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir }));
        return computePct(rows, range);
      })
      .filter((v): v is number => v !== null);
    if (!vals.length) return null;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }

  const filteredCgs = allCgs.filter((c) => !q || c.nama.toLowerCase().includes(q));
  const withData = filteredCgs.map((c) => ({
    c,
    memberCount: allMembers.filter((m) => m.cell_group_id === c.id).length,
    koordinator: koordinatorName(c.koordinator_id),
    cgPct: aggregatePct(c.id, 'Cell Group'),
    wnPct: aggregatePct(c.id, 'Worship Night'),
  }));

  withData.sort((a, b) => {
    let cmp = 0;
    if (sort === 'anggota') cmp = a.memberCount - b.memberCount;
    else if (sort === 'koordinator') cmp = a.koordinator.localeCompare(b.koordinator);
    else if (sort === 'cg') cmp = (a.cgPct ?? -1) - (b.cgPct ?? -1);
    else if (sort === 'wn') cmp = (a.wnPct ?? -1) - (b.wnPct ?? -1);
    else cmp = a.c.nama.localeCompare(b.c.nama); // 'nama'
    return dir === 'asc' ? cmp : -cmp;
  });

  const unassigned = allMembers.filter((m) => !m.cell_group_id).length;

  return (
    <div>
      <PageHeader
        title="Cell Group"
        sub={`${allCgs.length} cell group aktif`}
        right={
          <Link href="/cell-group/baru" className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center flex-shrink-0">
            <Plus size={16} />
          </Link>
        }
      />

      <FilterBar searchValue={searchParams.q || ''} searchPlaceholder="Cari nama cell group" />

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <SortTh label="Nama" sortKey="nama" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="Anggota" sortKey="anggota" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="Koordinator" sortKey="koordinator" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="% CG" sortKey="cg" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="% WN" sortKey="wn" currentSort={sort} currentDir={dir} searchParams={searchParams} />
            </tr>
          </thead>
          <tbody>
            {withData.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted2 text-sm py-6">
                  Tidak ada cell group yang cocok.
                </td>
              </tr>
            )}
            {withData.map(({ c, memberCount, koordinator, cgPct, wnPct }) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg cursor-pointer">
                <td className="p-0">
                  <Link href={`/cell-group/${c.id}`} className="block px-1.5 py-2.5 text-[12.5px] font-bold">
                    {c.nama}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/cell-group/${c.id}`} className="block px-1.5 py-2.5 text-[12.5px]">
                    {memberCount}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/cell-group/${c.id}`} className="block px-1.5 py-2.5 text-[12.5px]">
                    {koordinator}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/cell-group/${c.id}`} className="block px-1.5 py-2.5 text-[12.5px] font-bold whitespace-nowrap" style={{ color: pctColor(cgPct) }}>
                    {cgPct === null ? '—' : `${cgPct}%`}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/cell-group/${c.id}`} className="block px-1.5 py-2.5 text-[12.5px] font-bold whitespace-nowrap" style={{ color: pctColor(wnPct) }}>
                    {wnPct === null ? '—' : `${wnPct}%`}
                  </Link>
                </td>
              </tr>
            ))}
            <tr className="text-muted">
              <td className="px-1.5 py-2.5 text-[12.5px] font-bold">
                <Link href="/anggota?cg=none">Belum Masuk CG</Link>
              </td>
              <td className="px-1.5 py-2.5 text-[12.5px]">{unassigned}</td>
              <td className="px-1.5 py-2.5 text-[12.5px]">—</td>
              <td className="px-1.5 py-2.5 text-[12.5px]">—</td>
              <td className="px-1.5 py-2.5 text-[12.5px]">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
