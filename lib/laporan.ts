// lib/laporan.ts — data laporan (dipakai halaman preview, Excel, dan PDF)
import type { SupabaseClient } from '@supabase/supabase-js';
import { computePct } from './attendance';
import { fmtDate, dateLong } from './dates';
import { fetchAllRows } from './fetch-all';

export type LaporanScope = 'event' | 'member';
export type LaporanParams = Record<string, string | undefined>;

export type LaporanData = {
  scope: LaporanScope;
  title: string;
  periode: string;
  columns: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
  notes: string[];
};

const ALL_START = '2000-01-01';
const ALL_END = '2099-12-31';

export function periodLabel(start: string, end: string) {
  if (start === ALL_START && end === ALL_END) return 'Semua periode';
  if (start === ALL_START) return `s/d ${fmtDate(end)}`;
  if (end === ALL_END) return `sejak ${fmtDate(start)}`;
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

type EvRow = { id: string; jenis: string; tanggal: string; keterangan: string | null };
type AttRow = { event_id?: string; member_id?: string; hadir: boolean; events?: { tanggal: string; jenis: string } | null };
type MemRow = { id: string; nama_baptis: string; nama_lengkap: string; status: string; pelayanan: string[]; cell_groups: { nama: string } | null };

export async function buildLaporan(sb: SupabaseClient, p: LaporanParams): Promise<LaporanData> {
  const scope: LaporanScope = p.scope === 'member' ? 'member' : 'event';
  const start = p.customStart || ALL_START;
  const end = p.customEnd || ALL_END;
  const q = (p.search || '').toLowerCase();
  const periode = periodLabel(start, end);

  if (scope === 'event') {
    const jenisFilter = p.jenisFilter || 'Semua';
    const { data: evs } = await sb.from('events').select('id, jenis, tanggal, keterangan').gte('tanggal', start).lte('tanggal', end).order('tanggal', { ascending: false });
    const events = ((evs || []) as EvRow[]).filter(
      (e) => (!q || e.jenis.toLowerCase().includes(q) || (e.keterangan || '').toLowerCase().includes(q)) && (jenisFilter === 'Semua' || e.jenis === jenisFilter)
    );
    const ids = events.map((e) => e.id);
    const hadirMap = new Map<string, number>();
    if (ids.length) {
      const att = await fetchAllRows<AttRow>((from, to) =>
        sb.from('attendance').select('event_id, hadir').in('event_id', ids).eq('hadir', true).order('id').range(from, to)
      );
      for (const a of att) hadirMap.set(a.event_id!, (hadirMap.get(a.event_id!) || 0) + 1);
    }
    const rows = events.map((e) => [dateLong(e.tanggal), e.jenis, e.keterangan || '—', hadirMap.get(e.id) || 0]);
    const total = rows.reduce((s, r) => s + (r[3] as number), 0);
    const notes: string[] = [];
    if (jenisFilter !== 'Semua') notes.push(`Jenis: ${jenisFilter}`);
    if (q) notes.push(`Cari: "${q}"`);
    return { scope, title: 'Laporan Kegiatan', periode, columns: ['Tanggal', 'Jenis', 'Keterangan', 'Hadir'], rows, footer: ['Total Kehadiran', '', '', total], notes };
  }

  const filterPel = p.filterPel || 'Semua';
  const filterStatus = p.filterStatus || 'Semua';
  const sortBy = p.sortBy || 'nama';
  const [{ data: ms }, att] = await Promise.all([
    sb.from('members').select('id, nama_baptis, nama_lengkap, status, pelayanan, cell_groups!members_cell_group_id_fkey(nama)'),
    fetchAllRows<unknown>((from, to) => sb.from('attendance').select('member_id, hadir, events(tanggal, jenis)').order('id').range(from, to)),
  ]);
  const name = (m: MemRow) => `${m.nama_baptis} ${m.nama_lengkap}`.trim();
  const list = ((ms || []) as unknown as MemRow[]).filter(
    (m) => (filterPel === 'Semua' || m.pelayanan.includes(filterPel)) && (filterStatus === 'Semua' || m.status === filterStatus) && (!q || name(m).toLowerCase().includes(q))
  );
  const attRows = ((att || []) as unknown as AttRow[]).filter((a) => a.events);
  const pct = (id: string, jenis: string) =>
    computePct(attRows.filter((a) => a.member_id === id && a.events!.jenis === jenis).map((a) => ({ tanggal: a.events!.tanggal, hadir: a.hadir })), { start, end });
  const data = list.map((m) => ({ m, cg: pct(m.id, 'Cell Group'), wn: pct(m.id, 'Worship Night') }));
  data.sort((a, b) => (sortBy === 'cg' ? (b.cg ?? -1) - (a.cg ?? -1) : sortBy === 'wn' ? (b.wn ?? -1) - (a.wn ?? -1) : name(a.m).localeCompare(name(b.m))));
  const rows = data.map((x) => [name(x.m), x.m.cell_groups?.nama || 'Belum Masuk CG', x.cg === null ? '—' : `${x.cg}%`, x.wn === null ? '—' : `${x.wn}%`]);
  const notes: string[] = [];
  if (filterPel !== 'Semua') notes.push(`Pelayanan: ${filterPel}`);
  if (filterStatus !== 'Semua') notes.push(`Status: ${filterStatus}`);
  if (q) notes.push(`Cari: "${q}"`);
  return { scope, title: 'Laporan Anggota', periode, columns: ['Nama', 'Cell Group', '% CG', '% WN'], rows, notes };
}
