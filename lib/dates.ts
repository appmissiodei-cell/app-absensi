// lib/dates.ts — helper tanggal (zona waktu Asia/Jakarta)

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Tanggal hari ini (YYYY-MM-DD) di zona Asia/Jakarta. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

/** Tanggal hari ini di Jakarta, dipecah. */
export function jakartaToday() {
  const iso = todayISO();
  const [y, m, d] = iso.split('-').map(Number);
  return { iso, year: y, month0: m - 1, day: d };
}

/** Awal & akhir bulan (YYYY-MM-DD) relatif terhadap bulan ini di Jakarta; offset -1 = bulan lalu. */
export function monthRangeISO(offset = 0) {
  const { year, month0 } = jakartaToday();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    start: iso(new Date(Date.UTC(year, month0 + offset, 1))),
    end: iso(new Date(Date.UTC(year, month0 + offset + 1, 0))),
  };
}

/** "6 Okt" */
export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Selasa, 6 Oktober 2026" */
export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export const isDone = (tanggal: string) => tanggal <= todayISO();

/** "2.100.000" */
export const fmtRupiah = (n: number | null | undefined) => (n == null ? '' : n.toLocaleString('id-ID'));

export const AVATAR_COLORS = ['#0E7C66', '#2563EB', '#B45309', '#7C3AED', '#DB2777', '#6C736A'];
export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
export const initialsOf = (baptis: string, lengkap: string) => ((baptis[0] || '') + (lengkap[0] || '')).toUpperCase();
