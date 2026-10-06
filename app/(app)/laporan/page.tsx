import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buildLaporan } from '@/lib/laporan';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Port dari viewExportPreview() di mockup.
export default async function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const d = await buildLaporan(supabase as unknown as SupabaseClient, searchParams);
  const back = d.scope === 'event' ? '/kegiatan' : '/anggota';

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (v) qs.set(k, v);
  const query = qs.toString();

  const colorFor = (v: string | number, i: number) => {
    if (d.scope === 'event' && i === 3) return 'var(--accent)';
    if (d.scope === 'member' && i >= 2) {
      const n = parseInt(String(v), 10);
      if (isNaN(n)) return 'var(--muted2)';
      return n >= 75 ? 'var(--accent)' : n >= 50 ? 'var(--amber)' : 'var(--red)';
    }
    return undefined;
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href={back} className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center flex-shrink-0" aria-label="Kembali"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-lg font-extrabold">Preview Laporan</h1>
          <p className="text-xs text-muted">{d.periode}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>{d.columns.map((c) => <th key={c} className="text-left text-[11px] uppercase text-muted font-bold px-1.5 py-2 border-b border-border">{c}</th>)}</tr>
          </thead>
          <tbody>
            {d.rows.length === 0 && (
              <tr><td colSpan={d.columns.length} className="text-center text-muted2 py-6">Tidak ada data pada filter ini.</td></tr>
            )}
            {d.rows.map((r, ri) => (
              <tr key={ri} className="border-b border-border last:border-0">
                {r.map((v, i) => <td key={i} className="px-1.5 py-2" style={{ color: colorFor(v, i), fontWeight: colorFor(v, i) ? 700 : 400 }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
          {d.footer && (
            <tfoot>
              <tr>{d.footer.map((v, i) => <td key={i} className="px-1.5 py-2 font-extrabold">{v}</td>)}</tr>
            </tfoot>
          )}
        </table>
        {d.notes.length > 0 && <div className="text-[11px] text-muted2 mt-2">Difilter — {d.notes.join(' · ')}</div>}
      </div>
      <p className="text-[11px] text-muted2 text-center mt-2.5">Dibuat otomatis dari data Jadwal Kegiatan &amp; Log Absensi, sesuai filter yang sedang aktif</p>

      <div className="flex gap-2.5 mt-4">
        <a href={`/api/laporan/excel?${query}`} className="flex-1 text-center rounded-xl border border-border bg-bg font-bold py-3 text-sm">Unduh Excel</a>
        <a href={`/api/laporan/pdf?${query}`} className="flex-1 text-center rounded-xl bg-accent text-white font-bold py-3 text-sm">Unduh PDF</a>
      </div>
    </div>
  );
}
