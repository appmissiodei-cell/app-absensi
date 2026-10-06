import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomNav } from '@/components/nav/BottomNav';
import type { Profile } from '@/lib/permissions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Lihat catatan di types/database.types.ts: placeholder ini belum punya
  // metadata lengkap yang dipakai postgrest-js untuk inferensi penuh,
  // jadi hasil query di-cast manual lewat `unknown` sampai types asli
  // di-generate (`supabase gen types ...`).
  const { data: profileRaw } = await supabase.from('profiles').select('id, nama, role, active').eq('id', user.id).single();
  const typedProfile = profileRaw as unknown as Profile | null;

  // Defense-in-depth: middleware sudah redirect kalau belum login, ini
  // menutup kasus profil belum ada / user dinonaktifkan setelah login.
  if (!typedProfile || !typedProfile.active) {
    await supabase.auth.signOut();
    redirect('/login');
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
