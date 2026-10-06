import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { buildLaporan } from '@/lib/laporan';
import { LaporanPdf } from '@/lib/laporan-pdf';
import type { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const d = await buildLaporan(supabase as unknown as SupabaseClient, params);
  const buf = await renderToBuffer(LaporanPdf({ data: d }));
  const name = `${d.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"` },
  });
}
