import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { MemberForm, type MemberFormValues } from '@/components/members/MemberForm';

export const dynamic = 'force-dynamic';

type Row = {
  id: string; nama_baptis: string; nama_lengkap: string; nik: string | null; no_hp: string | null; email: string | null;
  cell_group_id: string | null; pelayanan: string[]; tanggal_lahir: string | null; wedding_anniversary: string | null;
  status: 'Aktif' | 'Tidak Aktif';
};

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: m }, { data: cgs }, { data: profile }] = await Promise.all([
    supabase.from('members').select('*').eq('id', params.id).maybeSingle<Row>(),
    supabase.from('cell_groups').select('id, nama').order('nama').returns<{ id: string; nama: string }[]>(),
    supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle(),
  ]);
  if (!m) notFound();

  const initial: MemberFormValues = {
    id: m.id,
    nama_baptis: m.nama_baptis,
    nama_lengkap: m.nama_lengkap,
    nik: m.nik ?? '',
    no_hp: m.no_hp ?? '',
    email: m.email ?? '',
    cell_group_id: m.cell_group_id ?? '',
    pelayanan: m.pelayanan,
    tanggal_lahir: m.tanggal_lahir ?? '',
    wedding_anniversary: m.wedding_anniversary ?? '',
    status: m.status,
  };

  return (
    <div>
      <PageHeader title="Edit Anggota" sub={`${m.nama_baptis} ${m.nama_lengkap}`.trim()} />
      <MemberForm initial={initial} cellGroups={cgs || []} cancelHref={`/anggota/${m.id}`} canDelete={isSuperadmin(profile as unknown as Profile | null)} />
    </div>
  );
}
