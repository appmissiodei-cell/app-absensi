import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { jakartaToday } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type EventRow = { id: string; jenis: string; tanggal: string; keterangan: string | null };
type MemberRow = { id: string; nama_baptis: string; nama_lengkap: string; tanggal_lahir: string | null; wedding_anniversary: string | null };

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const WEEKDAY_ID = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const supabase = await createClient();
  const [{ data: events }, { data: members }] = await Promise.all([
    supabase.from('events').select('id, jenis, tanggal, keterangan').returns<EventRow[]>(),
    supabase.from('members').select('id, nama_baptis, nama_lengkap, tanggal_lahir, wedding_anniversary').returns<MemberRow[]>(),
  ]);
  const allEvents = events || [];
  const allMembers = members || [];

  const now = jakartaToday();
  const monthParam = searchParams.month || `${now.year}-${pad2(now.month0 + 1)}`;
  const [yearStr, monthStr] = monthParam.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1; // 0-indexed
  const selectedDay = searchParams.day || null;

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const today = now.iso;

  function dayMarks(iso: string) {
    const mmdd = iso.slice(5);
    const evs = allEvents.filter((e) => e.tanggal === iso);
    const bdays = allMembers.filter((m) => m.tanggal_lahir && m.tanggal_lahir.slice(5) === mmdd);
    const anns = allMembers.filter((m) => m.wedding_anniversary && m.wedding_anniversary.slice(5) === mmdd);
    return { evs, bdays, anns };
  }

  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);
  const prevParam = `${prevMonthDate.getFullYear()}-${pad2(prevMonthDate.getMonth() + 1)}`;
  const nextParam = `${nextMonthDate.getFullYear()}-${pad2(nextMonthDate.getMonth() + 1)}`;

  const cells: { iso: string | null; day: number | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: `${year}-${pad2(month + 1)}-${pad2(d)}`, day: d });
  }

  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const selMarks = selectedDay ? dayMarks(selectedDay) : null;

  const monthAgenda: { date: string; label: string; color: string; href: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    const marks = dayMarks(iso);
    marks.evs.forEach((e) =>
      monthAgenda.push({
        date: iso,
        label: e.jenis + (e.keterangan ? ` — ${e.keterangan}` : ''),
        color: 'var(--accent)',
        href: `/kegiatan/${e.id}`,
      })
    );
    marks.bdays.forEach((m) =>
      monthAgenda.push({
        date: iso,
        label: `Ulang Tahun — ${m.nama_baptis} ${m.nama_lengkap}`,
        color: 'var(--amber)',
        href: `/anggota/${m.id}`,
      })
    );
    marks.anns.forEach((m) =>
      monthAgenda.push({
        date: iso,
        label: `Wedding Anniversary — ${m.nama_baptis} ${m.nama_lengkap}`,
        color: 'var(--purple)',
        href: `/anggota/${m.id}`,
      })
    );
  }

  const shortDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]}`;
  };

  return (
    <div>
      <PageHeader
        title="Kalender"
        sub={monthLabel}
        right={
          <div className="flex gap-1.5">
            <Link
              href={`?month=${prevParam}`}
              className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </Link>
            <Link
              href={`?month=${nextParam}`}
              className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        }
      />

      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
          <span className="text-[11px] text-muted">Kegiatan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--amber)' }} />
          <span className="text-[11px] text-muted">Ulang Tahun</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--purple)' }} />
          <span className="text-[11px] text-muted">Anniversary</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_ID.map((w, i) => (
          <div key={i} className="text-center text-[11px] font-bold text-muted2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.iso) return <div key={i} />;
          const marks = dayMarks(cell.iso);
          const dotColors = [
            marks.evs.length ? 'var(--accent)' : null,
            marks.bdays.length ? 'var(--amber)' : null,
            marks.anns.length ? 'var(--purple)' : null,
          ].filter(Boolean) as string[];
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selectedDay;
          const params = new URLSearchParams();
          params.set('month', monthParam);
          if (!isSelected) params.set('day', cell.iso);
          return (
            <Link
              key={i}
              href={`?${params.toString()}`}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border"
              style={{
                background: isToday ? 'var(--accent)' : 'var(--card)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                borderWidth: isSelected ? 2 : 1,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: isToday ? '#fff' : 'var(--text)' }}>
                {cell.day}
              </span>
              <span className="flex gap-0.5">
                {dotColors.map((c, idx) => (
                  <span key={idx} className="w-1 h-1 rounded-full inline-block" style={{ background: c }} />
                ))}
              </span>
            </Link>
          );
        })}
      </div>

      {selectedDay && selMarks && (
        <div className="bg-card border border-border rounded-2xl p-3.5 mt-3">
          <div className="text-xs font-bold text-muted uppercase mb-2">{shortDate(selectedDay)}</div>
          {selMarks.evs.length === 0 && selMarks.bdays.length === 0 && selMarks.anns.length === 0 ? (
            <div className="text-sm text-muted2">Tidak ada apa-apa di tanggal ini.</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {selMarks.evs.map((e) => (
                <Link key={e.id} href={`/kegiatan/${e.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--accent)' }} />
                  <span className="text-sm">{e.jenis}{e.keterangan ? ` — ${e.keterangan}` : ''}</span>
                </Link>
              ))}
              {selMarks.bdays.map((m) => (
                <Link key={m.id} href={`/anggota/${m.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--amber)' }} />
                  <span className="text-sm">Ulang Tahun — {m.nama_baptis} {m.nama_lengkap}</span>
                </Link>
              ))}
              {selMarks.anns.map((m) => (
                <Link key={m.id} href={`/anggota/${m.id}`} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--purple)' }} />
                  <span className="text-sm">Wedding Anniversary — {m.nama_baptis} {m.nama_lengkap}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-xs font-bold text-muted uppercase mt-5 mb-2">Agenda {monthLabel}</div>
      <div className="flex flex-col gap-1.5">
        {monthAgenda.length === 0 && <div className="text-sm text-muted2">Tidak ada agenda di bulan ini.</div>}
        {monthAgenda.map((u, i) => (
          <Link key={i} href={u.href} className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: u.color }} />
            <span className="flex-1 text-sm">{u.label}</span>
            <span className="text-xs font-bold text-muted">{shortDate(u.date)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
