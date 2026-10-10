// lib/supabase/server.ts
// Dipakai di Server Components, Server Actions, dan Route Handlers.
import { cache } from 'react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Satu client per permintaan (React `cache`). Layout dan halaman yang memanggil
 * createClient() di permintaan yang sama memakai client yang sama, dan
 * `auth.getUser()` hanya benar-benar menghubungi server Supabase SATU kali per permintaan
 * (sebelumnya 2-3 kali, tiap kali ~ satu perjalanan jaringan). Ini mempercepat pindah menu.
 * Di luar render (Server Action / Route Handler) `cache` tidak menyimpan apa-apa, jadi
 * perilakunya sama seperti sebelumnya — tidak ada data basi.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component — boleh diabaikan kalau ada
            // middleware yang me-refresh session.
          }
        },
      },
    }
  );

  // getUser() tanpa argumen: jawaban dipakai ulang selama permintaan ini.
  const original = supabase.auth.getUser.bind(supabase.auth);
  let once: ReturnType<typeof original> | null = null;
  supabase.auth.getUser = ((jwt?: string) => {
    if (jwt) return original(jwt);
    if (!once) once = original();
    return once;
  }) as typeof original;

  return supabase;
});
