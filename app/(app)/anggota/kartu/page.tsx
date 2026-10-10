import Link from 'next/link';
import { QrCode, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/filter/FilterBar';
import { CardShare } from '@/components/card/CardShare';
import { RegenerateToken } from '@/components/card/RegenerateToken';
import { avatarColor, initialsOf } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type M = { id: string; nama_baptis: string; nama_lengkap: string; status: string; qr_token: string; cell_groups: { nama: string } | null };

export default async function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('members')
    .select('id, nama_baptis, nama_lengkap, status, qr_token, cell_groups!members_cell_group_id_fkey(nama)')
    .order('nama_baptis')
    .returns<M[]>();
  const q = (searchParams.q || '').toLowerCase();
  const list = (data || []).filter((m) => !q || `${m.nama_baptis} ${m.nama_lengkap}`.toLowerCase().includes(q));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Kartu QR Anggota" sub={`${list.length} anggota`} right={<Link href="/anggota" className="text-xs font-semibold text-accent">Kembali</Link>} />
      <FilterBar searchValue={searchParams.q || ''} searchPlaceholder="Cari nama anggota" selects={[]} />
      <div className="space-y-2">
        {list.map((m) => (
          <div key={m.id} className={`bg-card border border-border rounded-2xl p-3 ${m.status === 'Aktif' ? '' : 'opacity-70'}`}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: avatarColor(m.id) }}>
                {initialsOf(m.nama_baptis, m.nama_lengkap)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold truncate">{m.nama_baptis} {m.nama_lengkap}</div>
                <div className="text-[11.5px] text-muted truncate">{m.cell_groups?.nama || 'Belum Masuk CG'}{m.status !== 'Aktif' && ' · Tidak Aktif'}</div>
              </div>
              <QrCode size={16} className="text-muted2 flex-shrink-0" />
            </div>
            <div className="mt-2.5">
              <CardShare
                token={m.qr_token} namaBaptis={m.nama_baptis} namaLengkap={m.nama_lengkap} cgNama={m.cell_groups?.nama ?? null}
                extra={
                  <>
                    <Link href={`/anggota/${m.id}/kartu`} className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold"><Eye size={14} />Lihat</Link>
                    <RegenerateToken memberId={m.id} />
                  </>
                }
              />
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-muted2 py-6 text-center">Tidak ada anggota yang cocok.</div>}
      </div>
    </div>
  );
}
