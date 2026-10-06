import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserCreateForm } from '@/components/users/UserCreateForm';
import { isSuperadmin, type Profile } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle();
  if (!isSuperadmin(me as unknown as Profile | null)) {
    return (<div><PageHeader title="Tambah User" /><p className="text-sm text-muted">Hanya superadmin yang bisa mengakses halaman ini.</p></div>);
  }
  return (<div><PageHeader title="Tambah User" /><UserCreateForm /></div>);
}
