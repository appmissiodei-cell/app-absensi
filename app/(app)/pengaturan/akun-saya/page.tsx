import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PasswordBox } from '@/components/users/PasswordBox';
import { SignOutButton } from '@/components/users/UserActions';
import { resetMyPassword } from '../actions';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { ROLE_COLOR, roleLabel } from '@/lib/users';

export const dynamic = 'force-dynamic';

// Port dari viewMyAccount() di mockup.
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle();
  const me = data as unknown as Profile | null;
  if (!user || !me) return <p className="text-sm text-muted">Akun tidak ditemukan.</p>;
  const c = ROLE_COLOR[me.role];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center" aria-label="Kembali"><ArrowLeft size={16} /></Link>
        <h1 className="text-lg font-extrabold">Akun Saya</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-[22px] text-center">
        <span className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: c + '22', color: c }}><User size={24} /></span>
        <div className="text-base font-extrabold mt-3">{me.nama}</div>
        <div className="text-xs text-muted mt-0.5">{user.email}</div>
        <span className="inline-block text-[11px] font-bold px-2 py-1 rounded-full mt-2" style={{ background: c + '22', color: c }}>{roleLabel(me.role)}</span>
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-[18px] mb-2">Kata Sandi</div>
      <PasswordBox resetAction={resetMyPassword} confirmTitle="Buat password baru?" />

      {isSuperadmin(me) && (
        <Link href="/pengaturan/users" className="block text-center mt-4 rounded-xl border border-border bg-bg font-bold py-2.5 text-sm">Kelola Semua User</Link>
      )}
      <SignOutButton />
    </div>
  );
}
