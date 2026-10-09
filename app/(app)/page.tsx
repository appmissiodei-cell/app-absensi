import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/filter/FilterBar';
import { SortTh } from '@/components/ui/SortTh';
import { PELAYANAN_LIST } from '@/lib/constants';
import { computePct, resolveRange, pctColor } from '@/lib/attendance';

export const dynamic = 'force-dynamic';

type MemberRow = {
  id: string;
  nama_baptis: string;
  nama_lengkap: string;
  status: 'Aktif' | 'Tidak Aktif';
  pelayanan: string[];
  cell_group_id: string | null;
  cell_groups: { nama: string } | null;
};

type AttendanceJoinRow = {
  member_id: string;
  hadir: boolean;
  events: { tanggal: string; jenis: string } | null;
};

const PEL_OPTIONS = [{ value: 'Semua', label: 'Semua Pelayanan' }, ...PELAYANAN_LIST.map((p) => ({ value: p, label: p }))];
const STATUS_OPTIONS = [
  { value: 'Semua', label: 'Status: Semua' },
  { value: 'Aktif', label: 'Status: Aktif' },
  { value: 'Tidak Aktif', label: 'Status: Tidak Aktif' },
];
const RANGE_OPTIONS = [
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'two', label: '2 Bulan Terakhir' },
  { value: 'all', label: 'Semua' },
  { value: 'custom', label: 'Pilih Rentang Tanggal' },
];

export default async function AnggotaPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = await createClient();

  const [{ data: members }, { data: attendanceRows }] = await Promise.all([
    supabase
      .from('members')
      .select('id, nama_baptis, nama_lengkap, status, pelayanan, cell_group_id, cell_groups!members_cell_group_id_fkey(nama)')
      .returns<MemberRow[]>(),
    supabase
      .from('attendance')
      .select('member_id, hadir, events(tanggal, jenis)')
      .returns<AttendanceJoinRow[]>(),
  ]);

  const allMembers = members || [];
  const allAttendance = attendanceRows || [];

  const q = (searchParams.q || '').toLowerCase();
  const filterPel = searchParams.pel || 'Semua';
  const filterStatus = searchParams.status || 'Semua';
  const rangeKey = (searchParams.range || 'month') as 'week' | 'month' | 'two' | 'all' | 'custom';
  const sort = searchParams.sort || 'nama';
  const dir = (searchParams.dir as 'asc' | 'desc') || 'asc';

  const range = resolveRange(rangeKey, searchParams.start, searchParams.end);

  const fullName = (m: MemberRow) => `${m.nama_baptis} ${m.nama_lengkap}`;
  const cgName = (m: MemberRow) => m.cell_groups?.nama || 'Belum Masuk CG';

  function pctFor(memberId: string, jenis: 'Cell Group' | 'Worship Night') {
    const rows = allAttendance
      .filter((a) => a.member_id === memberId && a.events?.jenis === jenis)
      .map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir }));
    return computePct(rows, range);
  }

  const filtered = allMembers.filter((m) => {
    const matchesPel = filterPel === 'Semua' || m.pelayanan.includes(filterPel);
    const matchesStatus = filterStatus === 'Semua' || m.status === filterStatus;
    const matchesQ = !q || fullName(m).toLowerCase().includes(q);
    return matchesPel && matchesStatus && matchesQ;
  });

  const withPct = filtered.map((m) => ({
    m,
    cg: pctFor(m.id, 'Cell Group'),
    wn: pctFor(m.id, 'Worship Night'),
  }));

  withPct.sort((a, b) => {
    let cmp = 0;
    if (sort === 'cg') cmp = (a.cg ?? -1) - (b.cg ?? -1);
    else if (sort === 'wn') cmp = (a.wn ?? -1) - (b.wn ?? -1);
    else if (sort === 'cgname') cmp = cgName(a.m).localeCompare(cgName(b.m));
    else cmp = fullName(a.m).localeCompare(fullName(b.m)); // 'nama'
    return dir === 'asc' ? cmp : -cmp;
  });

  return (
    <div>
      <PageHeader
        title="Anggota"
        sub={`${filtered.length} dari ${allMembers.length} anggota`}
        right={
          <>
            <Link
              href={`/laporan?scope=member&rangeKey=${rangeKey}&customStart=${range.start}&customEnd=${range.end}&filterPel=${filterPel}&filterStatus=${filterStatus}&search=${q}`}
              className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center flex-shrink-0"
            >
              <Download size={16} />
            </Link>
            <Link href="/anggota/baru" className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center flex-shrink-0">
              <Plus size={16} />
            </Link>
          </>
        }
      />

      <FilterBar
        searchValue={searchParams.q || ''}
        searchPlaceholder="Cari nama anggota"
        selects={[
          { name: 'pel', value: filterPel, options: PEL_OPTIONS },
          { name: 'status', value: filterStatus, options: STATUS_OPTIONS },
          { name: 'range', value: rangeKey, options: RANGE_OPTIONS },
        ]}
        customRange={{
          rangeParamName: 'range',
          rangeValue: 'custom',
          startName: 'start',
          endName: 'end',
          startValue: searchParams.start || '',
          endValue: searchParams.end || '',
        }}
      />

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <SortTh label="Nama" sortKey="nama" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="Cell Group" sortKey="cgname" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="% CG" sortKey="cg" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="% WN" sortKey="wn" currentSort={sort} currentDir={dir} searchParams={searchParams} />
            </tr>
          </thead>
          <tbody>
            {withPct.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted2 text-sm py-6">
                  Tidak ada anggota yang cocok.
                </td>
              </tr>
            )}
            {withPct.map(({ m, cg, wn }) => {
              const isActive = m.status === 'Aktif';
              return (
                <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-bg cursor-pointer ${isActive ? '' : 'opacity-60'}`}>
                  <td className="p-0">
                    <Link href={`/anggota/${m.id}`} className="flex items-center gap-1.5 px-1.5 py-2.5 text-[12.5px] font-semibold">
                      {fullName(m)}
                      {!isActive && (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-bg text-muted">Tidak Aktif</span>
                      )}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/anggota/${m.id}`} className="block px-1.5 py-2.5 text-[12.5px]">
                      {cgName(m)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/anggota/${m.id}`} className="block px-1.5 py-2.5 text-[12.5px] font-bold whitespace-nowrap" style={{ color: pctColor(cg) }}>
                      {cg === null ? '—' : `${cg}%`}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/anggota/${m.id}`} className="block px-1.5 py-2.5 text-[12.5px] font-bold whitespace-nowrap" style={{ color: pctColor(wn) }}>
                      {wn === null ? '—' : `${wn}%`}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
