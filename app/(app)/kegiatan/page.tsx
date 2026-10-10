import Link from 'next/link';
import { dateLong } from '@/lib/dates';
import { Plus, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/filter/FilterBar';
import { SortTh } from '@/components/ui/SortTh';
import { JENIS_KEGIATAN_TYPES, WN_ROLE_DEFS } from '@/lib/constants';
import { monthRangeISO, todayISO } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type EventRow = {
  id: string;
  jenis: string;
  tanggal: string;
  jam: string;
  keterangan: string | null;
  pic: Record<string, string> | null;
};

const JENIS_OPTIONS = [{ value: 'Semua', label: 'Semua Kegiatan' }, ...JENIS_KEGIATAN_TYPES.map((j) => ({ value: j, label: j }))];

const RANGE_OPTIONS = [
  { value: 'all', label: 'Semua Tanggal' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'lastmonth', label: 'Bulan Lalu' },
  { value: 'custom', label: 'Pilih Rentang Tanggal' },
];

const monthRange = monthRangeISO;

function picCompleteness(ev: EventRow) {
  if (ev.jenis !== 'Worship Night') return null;
  const pic = ev.pic || {};
  const total = WN_ROLE_DEFS.length;
  const filled = WN_ROLE_DEFS.filter((r) => (pic[r.key] || '').trim()).length;
  return { filled, total };
}

export default async function KegiatanPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('id, jenis, tanggal, jam, keterangan, pic')
    .returns<EventRow[]>();

  const all = events || [];

  const q = (searchParams.q || '').toLowerCase();
  const jenisFilter = searchParams.jenis || 'Semua';
  const rangeKey = searchParams.range || 'all';
  const sort = searchParams.sort || 'tanggal';
  const dir = (searchParams.dir as 'asc' | 'desc') || 'desc';

  let rangeStart = '2000-01-01';
  let rangeEnd = '2099-12-31';
  if (rangeKey === 'month') ({ start: rangeStart, end: rangeEnd } = monthRange(0));
  else if (rangeKey === 'lastmonth') ({ start: rangeStart, end: rangeEnd } = monthRange(-1));
  else if (rangeKey === 'custom') {
    rangeStart = searchParams.start || '2000-01-01';
    rangeEnd = searchParams.end || '2099-12-31';
  }

  const filtered = all.filter((e) => {
    const inRange = e.tanggal >= rangeStart && e.tanggal <= rangeEnd;
    const matchesQ = !q || e.jenis.toLowerCase().includes(q) || (e.keterangan || '').toLowerCase().includes(q);
    const matchesJenis = jenisFilter === 'Semua' || e.jenis === jenisFilter;
    return inRange && matchesQ && matchesJenis;
  });

  const today = todayISO();
  const isDone = (e: EventRow) => e.tanggal <= today;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort === 'jenis') cmp = a.jenis.localeCompare(b.jenis);
    else if (sort === 'keterangan') cmp = (a.keterangan || '').localeCompare(b.keterangan || '');
    else if (sort === 'status') cmp = Number(isDone(a)) - Number(isDone(b));
    else cmp = a.tanggal.localeCompare(b.tanggal); // 'tanggal'
    return dir === 'asc' ? cmp : -cmp;
  });

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div>
      <PageHeader
        title="Kegiatan"
        sub={`${filtered.length} kegiatan`}
        right={
          <>
            <Link
              href={`/laporan?scope=event&rangeKey=${rangeKey}&customStart=${rangeStart}&customEnd=${rangeEnd}&search=${q}&jenisFilter=${jenisFilter}`}
              className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center flex-shrink-0"
            >
              <Download size={16} />
            </Link>
            <Link href="/kegiatan/baru" className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center flex-shrink-0">
              <Plus size={16} />
            </Link>
          </>
        }
      />

      <FilterBar
        searchValue={searchParams.q || ''}
        searchPlaceholder="Cari jenis atau keterangan kegiatan"
        selects={[
          { name: 'jenis', value: jenisFilter, options: JENIS_OPTIONS },
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
              <SortTh label="Tanggal" sortKey="tanggal" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="Jenis" sortKey="jenis" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="Keterangan" sortKey="keterangan" currentSort={sort} currentDir={dir} searchParams={searchParams} />
              <SortTh label="Status" sortKey="status" currentSort={sort} currentDir={dir} searchParams={searchParams} />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted2 text-sm py-6">
                  Tidak ada kegiatan yang cocok.
                </td>
              </tr>
            )}
            {sorted.map((e) => {
              const done = isDone(e);
              const comp = picCompleteness(e);
              return (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-bg cursor-pointer">
                  <td className="p-0">
                    <Link href={`/kegiatan/${e.id}`} className="block px-1.5 py-2.5 text-[12.5px] whitespace-nowrap">
                      {dateLong(e.tanggal)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/kegiatan/${e.id}`} className="block px-1.5 py-2.5 text-[12.5px] font-bold">
                      {e.jenis}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/kegiatan/${e.id}`} className="block px-1.5 py-2.5 text-[12.5px]">
                      {e.keterangan || '—'}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={`/kegiatan/${e.id}`} className="flex items-center gap-1.5 px-1.5 py-2.5 whitespace-nowrap">
                      <span
                        className="text-[11px] font-bold px-2 py-1 rounded-full"
                        style={{
                          background: done ? 'var(--bg)' : 'var(--accent-light)',
                          color: done ? 'var(--muted)' : 'var(--accent)',
                        }}
                      >
                        {done ? 'Selesai' : 'Akan Datang'}
                      </span>
                      {comp && (
                        <span
                          className="text-[11px] font-bold px-2 py-1 rounded-full"
                          style={{
                            background: comp.filled === comp.total ? 'var(--accent-light)' : comp.filled === 0 ? '#DC262622' : '#B4530922',
                            color: comp.filled === comp.total ? 'var(--accent)' : comp.filled === 0 ? 'var(--red)' : 'var(--amber)',
                          }}
                        >
                          PIC {comp.filled}/{comp.total}
                        </span>
                      )}
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
