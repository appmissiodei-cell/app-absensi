// lib/supabase/client.ts
// Dipakai di Client Components ('use client').
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  // Fallback hanya agar `next build` tidak gagal bila env belum diisi.
  // Saat dipakai sungguhan, env Vercel yang asli selalu terbaca.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
