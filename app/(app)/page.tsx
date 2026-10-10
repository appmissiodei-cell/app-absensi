import Link from 'next/link';
import { Plus, UserPlus, ChevronDown, Users, Cake } from 'lucide-react';
import { RingIcon } from '@/components/ui/RingIcon';
import { createClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/fetch-all';
import { AttendanceBarChart } from '@/components/charts/AttendanceBarChart';
import { WN_ROLE_DEFS } from '@/lib/constants';
import { computePct, resolveRange } from '@/lib/attendance';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { jakartaToday, fmtDate, dateLong, birthLabel, anniversaryNumber } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type EventRow = { id: string; jenis: string; tanggal: string; keterangan: string | null; pic: Record<string, string> | null };
type MemberRow = { id: string; nama_baptis: string; nama_lengkap: string; tanggal_lahir: string | null; wedding_anniversary: string | null; cell_group_id: string | null };
type AttendanceJoinRow = { member_id: string; hadir: boolean; events: { tanggal: string; jenis: string } | null };

const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export default async function RingkasanPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Lihat catatan di types/database.types.ts soal cast manual ini.
  const { data: profileRaw } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user!.id).single();
  const typedProfile = profileRaw as unknown as Profile;

  const today = jakartaToday();
  const todayIso = today.iso;
  const monthRange = resolveRange('month');

  const [{ data: allMembers }, { data: monthEvents }, { data: upcomingEventsRaw }, attendanceRows] = await Promise.all([
    supabase.from('members').select('id, nama_baptis, nama_lengkap, tanggal_lahir, wedding_anniversary, cell_group_id').returns<MemberRow[]>(),
    supabase.from('events').select('id').gte('tanggal', monthRange.start).lte('tanggal', monthRange.end),
    supabase.from('events').select('id, jenis, tanggal, keterangan, pic').gte('tanggal', todayIso).order('tanggal', { ascending: true }).returns<EventRow[]>(),
    fetchAllRows<AttendanceJoinRow>((from, to) => supabase.from('attendance').select('member_id, hadir, events(tanggal, jenis)').order('id').range(from, to)),
  ]);

  const members = allMembers || [];
  const upcomingEvents = upcomingEventsRaw || [];

  // Rata-rata kehadiran bulan ini: rata-rata (CG%, WN%) per anggota, lalu dirata-rata lagi antar anggota.
  const avgList = members
    .map((m) => {
      const cgRows = (attendanceRows || [])
        .filter((a) => a.member_id === m.id && a.events?.jenis === 'Cell Group')
        .map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir }));
      const wnRows = (attendanceRows || [])
        .filter((a) => a.member_id === m.id && a.events?.jenis === 'Worship Night')
        .map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir }));
      const cg = computePct(cgRows, monthRange);
      const wn = computePct(wnRows, monthRange);
      const vals = [cg, wn].filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    })
    .filter((v): v is number => v !== null);
  const avg = avgList.length ? Math.round(avgList.reduce((a, b) => a + b, 0) / avgList.length) : 0;

  const upcoming3 = upcomingEvents.slice(0, 3);

  const thisMonthMM = String(today.month0 + 1).padStart(2, '0');
  const bdayMembers = members.filter((m) => m.tanggal_lahir && m.tanggal_lahir.slice(5, 7) === thisMonthMM);
  const annivMembers = members.filter((m) => m.wedding_anniversary && m.wedding_anniversary.slice(5, 7) === thisMonthMM);

  const incompleteWN = upcomingEvents
    .filter((e) => e.jenis === 'Worship Night')
    .map((e) => {
      const pic = e.pic || {};
      const total = WN_ROLE_DEFS.length;
      const filled = WN_ROLE_DEFS.filter((r) => (pic[r.key] || '').trim()).length;
      return { e, filled, total };
    })
    .filter((x) => x.filled < x.total);

  // Chart kehadiran per sesi (default bulan ini).
  const chartRangeKey = (searchParams.chartRange || 'month') as 'week' | 'month' | 'two' | 'all';
  const chartRange = resolveRange(chartRangeKey);
  const { data: chartEvents } = await supabase
    .from('events')
    .select('id, jenis, tanggal')
    .in('jenis', ['Cell Group', 'Worship Night'])
    .gte('tanggal', chartRange.start)
    .lte('tanggal', chartRange.end)
    .order('tanggal', { ascending: true })
    .returns<{ id: string; jenis: string; tanggal: string }[]>();
  const chartEventIds = (chartEvents || []).map((e) => e.id);
  // hanya baris hadir=true yang dihitung, dan di-page supaya tidak terpotong batas 1000 baris
  const chartAttendance = chartEventIds.length
    ? await fetchAllRows<{ event_id: string; hadir: boolean }>((from, to) =>
        supabase.from('attendance').select('event_id, hadir').in('event_id', chartEventIds).eq('hadir', true).order('id').range(from, to)
      )
    : [];

  function hadirCount(eventId: string) {
    return (chartAttendance || []).filter((a) => a.event_id === eventId && a.hadir).length;
  }
  const cgChartData = (chartEvents || [])
    .filter((e) => e.jenis === 'Cell Group')
    .map((e) => ({ label: shortDate(e.tanggal), value: hadirCount(e.id) }));
  const wnChartData = (chartEvents || [])
    .filter((e) => e.jenis === 'Worship Night')
    .map((e) => ({ label: shortDate(e.tanggal), value: hadirCount(e.id) }));

  return (
    <div>
      <div className="hero rounded-3xl px-5 py-4 mb-4">
        <h1 className="text-lg font-extrabold">Ringkasan</h1>
        <p className="text-xs text-white/70 mt-0.5">
          Komunitas Missio Dei &middot; {MONTH_NAMES_ID[today.month0]} {today.year}
        </p>
      </div>

      <Link href="/pengaturan/akun-saya" className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-3 mb-3.5">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isSuperadmin(typedProfile) ? '#7C3AED22' : 'var(--accent-light)',
            color: isSuperadmin(typedProfile) ? '#7C3AED' : 'var(--accent)',
          }}
        >
          <Users size={16} />
        </span>
        <span className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold">{typedProfile.nama}</div>
          <div className="text-[11.5px] text-muted mt-0.5">{isSuperadmin(typedProfile) ? 'Superadmin' : 'Admin'}</div>
        </span>
        <ChevronDown size={16} className="text-muted2" />
      </Link>

      <div className="flex gap-2.5">
        <div className="flex-1 bg-card border border-border rounded-2xl text-center py-3.5">
          <div className="text-xl font-extrabold">{members.length}</div>
          <div className="text-[11px] text-muted mt-0.5">Anggota</div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl text-center py-3.5">
          <div className="text-xl font-extrabold">{(monthEvents || []).length}</div>
          <div className="text-[11px] text-muted mt-0.5">Kegiatan Bulan Ini</div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-2xl text-center py-3.5">
          <div className="text-xl font-extrabold text-accent">{avg}%</div>
          <div className="text-[11px] text-muted mt-0.5">Rata&sup2; Hadir</div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Link href="/kegiatan/baru" className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white font-bold text-sm rounded-xl py-3">
          <Plus size={16} /> Kegiatan
        </Link>
        <Link href="/anggota/baru" className="flex-1 flex items-center justify-center gap-1.5 bg-card border border-border font-bold text-sm rounded-xl py-3">
          <UserPlus size={16} /> Anggota
        </Link>
      </div>
      <p className="text-[11px] text-muted2 text-center mt-2">
        Untuk unduh laporan, pilih rentang waktunya dulu di menu Kegiatan atau Anggota.
      </p>

      <div className="text-xs font-bold text-muted uppercase mt-5 mb-2">Grafik Kehadiran</div>
      <div className="flex gap-2 mb-2">
        {(['week', 'month', 'two', 'all'] as const).map((k) => (
          <Link
            key={k}
            href={`?chartRange=${k}`}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
            style={{
              background: chartRangeKey === k ? 'var(--accent)' : 'var(--card)',
              color: chartRangeKey === k ? '#fff' : 'var(--muted)',
              borderColor: chartRangeKey === k ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {k === 'week' ? 'Minggu Ini' : k === 'month' ? 'Bulan Ini' : k === 'two' ? '2 Bulan' : 'Semua'}
          </Link>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-3.5 mb-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] font-bold">Cell Group — Jumlah Hadir per Sesi</div>
        </div>
        {cgChartData.length ? <AttendanceBarChart data={cgChartData} color="var(--accent)" /> : <p className="text-sm text-muted2 text-center py-3">Tidak ada data pada periode ini.</p>}
      </div>
      <div className="bg-card border border-border rounded-2xl p-3.5 mb-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] font-bold">Worship Night — Jumlah Hadir per Sesi</div>
        </div>
        {wnChartData.length ? <AttendanceBarChart data={wnChartData} color="#7C3AED" /> : <p className="text-sm text-muted2 text-center py-3">Tidak ada data pada periode ini.</p>}
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-5 mb-2">Kegiatan Mendatang</div>
      <div className="flex flex-col gap-1.5">
        {upcoming3.length === 0 && <p className="text-sm text-muted2">Tidak ada kegiatan mendatang.</p>}
        {upcoming3.map((e) => (
          <Link key={e.id} href={`/kegiatan/${e.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Plus size={14} className="rotate-45" />
            </span>
            <span className="flex-1">
              <div className="text-[13.5px] font-bold">{e.jenis}</div>
              <div className="text-[11.5px] text-muted">{fmtDate(e.tanggal)}</div>
            </span>
          </Link>
        ))}
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-4.5 mb-2">PIC Worship Night Belum Lengkap</div>
      <div className="flex flex-col gap-1.5">
        {incompleteWN.length === 0 && <p className="text-sm text-muted2">Semua Worship Night mendatang sudah lengkap PIC-nya.</p>}
        {incompleteWN.map(({ e, filled, total }) => {
          const col = filled === 0 ? 'var(--red)' : 'var(--amber)';
          return (
            <Link key={e.id} href={`/kegiatan/${e.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${col}22`, color: col }}>
                <Users size={14} />
              </span>
              <span className="flex-1">
                <div className="text-[13.5px] font-bold">Worship Night</div>
                <div className="text-[11.5px] text-muted">{fmtDate(e.tanggal)}</div>
              </span>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: `${col}22`, color: col }}>
                PIC {filled}/{total}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-4.5 mb-2">Ulang Tahun Bulan Ini</div>
      <div className="flex flex-col gap-1.5">
        {bdayMembers.length === 0 && <p className="text-sm text-muted2">Tidak ada yang ulang tahun bulan ini.</p>}
        {bdayMembers.map((m) => (
          <Link key={m.id} href={`/anggota/${m.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}>
              <Cake size={16} />
            </span>
            <span className="flex-1">
              <div className="text-[13.5px] font-bold">{m.nama_baptis} {m.nama_lengkap}</div>
              <div className="text-[11.5px] text-muted">Ulang tahun {birthLabel(m.tanggal_lahir) ?? '—'}</div>
            </span>
          </Link>
        ))}
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-4.5 mb-2">Anniversary Bulan Ini</div>
      <div className="flex flex-col gap-1.5">
        {annivMembers.length === 0 && <p className="text-sm text-muted2">Tidak ada yang anniversary bulan ini.</p>}
        {annivMembers.map((m) => {
          const yrs = anniversaryNumber(m.wedding_anniversary!, today.year);
          return (
            <Link key={m.id} href={`/anggota/${m.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <RingIcon size={16} />
              </span>
              <span className="flex-1">
                <div className="text-[13.5px] font-bold">{m.nama_baptis} {m.nama_lengkap}</div>
                <div className="text-[11.5px] text-muted">
                  Anniversary {dateLong(m.wedding_anniversary!)}{yrs > 0 ? ` · ke-${yrs}` : ''}
                </div>
              </span>
            </Link>
          );
        })}
      </div>

      {isSuperadmin(typedProfile) && (
        <>
          <div className="text-xs font-bold text-muted uppercase mt-4.5 mb-2">Administrasi</div>
          <Link href="/pengaturan/users" className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Users size={14} />
            </span>
            <span className="flex-1">
              <div className="text-[13.5px] font-bold">Kelola User</div>
            </span>
          </Link>
        </>
      )}
    </div>
  );
}
