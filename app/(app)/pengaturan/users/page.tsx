import Link from 'next/link';
import { Plus, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { emailMap, ROLE_COLOR, roleLabel } from '@/lib/users';

export const dynamic = 'force-dynamic';

// Port dari viewListUsers() di mockup.
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle();
  if (!isSuperadmin(me as unknown as Profile | null)) {
    return (<div><PageHeader title="Kelola User" /><p className="text-sm text-muted">Hanya superadmin yang bisa mengakses halaman ini.</p></div>);
  }
  const { data: users } = await supabase.from('profiles').select('id, nama, role, active').order('role', { ascending: false }).order('nama').returns<Profile[]>();
  const emails = await emailMap();
  const list = users || [];

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Kelola User" sub={`${list.length} akun`}
        right={<Link href="/pengaturan/users/baru" className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center" aria-label="Tambah user"><Plus size={16} /></Link>}
      />
      <div className="flex flex-col gap-2">
        {list.map((u) => {
          const c = ROLE_COLOR[u.role];
          return (
            <Link key={u.id} href={`/pengaturan/users/${u.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-[11px]" style={{ opacity: u.active ? 1 : 0.55 }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: c + '22', color: c }}><User size={16} /></span>
              <span className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{u.nama}{u.id === user?.id ? ' (Anda)' : ''}</div>
                <div className="text-[11.5px] text-muted mt-px truncate">{emails.get(u.id) || '—'}</div>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: c + '22', color: c }}>{roleLabel(u.role)}</span>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: u.active ? 'var(--accent-light, #E6EFFC)' : '#EFF4FB', color: u.active ? 'var(--accent)' : '#62718A' }}>{u.active ? 'Aktif' : 'Nonaktif'}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
