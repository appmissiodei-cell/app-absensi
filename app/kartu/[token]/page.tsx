import type { Metadata } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { MemberCard } from '@/components/card/MemberCard';
import { CardShare } from '@/components/card/CardShare';
import { qrPayload, qrSvg } from '@/lib/qr';

// Halaman kartu anggota PUBLIK (tanpa login). Tidak boleh diindeks mesin pencari.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Kartu Anggota — Komunitas Missio Dei',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type Card = { nama_baptis: string; nama_lengkap: string; cell_group_nama: string | null; status: string };

export default async function KartuPage({ params }: { params: { token: string } }) {
  const token = params.token.toLowerCase();
  let card: Card | null = null;
  if (/^[a-f0-9]{32,128}$/.test(token)) {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase.rpc('get_card_by_token', { p_token: token });
    card = (Array.isArray(data) ? (data[0] as Card | undefined) : undefined) ?? null;
  }

  if (!card) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg px-6">
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-blue.png" alt="Missio Dei" className="w-24 h-auto mx-auto mb-3" />
          <h1 className="text-lg font-extrabold">Kartu tidak ditemukan</h1>
          <p className="text-sm text-muted mt-1">Link ini sudah tidak berlaku atau salah. Minta link kartu yang baru ke pengurus komunitas.</p>
        </div>
      </main>
    );
  }

  const svg = await qrSvg(qrPayload(token));
  return (
    <main className="min-h-screen bg-bg px-4 py-6">
      <div className="max-w-[380px] mx-auto">
        <MemberCard namaBaptis={card.nama_baptis} namaLengkap={card.nama_lengkap} cgNama={card.cell_group_nama} qrSvgHtml={svg} inactive={card.status !== 'Aktif'} />
        <div className="mt-3.5 flex justify-center">
          <CardShare token={token} namaBaptis={card.nama_baptis} namaLengkap={card.nama_lengkap} cgNama={card.cell_group_nama} />
        </div>
        <p className="text-[11.5px] text-muted2 text-center mt-3.5 px-2">Simpan link ini di bookmark atau tambahkan ke layar utama HP supaya cepat dibuka saat absen. Jangan bagikan ke orang lain.</p>
      </div>
    </main>
  );
}
