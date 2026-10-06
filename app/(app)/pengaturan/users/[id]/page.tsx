import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PasswordBox } from '@/components/users/PasswordBox';
import { ToggleActiveButton } from '@/components/users/UserActions';
import { resetUserPassword } from '../../actions';
import { isSuperadmin, type Profile } from '@/lib/permissions';
import { emailOf, ROLE_COLOR, roleLabel } from '@/lib/users';

export const dynamic = 'force-dynamic';

// Port dari viewUserDetail() di mockup.
export default async function Page({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user?.id ?? '').maybeSingle();
  if (!isSuperadmin(me as unknown as Profile | null)) return <p className="text-sm text-muted">Hanya superadmin yang bisa mengakses halaman ini.</p>;

  const { data: u } = await supabase.from('profiles').select('id, nama, role, active').eq('id', params.id).maybeSingle<Profile>();
  if (!u) notFound();
  const email = await emailOf(u.id);
  const isMe = u.id === user?.id;
  const c = ROLE_COLOR[u.role];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/pengaturan/users" className="w-9 h-9 rounded-lg border border-border bg-bg flex items-center justify-center" aria-label="Kembali"><ArrowLeft size={16} /></Link>
        <h1 className="text-lg font-extrabold">{u.nama}</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 text-center">
        <span className="w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto" style={{ background: c + '22', color: c }}><User size={22} /></span>
        <div className="text-[15px] font-extrabold mt-2.5">{u.nama}{isMe ? ' (Anda)' : ''}</div>
        <div className="text-xs text-muted mt-0.5">{email || '—'}</div>
        <div className="flex gap-1.5 justify-center mt-2">
          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: c + '22', color: c }}>{roleLabel(u.role)}</span>
          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: u.active ? '#E9F5F1' : '#F6F7F4', color: u.active ? '#0E7C66' : '#6C736A' }}>{u.active ? 'Aktif' : 'Nonaktif'}</span>
        </div>
      </div>

      <div className="text-xs font-bold text-muted uppercase mt-[18px] mb-2">Kata Sandi</div>
      <PasswordBox resetAction={resetUserPassword.bind(null, u.id)} confirmTitle={`Buat password baru untuk ${u.nama}?`} />

      {!isMe ? (
        <ToggleActiveButton id={u.id} active={u.active} />
      ) : (
        <div className="text-[11px] text-muted2 mt-3.5 text-center">Tidak bisa menonaktifkan akun sendiri.</div>
      )}
    </div>
  );
}
