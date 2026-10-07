import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { MemberForm, type MemberFormValues } from '@/components/members/MemberForm';

export const dynamic = 'force-dynamic';

// Nilai awal didefinisikan di sini (Server Component). Jangan impor objek dari file
// 'use client' ke server: yang terbawa hanya referensi, bukan isinya -> form crash.
const emptyMember = (cellGroupId: string): MemberFormValues => ({
  nama_baptis: '',
  nama_lengkap: '',
  nik: '',
  no_hp: '',
  email: '',
  cell_group_id: cellGroupId,
  pelayanan: [],
  tanggal_lahir: '',
  wedding_anniversary: '',
  status: 'Aktif',
});

export default async function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = await createClient();
  const { data: cgs } = await supabase.from('cell_groups').select('id, nama').order('nama').returns<{ id: string; nama: string }[]>();
  return (
    <div>
      <PageHeader title="Tambah Anggota" />
      <MemberForm initial={emptyMember(searchParams.cg || '')} cellGroups={cgs || []} cancelHref="/anggota" />
    </div>
  );
}
