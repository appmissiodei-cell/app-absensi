import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { CgForm } from '@/components/cg/CgForm';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const { data: ms } = await supabase.from('members').select('id, nama_baptis, nama_lengkap').order('nama_lengkap').returns<{ id: string; nama_baptis: string; nama_lengkap: string }[]>();
  const members = (ms || []).map((m) => ({ id: m.id, nama: `${m.nama_baptis} ${m.nama_lengkap}`.trim() }));
  return (
    <div>
      <PageHeader title="Tambah Cell Group" />
      <CgForm nama="" koordinatorId="" members={members} memberCount={0} cancelHref="/cell-group" canDelete={false} />
    </div>
  );
}
