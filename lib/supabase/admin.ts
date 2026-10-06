// lib/supabase/admin.ts
//
// !! HANYA dipakai di server (Route Handler / Server Action) !!
// Pakai SUPABASE_SERVICE_ROLE_KEY — bypass RLS sepenuhnya.
// JANGAN pernah import file ini dari Client Component atau expose
// hasilnya ke browser tanpa filter.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
