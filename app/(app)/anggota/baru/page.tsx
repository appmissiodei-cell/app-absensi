import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { MemberForm, EMPTY_MEMBER } from '@/components/members/MemberForm';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const { data: cgs } = await supabase.from('cell_groups').select('id, nama').order('nama').returns<{ id: string; nama: string }[]>();
  return (
    <div>
      <PageHeader title="Tambah Anggota" />
      <MemberForm initial={{ ...EMPTY_MEMBER, cell_group_id: searchParams.cg || '' }} cellGroups={cgs || []} cancelHref="/anggota" />
    </div>
  );
}
