import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FilterBar } from '@/components/filter/FilterBar';
import { computePct, resolveRange, pctColor } from '@/lib/attendance';

export const dynamic = 'force-dynamic';

type Row = {
  id: string; nama_baptis: string; nama_lengkap: string; nik: string | null; no_hp: string | null; email: string | null;
  pelayanan: string[]; tanggal_lahir: string | null; wedding_anniversary: string | null;
  status: 'Aktif' | 'Tidak Aktif'; cell_groups: { nama: string } | null;
};
type AttRow = { hadir: boolean; events: { tanggal: string; jenis: string } | null };

const RANGE_OPTIONS = [
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'two', label: '2 Bulan Terakhir' },
  { value: 'all', label: 'Semua' },
  { value: 'custom', label: 'Pilih Rentang Tanggal' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const AVATAR_COLORS = ['#0E7C66', '#2563EB', '#B45309', '#7C3AED', '#DB2777', '#6C736A'];

const shortDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const longDate = (iso: string | null) => (iso ? `${shortDate(iso)} ${iso.slice(0, 4)}` : '—');
const avatarColor = (id: string) => AVATAR_COLORS[parseInt(id.replace(/\D/g, '').slice(-3) || '0', 10) % AVATAR_COLORS.length];

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const [{ data: m }, { data: att }] = await Promise.all([
    supabase
      .from('members')
      .select('id, nama_baptis, nama_lengkap, nik, no_hp, email, pelayanan, tanggal_lahir, wedding_anniversary, status, cell_groups!members_cell_group_id_fkey(nama)')
      .eq('id', params.id)
      .maybeSingle<Row>(),
    supabase.from('attendance').select('hadir, events(tanggal, jenis)').eq('member_id', params.id).returns<AttRow[]>(),
  ]);
  if (!m) notFound();

  const rangeKey = (searchParams.range || 'month') as 'week' | 'month' | 'two' | 'all' | 'custom';
  const range = resolveRange(rangeKey, searchParams.start, searchParams.end);

  const rows = (att || []).filter((a) => a.events && (a.events.jenis === 'Cell Group' || a.events.jenis === 'Worship Night'));
  const pctOf = (jenis: string) =>
    computePct(rows.filter((a) => a.events!.jenis === jenis).map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir })), range);
  const cg = pctOf('Cell Group');
  const wn = pctOf('Worship Night');
  const hist = rows
    .filter((a) => a.events!.tanggal >= range.start && a.events!.tanggal <= range.end)
    .sort((a, b) => (a.events!.tanggal < b.events!.tanggal ? 1 : -1));

  const fullName = `${m.nama_baptis} ${m.nama_lengkap}`.trim();
  const initials = ((m.nama_baptis[0] || '') + (m.nama_lengkap[0] || '')).toUpperCase();
  const isActive = m.status === 'Aktif';

  const info: [string, React.ReactNode][] = [
    ['NIK', m.nik || '—'],
    ['No. HP', m.no_hp ? <a href={`tel:${m.no_hp}`} className="text-accent">{m.no_hp}</a> : '—'],
    ['Email', m.email ? <a href={`mailto:${m.email}`} className="text-accent break-all">{m.email}</a> : '—'],
    ['Pelayanan', m.pelayanan.length ? m.pelayanan.join(', ') : '—'],
  ];

  return (
    <div className="max-w-2xl">
      {/* Header gelap — port dari viewMemberDetail() */}
      <div className="bg-dark text-white rounded-2xl px-5 py-4 mb-4">
        <div className="flex items-center justify-between">
          <Link href="/anggota" className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center" aria-label="Kembali">
            <ArrowLeft size={16} />
          </Link>
          <Link href={`/anggota/${m.id}/edit`} className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center" aria-label="Edit">
            <Pencil size={16} />
          </Link>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[17px] font-bold flex-shrink-0"
            style={{ background: avatarColor(m.id) }}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <div className="text-lg font-extrabold flex items-center gap-2 flex-wrap">
              {fullName}
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-full"
                style={{ background: isActive ? 'rgba(255,255,255,.16)' : 'rgba(220,38,38,.25)' }}
              >
                {m.status}
              </span>
            </div>
            <div className="text-[12.5px] text-white/75 mt-0.5">{m.cell_groups?.nama || 'Belum Masuk CG'}</div>
          </div>
        </div>
        {(m.tanggal_lahir || m.wedding_anniversary) && (
          <div className="flex gap-3.5 mt-2.5 text-xs text-white/80">
            {m.tanggal_lahir && (
              <span className="flex items-center gap-1.5"><Star size={13} className="text-white/70" />{shortDate(m.tanggal_lahir)}</span>
            )}
            {m.wedding_anniversary && (
              <span className="flex items-center gap-1.5"><Star size={13} className="text-white/70" />Anniv {longDate(m.wedding_anniversary)}</span>
            )}
          </div>
        )}
      </div>

      <FilterBar
        selects={[{ name: 'range', value: rangeKey, options: RANGE_OPTIONS }]}
        customRange={{
          rangeParamName: 'range', rangeValue: 'custom', startName: 'start', endName: 'end',
          startValue: searchParams.start || '', endValue: searchParams.end || '',
        }}
      />

      <div className="flex gap-2.5">
        {[['Kehadiran CG', cg], ['Kehadiran WN', wn]].map(([label, v]) => (
          <div key={label as string} className="flex-1 bg-card border border-border rounded-2xl p-3 text-center">
            <div className="text-xl font-extrabold" style={{ color: pctColor(v as number | null) }}>
              {v === null ? '—' : `${v}%`}
            </div>
            <div className="text-[11px] text-muted mt-0.5">{label as string}</div>
          </div>
        ))}
      </div>

      <div className="mt-[18px] text-xs font-bold text-muted uppercase">Data Diri</div>
      <dl className="mt-2 bg-card border border-border rounded-2xl divide-y divide-border">
        {info.map(([k, v]) => (
          <div key={k} className="flex gap-3 px-4 py-2.5 text-[13.5px]">
            <dt className="w-24 flex-shrink-0 text-muted font-semibold">{k}</dt>
            <dd className="min-w-0">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-[18px] text-xs font-bold text-muted uppercase">Riwayat Kehadiran</div>
      <div className="mt-2 space-y-1.5">
        {hist.length === 0 && <div className="text-[13px] text-muted2">Tidak ada data pada periode ini.</div>}
        {hist.map((a, i) => (
          <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-[11px]">
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: a.hadir ? 'var(--accent)' : 'var(--red)' }} />
            <span className="flex-1">
              <div className="text-[13px] font-semibold">{a.events!.jenis}</div>
              <div className="text-[11px] text-muted2">{shortDate(a.events!.tanggal)} {a.events!.tanggal.slice(0, 4)}</div>
            </span>
            <span className="text-xs font-bold" style={{ color: a.hadir ? 'var(--accent)' : 'var(--red)' }}>
              {a.hadir ? 'Hadir' : 'Tidak Hadir'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
