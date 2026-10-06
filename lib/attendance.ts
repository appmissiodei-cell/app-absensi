// lib/attendance.ts
//
// Logika absensi di-port dari absensi-app.html (computePct, resolveRange,
// attendanceKind, pctColor) — nama fungsi dipertahankan sama supaya
// gampang di-trace ke mockup. Bedanya: di mockup ini beroperasi di atas
// array boolean statis (member.cgA / member.wnA); di sini beroperasi di
// atas baris `attendance` hasil query Supabase (event_id, member_id,
// hadir, events.tanggal, events.jenis).

import type { JenisKegiatan } from './constants';
import { jakartaToday, monthRangeISO } from './dates';

export type AttendanceKind = 'cg' | 'wn' | 'adhoc';

export function attendanceKind(jenis: JenisKegiatan): AttendanceKind {
  if (jenis === 'Cell Group') return 'cg';
  if (jenis === 'Worship Night') return 'wn';
  // Retreat, Misa Bersama, Lain-Lain: absensi bebas per event,
  // tidak masuk hitungan %CG/%WN.
  return 'adhoc';
}

export type DateRange = { start: string; end: string };

/**
 * Sama seperti resolveRange di mockup, tapi 'today' diambil dari waktu
 * sebenarnya di zona Asia/Jakarta (bukan TODAY hardcoded seperti di mockup,
 * dan bukan jam server yang UTC).
 */
export function resolveRange(
  key: 'week' | 'month' | 'two' | 'all' | 'custom',
  customStart?: string | null,
  customEnd?: string | null
): DateRange {
  const { iso: todayIso, year, month0, day } = jakartaToday();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  if (key === 'custom') {
    return { start: customStart || '2000-01-01', end: customEnd || '2099-12-31' };
  }
  if (key === 'all') {
    return { start: '2000-01-01', end: '2099-12-31' };
  }
  if (key === 'week') {
    return { start: iso(new Date(Date.UTC(year, month0, day - 6))), end: todayIso };
  }
  if (key === 'month') return monthRangeISO(0);
  // 'two' = 2 bulan terakhir termasuk bulan ini
  return { start: monthRangeISO(-1).start, end: monthRangeISO(0).end };
}

export type AttendanceRow = { tanggal: string; hadir: boolean };

/**
 * % kehadiran seorang anggota untuk satu jenis (cg/wn) dalam sebuah range.
 * `rows` = baris attendance milik member ini yang jenisnya sudah difilter
 * jadi cg atau wn saja (join attendance -> events, filter events.jenis),
 * diurutkan/di-map ke {tanggal, hadir}.
 *
 * total = jumlah kegiatan relevan pada rentang waktu (denominator)
 * hadir = COUNT hadir=true (numerator)
 * Baris yang belum diabsen tetap hadir=false di DB (bukan "tidak ada
 * baris"), jadi perhitungan ini valid selama query mengambil semua baris
 * attendance milik member, termasuk yang hadir=false.
 */
export function computePct(rows: AttendanceRow[], range: DateRange): number | null {
  let total = 0;
  let hadir = 0;
  for (const r of rows) {
    if (r.tanggal >= range.start && r.tanggal <= range.end) {
      total++;
      if (r.hadir) hadir++;
    }
  }
  if (total === 0) return null;
  return Math.round((hadir / total) * 100);
}

/** Warna badge % kehadiran — samakan dengan CSS var di mockup. */
export function pctColor(p: number | null): string {
  if (p === null || p === undefined) return 'var(--muted2)';
  if (p >= 75) return 'var(--accent)';
  if (p >= 50) return 'var(--amber)';
  return 'var(--red)';
}
