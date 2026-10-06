import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { CgForm } from '@/components/cg/CgForm';
import { isSuperadmin, type Profile } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

type Cg = { id: string; nama: string; koordinator_id: string | null };
type M = { id: string; nama_baptis: string; nama_lengkap: string; cell_group_id: string | null };

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: cg }, { data: ms }, { data: profile }] = await Promise.all([
    supabase.from('cell_groups').select('id, nama, koordinator_id').eq('id', params.id).maybeSingle<Cg>(),
    supabase.from('members').select('id, nama_baptis, nama_lengkap, cell_group_id').order('nama_lengkap').returns<M[]>(),
    supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle(),
  ]);
  if (!cg) notFound();
  const members = (ms || []).map((m) => ({ id: m.id, nama: `${m.nama_baptis} ${m.nama_lengkap}`.trim() }));
  const memberCount = (ms || []).filter((m) => m.cell_group_id === cg.id).length;
  return (
    <div>
      <PageHeader title="Edit Cell Group" sub={cg.nama} />
      <CgForm
        id={cg.id} nama={cg.nama} koordinatorId={cg.koordinator_id ?? ''} members={members} memberCount={memberCount}
        cancelHref={`/cell-group/${cg.id}`} canDelete={isSuperadmin(profile as unknown as Profile | null)}
      />
    </div>
  );
}
