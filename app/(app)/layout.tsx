import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomNav } from '@/components/nav/BottomNav';
import type { Profile } from '@/lib/permissions';
import { signOut } from './pengaturan/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Lihat catatan di types/database.types.ts: placeholder ini belum punya
  // metadata lengkap yang dipakai postgrest-js untuk inferensi penuh,
  // jadi hasil query di-cast manual lewat `unknown` sampai types asli
  // di-generate (`supabase gen types ...`).
  const { data: profileRaw, error: profileErr } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user.id).single();
  const typedProfile = profileRaw as unknown as Profile | null;

  // Profil tidak terbaca / akun nonaktif: JANGAN redirect ke /login — middleware
  // akan melempar balik ke "/" (cookie sesi belum terhapus) sehingga terjadi
  // loop. Tampilkan pesan + tombol keluar (server action, bisa menghapus cookie).
  if (!typedProfile || !typedProfile.active) {
    const inactive = !!typedProfile && !typedProfile.active;
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg px-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6">
          <h1 className="text-lg font-extrabold text-text mb-2">
            {inactive ? 'Akun dinonaktifkan' : 'Profil akun tidak dapat dibaca'}
          </h1>
          <p className="text-sm text-muted mb-3">
            {inactive
              ? 'Akun ini sudah dinonaktifkan. Hubungi superadmin.'
              : 'Login berhasil, tetapi data profil tidak bisa dibaca dari database. Kirim pesan di bawah ini ke pengelola aplikasi.'}
          </p>
          {!inactive && (
            <pre className="text-xs bg-bg border border-border rounded-lg p-3 mb-4 whitespace-pre-wrap break-words">
              {profileErr ? `${profileErr.code ?? ''} ${profileErr.message}` : 'Baris profil tidak ditemukan untuk user ini.'}
            </pre>
          )}
          <form action={signOut}>
            <button type="submit" className="w-full rounded-xl bg-accent text-white font-bold py-3 text-sm">
              Keluar
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="lg:flex min-h-screen">
      <Sidebar isSuperadmin={typedProfile.role === 'superadmin'} />
      <div className="flex-1 min-w-0">
        <main className="px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8 max-w-none">
          {children}
        </main>
      </div>
      <BottomNav />
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
    </div>
  );
}
