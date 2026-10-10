import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MemberCard } from '@/components/card/MemberCard';
import { CardShare } from '@/components/card/CardShare';
import { qrPayload, qrSvg } from '@/lib/qr';

export const dynamic = 'force-dynamic';

type M = { id: string; nama_baptis: string; nama_lengkap: string; status: string; qr_token: string; cell_groups: { nama: string } | null };

// Pratinjau kartu seperti yang dilihat anggota (di dalam aplikasi admin).
export default async function Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: m } = await supabase
    .from('members')
    .select('id, nama_baptis, nama_lengkap, status, qr_token, cell_groups!members_cell_group_id_fkey(nama)')
    .eq('id', params.id)
    .maybeSingle<M>();
  if (!m) notFound();
  const svg = await qrSvg(qrPayload(m.qr_token));

  return (
    <div className="max-w-[380px] mx-auto">
      <div className="flex items-center gap-2.5 bg-amber-light text-amber rounded-xl px-3 py-2.5 mb-3.5 text-xs font-semibold">
        <Link href={`/anggota/${m.id}`} className="w-9 h-9 rounded-[10px] bg-card border border-border text-text flex items-center justify-center flex-shrink-0" aria-label="Kembali"><ArrowLeft size={16} /></Link>
        <span className="leading-snug">Pratinjau: ini tampilan yang dilihat anggota saat membuka link kartunya (tanpa login, tanpa menu aplikasi).</span>
      </div>
      <MemberCard namaBaptis={m.nama_baptis} namaLengkap={m.nama_lengkap} cgNama={m.cell_groups?.nama ?? null} qrSvgHtml={svg} inactive={m.status !== 'Aktif'} />
      <div className="mt-3.5 flex justify-center">
        <CardShare token={m.qr_token} namaBaptis={m.nama_baptis} namaLengkap={m.nama_lengkap} cgNama={m.cell_groups?.nama ?? null} />
      </div>
    </div>
  );
}
