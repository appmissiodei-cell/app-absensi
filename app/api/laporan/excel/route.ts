import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { buildLaporan } from '@/lib/laporan';
import type { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const d = await buildLaporan(supabase as unknown as SupabaseClient, params);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(d.title);
  ws.addRow([d.title]).font = { bold: true, size: 14 };
  ws.addRow([`Periode: ${d.periode}`]);
  if (d.notes.length) ws.addRow([`Difilter — ${d.notes.join(' · ')}`]);
  ws.addRow([]);
  const head = ws.addRow(d.columns);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7C66' } }; });
  d.rows.forEach((r) => ws.addRow(r));
  if (d.footer) ws.addRow(d.footer).font = { bold: true };
  ws.columns = d.columns.map((_, i) => ({ width: i === 0 ? 30 : i === 2 && d.scope === 'event' ? 40 : 20 }));

  const buf = await wb.xlsx.writeBuffer();
  const name = `${d.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
}
